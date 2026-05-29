const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const aiModule = require('../ai/ai-module');

// ========== MULTER CONFIG ==========
// Accept ALL file types — filtering happens in ai-module
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const sid = req.body.sessionId || 'anon';
    // Sanitize original filename
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${sid}__${Date.now()}__${safeName}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
  fileFilter: (req, file, cb) => {
    // Accept everything — let the AI module handle type detection
    cb(null, true);
  }
});

// In-memory prescription store


// ========== UPLOAD & ANALYZE ==========
router.post('/upload-report', upload.single('document'), async (req, res) => {
  const sessionId = req.body.sessionId;
  const linkUrl = req.body.linkUrl;

  if (!sessionId) {
    return res.status(401).json({ error: 'No session ID provided.' });
  }
  if (!req.file && !linkUrl) {
    return res.status(400).json({ error: 'Please upload a file or provide a URL.' });
  }

  try {
    const targetPath = req.file ? req.file.path : linkUrl;
    const fileName = req.file ? req.file.originalname : linkUrl;

    console.log(`📄 Processing: ${fileName} (session: ${sessionId})`);

    // Step 1: Extract text
    const extractedText = await aiModule.extractTextFromFile(targetPath);

    if (!extractedText || extractedText.trim().length < 3) {
      return res.status(400).json({ error: 'Could not extract any text from the file. Try a different format.' });
    }

    console.log(`✅ Extracted ${extractedText.length} chars from ${fileName}`);

    // Step 2: Risk detection — expanded for all medical documents
    const textLower = extractedText.toLowerCase();
    const criticalKeywords = ['critical', 'emergency', 'life threatening', 'icu', 'ventilator'];
    const riskKeywords = ['high risk', 'high bp', 'high blood pressure', 'hypertension', 'high sugar',
      'diabetes', 'low hemoglobin', 'anemia', 'abnormal', 'elevated', 'low platelet',
      'referral', 'higher referral', 'complication', 'surgery', 'tumor', 'cancer',
      'malignant', 'fracture', 'infection', 'sepsis'];
    const isCritical = criticalKeywords.some(k => textLower.includes(k));

    // Step 3: Extract vitals FIRST (needed for score)
    const vitals = aiModule.extractVitals(extractedText);

    // Step 4: Health score from ACTUAL extracted vitals + text risk analysis
    let healthScore = 100;
    if (vitals.length > 0) {
      vitals.forEach(v => {
        if (v.status === 'high') healthScore -= 12;
        else if (v.status === 'low') healthScore -= 8;
      });
    }
    // ALWAYS check text for risk keywords (even when vitals exist)
    const scoreDeductions = [
      { pattern: /high\s*risk/i, points: 20 },
      { pattern: /higher\s*referral|refer.*specialist|refer.*hospital/i, points: 15 },
      { pattern: /high bp|high blood pressure|hypertension/i, points: 15 },
      { pattern: /high sugar|diabetes|diabetic|high glucose/i, points: 20 },
      { pattern: /high cholesterol|elevated cholesterol/i, points: 15 },
      { pattern: /low hemoglobin|anemia|anaemia/i, points: 10 },
      { pattern: /critical|emergency|urgent|immediate/i, points: 25 },
      { pattern: /abnormal|elevated|out of range/i, points: 8 },
      { pattern: /surgery|operate|operation/i, points: 12 },
      { pattern: /tumor|cancer|malignant|carcinoma/i, points: 25 },
      { pattern: /fracture|broken bone/i, points: 10 },
      { pattern: /infection|sepsis|septic/i, points: 15 },
      { pattern: /complication|complicated/i, points: 10 },
      { pattern: /pregnant.*risk|risk.*pregnan/i, points: 15 },
    ];
    scoreDeductions.forEach(({ pattern, points }) => {
      if (pattern.test(textLower)) {
        console.log(`  ⚠️ Risk match: ${pattern} → -${points} pts`);
        healthScore -= points;
      }
    });
    if (isCritical) healthScore -= 10;
    healthScore = Math.max(10, Math.min(100, healthScore));
    console.log(`📊 Final health score: ${healthScore} (vitals: ${vitals.length})`);

    // Step 5: AI Analysis (pass vitals for context)
    const analysis = await aiModule.analyzeReport(sessionId, extractedText, vitals);

    console.log(`🧠 Analysis complete for ${fileName} — Score: ${healthScore}, Vitals: ${vitals.length}`);

    // Step 6: Save to Firebase report history
    try {
      const db = require('../config/firebase').getDB();
      await db.collection('reportHistory').add({
        sessionId, fileName, healthScore, isCritical,
        vitalsCount: vitals.length,
        vitals: vitals.slice(0, 10), // store top 10 vitals
        analysisPreview: analysis.substring(0, 500),
        createdAt: new Date().toISOString()
      });
    } catch (e) { console.log('⚠️ Could not save report history:', e.message); }

    res.json({
      success: true,
      message: 'Report analyzed successfully!',
      explanation: analysis,
      isCritical,
      healthScore,
      vitals,
      fileName,
      textLength: extractedText.length
    });

  } catch (error) {
    console.error(`❌ Upload error:`, error.message);

    // Clean up file on error
    if (req.file && fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch {}
    }

    // User-friendly error messages
    let userMessage = error.message;
    if (error.message.includes('not installed')) {
      userMessage = 'Server missing a required library. Contact admin.';
    } else if (error.message.includes('File not found')) {
      userMessage = 'File upload failed. Please try again.';
    }

    res.status(500).json({ error: userMessage });
  }
});

// ========== CHAT ==========
router.post('/chat', async (req, res) => {
  const { message, sessionId } = req.body;
  if (!sessionId) return res.status(401).json({ error: 'No session.' });
  if (!message) return res.status(400).json({ error: 'Message required.' });
  try {
    const reply = await aiModule.chatResponse(sessionId, message);
    res.json({ success: true, reply });
  } catch (error) {
    console.error('Chat error:', error.message);
    res.status(500).json({ error: error.message || 'Chat failed.' });
  }
});

// ========== FILES ==========
router.get('/files', (req, res) => {
  const sessionId = req.query.sessionId;
  if (!sessionId) return res.status(401).json({ error: 'Unauthorized.' });
  try {
    if (!fs.existsSync(uploadDir)) return res.json({ success: true, files: [] });
    const files = fs.readdirSync(uploadDir);
    const userFiles = files.filter(f => f.startsWith(`${sessionId}__`));
    const sorted = userFiles.sort().reverse();
    const fileData = []; const seen = new Set();
    sorted.forEach(filename => {
      const parts = filename.split('__');
      const originalName = parts.length >= 3 ? parts.slice(2).join('__') : filename;
      if (!seen.has(originalName)) {
        seen.add(originalName);
        fileData.push({
          id: filename,
          name: originalName,
          path: `http://localhost:5000/uploads/${encodeURIComponent(filename)}`
        });
      }
    });
    res.json({ success: true, files: fileData });
  } catch (error) {
    res.status(500).json({ error: 'Failed to access files.' });
  }
});

router.delete('/files/:filename', (req, res) => {
  const { filename } = req.params;
  const sessionId = req.query.sessionId;
  if (!sessionId || !filename.startsWith(`${sessionId}__`)) return res.status(403).json({ error: 'Access denied.' });
  const filepath = path.join(uploadDir, filename);
  if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
  res.json({ success: true });
});

// ========== PRESCRIPTIONS (Firebase) ==========
router.post('/add-prescription', async (req, res) => {
  const { sessionId, medicineName, timings } = req.body;
  if (!sessionId) return res.status(401).json({ error: 'Unauthorized.' });
  try {
    const db = require('../config/firebase').getDB();
    const newRx = { sessionId, medicineName, timings, createdAt: new Date().toISOString() };
    const docRef = await db.collection('prescriptions').add(newRx);
    res.json({ success: true, prescription: { id: docRef.id, ...newRx } });
  } catch (err) {
    console.error('Prescription add error:', err.message);
    res.status(500).json({ error: 'Failed to save prescription.' });
  }
});

router.get('/prescriptions', async (req, res) => {
  const sessionId = req.query.sessionId;
  if (!sessionId) return res.status(401).json({ error: 'Unauthorized.' });
  try {
    const db = require('../config/firebase').getDB();
    const snap = await db.collection('prescriptions').where('sessionId', '==', sessionId).get();
    const prescriptions = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json({ success: true, prescriptions });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load prescriptions.' });
  }
});

router.delete('/prescriptions/:id', async (req, res) => {
  const sessionId = req.body.sessionId || req.query.sessionId;
  if (!sessionId) return res.status(401).json({ error: 'Unauthorized.' });
  try {
    const db = require('../config/firebase').getDB();
    await db.collection('prescriptions').doc(req.params.id).delete();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete prescription.' });
  }
});

// ========== REPORT HISTORY (Firebase) ==========
router.get('/report-history', async (req, res) => {
  const sessionId = req.query.sessionId;
  if (!sessionId) return res.status(401).json({ error: 'Unauthorized.' });
  try {
    const db = require('../config/firebase').getDB();
    const snap = await db.collection('reportHistory').where('sessionId', '==', sessionId).get();
    const reports = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    reports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ success: true, reports });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load report history.' });
  }
});

module.exports = router;
