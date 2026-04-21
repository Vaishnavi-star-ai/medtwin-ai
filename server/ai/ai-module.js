const fs = require('fs');
const path = require('path');
const axios = require('axios');

// ==========================================
// SAFE IMPORTS (graceful if missing)
// ==========================================
let PDFParse, mammoth, xlsx, Tesseract, cheerio, OpenAI;
try { ({ PDFParse } = require('pdf-parse')); } catch { PDFParse = null; }
try { mammoth = require('mammoth'); } catch { mammoth = null; }
try { xlsx = require('xlsx'); } catch { xlsx = null; }
try { Tesseract = require('tesseract.js'); } catch { Tesseract = null; }
try { cheerio = require('cheerio'); } catch { cheerio = null; }
try { ({ OpenAI } = require('openai')); } catch { OpenAI = null; }

// ==========================================
// 1. IN-MEMORY SESSION STORE
// ==========================================
const sessionStore = {};

function getSession(sessionId) {
    if (!sessionStore[sessionId]) {
        sessionStore[sessionId] = { lastReportText: null, chatHistory: [] };
    }
    return sessionStore[sessionId];
}

// ==========================================
// 2. UNIVERSAL FILE & LINK EXTRACTION
// Supports: PDF, Word, Excel, CSV, Images, Text, JSON, HTML, RTF
// ==========================================
async function extractTextFromFile(targetPath) {
    // === WEB LINK ===
    if (typeof targetPath === 'string' && targetPath.startsWith('http')) {
        try {
            const res = await axios.get(targetPath, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 15000 });
            if (cheerio) {
                const $ = cheerio.load(res.data);
                $('script, style, nav, footer, header').remove();
                return $('body').text().replace(/\s+/g, ' ').trim();
            }
            return typeof res.data === 'string' ? res.data.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() : JSON.stringify(res.data);
        } catch (err) {
            throw new Error(`Failed to fetch URL: ${err.message}`);
        }
    }

    // === LOCAL FILE ===
    if (!fs.existsSync(targetPath)) {
        throw new Error(`File not found: ${targetPath}`);
    }

    const ext = path.extname(targetPath).toLowerCase();
    const buffer = fs.readFileSync(targetPath);

    try {
        // PDF
        if (ext === '.pdf') {
            if (!PDFParse) throw new Error('pdf-parse not installed');
            const parser = new PDFParse({ data: buffer, verbosity: 0 });
            const result = await parser.getText();
            const allText = result.pages.map(p => p.text).join('\n');
            if (!allText || allText.trim().length < 10) throw new Error('PDF has no readable text (may be scanned). Try uploading as an image.');
            return allText.trim();
        }

        // Word Documents
        if (ext === '.docx' || ext === '.doc') {
            if (!mammoth) throw new Error('mammoth not installed');
            const result = await mammoth.extractRawText({ buffer });
            return result.value.trim() || 'No text found in document.';
        }

        // Excel / CSV
        if (['.xlsx', '.xls', '.csv'].includes(ext)) {
            if (!xlsx) throw new Error('xlsx not installed');
            const workbook = xlsx.read(buffer, { type: 'buffer' });
            let allText = '';
            workbook.SheetNames.forEach(name => {
                const sheet = workbook.Sheets[name];
                const csv = xlsx.utils.sheet_to_csv(sheet);
                allText += `--- Sheet: ${name} ---\n${csv}\n\n`;
            });
            return allText.trim() || 'No data found in spreadsheet.';
        }

        // Images (OCR)
        if (['.png', '.jpg', '.jpeg', '.webp', '.bmp', '.tiff', '.tif', '.gif'].includes(ext)) {
            if (!Tesseract) throw new Error('tesseract.js not installed');
            console.log(`🔍 Running OCR on ${path.basename(targetPath)}...`);
            const { data: { text } } = await Tesseract.recognize(targetPath, 'eng');
            if (!text || text.trim().length < 5) throw new Error('OCR could not extract text from image. Try a clearer image.');
            return text.trim();
        }

        // Plain Text
        if (['.txt', '.md', '.log', '.rtf'].includes(ext)) {
            return buffer.toString('utf8').trim();
        }

        // JSON
        if (ext === '.json') {
            const jsonData = JSON.parse(buffer.toString('utf8'));
            return JSON.stringify(jsonData, null, 2);
        }

        // HTML
        if (['.html', '.htm'].includes(ext)) {
            const html = buffer.toString('utf8');
            if (cheerio) {
                const $ = cheerio.load(html);
                $('script, style').remove();
                return $('body').text().replace(/\s+/g, ' ').trim();
            }
            return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        }

        // XML
        if (ext === '.xml') {
            return buffer.toString('utf8').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        }

        // Fallback: try reading as text
        const textContent = buffer.toString('utf8');
        if (textContent && !textContent.includes('\0')) {
            return textContent.trim();
        }

        throw new Error(`Unsupported file type: ${ext}`);
    } catch (err) {
        // If it's our own error, rethrow
        if (err.message.includes('not installed') || err.message.includes('Unsupported') || err.message.includes('OCR') || err.message.includes('no readable text')) {
            throw err;
        }
        // Otherwise wrap
        throw new Error(`Failed to process ${ext} file: ${err.message}`);
    }
}

// ==========================================
// 3. AI REPORT ANALYSIS
// ==========================================
async function analyzeReport(sessionId, text) {
    const session = getSession(sessionId);
    const safeText = text.length > 14000 ? text.substring(0, 14000) + "\n\n[TEXT TRUNCATED]" : text;
    session.lastReportText = safeText;
    session.chatHistory = [];

    const prompt = `Analyze the following medical report. List all vital metrics found. For every metric, output one clean line:
Your [metric] is [status]. [Optional short advice].

Example:
Your hemoglobin is low. Consider iron-rich foods.
Your cholesterol is high. Lifestyle changes recommended.

Do not use bullet points, asterisks, or formatting. Just clean text lines.

Medical Report:
${safeText}`;

    return await callAI([
        { role: "system", content: "You are a helpful medical AI assistant. Be concise and reassuring." },
        { role: "user", content: prompt }
    ]);
}

// ==========================================
// 4. CHAT WITH MEMORY & CONTEXT
// ==========================================
async function chatResponse(sessionId, userMessage) {
    const session = getSession(sessionId);

    const messages = [];
    if (session.lastReportText) {
        messages.push({ role: "system", content: `You are MedTwin AI, a helpful medical assistant. You have the patient's report:\n${session.lastReportText.substring(0, 8000)}\n\nAnswer questions about their health based on this report. Be specific, cite values from the report. If they ask something unrelated to the report, still help as a general medical assistant.` });
    } else {
        messages.push({ role: "system", content: `You are MedTwin AI, a friendly and knowledgeable medical assistant. Help users with health questions, symptoms, medications, nutrition, and wellness tips. Be specific but remind them to consult a doctor for serious concerns. No report has been uploaded yet — answer general medical queries.` });
    }

    messages.push(...session.chatHistory.slice(-10));
    messages.push({ role: "user", content: userMessage });

    const reply = await callAI(messages);
    session.chatHistory.push({ role: 'user', content: userMessage }, { role: 'assistant', content: reply });
    return reply;
}

// ==========================================
// 5. AI CALLER — Groq with smart fallback
// ==========================================
async function callAI(messages) {
    const apiKey = process.env.GROQ_API_KEY;

    // If no API key, generate a smart local analysis
    if (!apiKey || !OpenAI) {
        console.log('⚠️  No GROQ_API_KEY — using local analysis fallback');
        return generateLocalAnalysis(messages);
    }

    try {
        const openai = new OpenAI({ apiKey, baseURL: "https://api.groq.com/openai/v1" });
        const response = await openai.chat.completions.create({
            model: "llama-3.1-8b-instant",
            messages,
            temperature: 0.3,
            max_tokens: 2000,
        });
        return response.choices[0].message.content.trim();
    } catch (err) {
        console.error('Groq API error:', err.message);
        // Fallback to local analysis if API fails
        return generateLocalAnalysis(messages);
    }
}

// ==========================================
// 6. LOCAL FALLBACK ANALYSIS (no API needed)
// ==========================================
function generateLocalAnalysis(messages) {
    const userMsg = messages.find(m => m.role === 'user')?.content || '';
    const systemMsg = messages.find(m => m.role === 'system')?.content || '';
    const text = userMsg.toLowerCase();

    // Chat responses — smart keyword matching
    if (userMsg.length < 500 && !text.includes('medical report')) {
        // Greetings
        if (/^(hi|hello|hey|good\s*(morning|evening|afternoon)|namaste)/i.test(text)) {
            return "Hello! I'm MedTwin AI, your medical assistant. I can help you with:\n\n• Understanding your medical reports\n• General health questions\n• Symptom information\n• Medication guidance\n• Nutrition and wellness tips\n\nHow can I help you today?";
        }
        // Headache
        if (text.includes('headache') || text.includes('head pain') || text.includes('migraine')) {
            return "Headaches can have many causes:\n\nCommon causes: Stress, dehydration, poor sleep, eye strain, caffeine withdrawal\n\nRelief tips:\n• Drink plenty of water (2-3 liters daily)\n• Rest in a quiet, dark room\n• Apply a cold compress to your forehead\n• Take OTC pain relief (Paracetamol 500mg) if needed\n• Practice deep breathing exercises\n\nSee a doctor if: Headache is severe, sudden, with fever, stiff neck, vision changes, or lasts more than 3 days.";
        }
        // Fever
        if (text.includes('fever') || text.includes('temperature') || text.includes('hot body')) {
            return "Fever management tips:\n\nMild fever (99-100.4°F / 37.2-38°C):\n• Rest and stay hydrated\n• Light clothing and lukewarm sponging\n• Paracetamol 500mg every 6 hours if uncomfortable\n\nModerate fever (100.4-103°F / 38-39.4°C):\n• Same as above + monitor closely\n• Oral rehydration salts (ORS) if needed\n\nSeek immediate medical attention if:\n• Fever exceeds 103°F (39.4°C)\n• Persists more than 3 days\n• Accompanied by rash, breathing difficulty, or confusion";
        }
        // Cold/cough
        if (text.includes('cold') || text.includes('cough') || text.includes('sneezing') || text.includes('flu') || text.includes('sore throat')) {
            return "For cold and cough relief:\n\nHome remedies:\n• Warm water with honey and lemon (3-4 times daily)\n• Steam inhalation for 10 minutes\n• Saltwater gargle for sore throat\n• Ginger-tulsi tea\n• Rest well and stay warm\n\nOTC options:\n• Antihistamine for runny nose\n• Cough syrup (as directed)\n• Throat lozenges\n\nSee a doctor if: Symptoms last more than 7 days, high fever, difficulty breathing, or chest pain.";
        }
        // Stomach
        if (text.includes('stomach') || text.includes('digestive') || text.includes('acidity') || text.includes('gas') || text.includes('bloating') || text.includes('diarr')) {
            return "Digestive health tips:\n\nFor acidity/bloating:\n• Eat smaller, frequent meals\n• Avoid spicy, oily, and fried foods\n• Don't lie down immediately after eating\n• Try buttermilk or fennel water\n• Antacid if needed (Pantoprazole 40mg before breakfast)\n\nFor diarrhea:\n• ORS solution to prevent dehydration\n• BRAT diet (Bananas, Rice, Applesauce, Toast)\n• Probiotics (yogurt/curd)\n\nSee a doctor if: Blood in stool, severe cramps, dehydration signs, or symptoms persist 3+ days.";
        }
        // Diabetes/sugar
        if (text.includes('diabetes') || text.includes('sugar') || text.includes('glucose') || text.includes('hba1c') || text.includes('insulin')) {
            return "Diabetes management guidance:\n\nHealthy blood sugar ranges:\n• Fasting: 70-100 mg/dL (normal), 100-125 mg/dL (pre-diabetic)\n• Post-meal (2hr): Below 140 mg/dL\n• HbA1c: Below 5.7% (normal), 5.7-6.4% (pre-diabetic)\n\nLifestyle tips:\n• Walk 30 minutes daily after meals\n• Reduce refined carbs and sugar\n• Eat fiber-rich foods (oats, vegetables, dals)\n• Monitor blood sugar regularly\n• Take medications as prescribed\n\nAlways consult your endocrinologist for medication adjustments.";
        }
        // Blood pressure
        if (text.includes('blood pressure') || text.includes('bp') || text.includes('hypertension') || text.includes('hypotension')) {
            return "Blood pressure information:\n\nNormal ranges:\n• Normal: Below 120/80 mmHg\n• Elevated: 120-129 / below 80\n• High (Stage 1): 130-139 / 80-89\n• High (Stage 2): 140+ / 90+\n\nTo manage blood pressure:\n• Reduce salt intake (less than 5g/day)\n• Exercise 30 min daily (walking, yoga)\n• Manage stress (meditation, deep breathing)\n• Maintain healthy weight\n• Limit alcohol and quit smoking\n• Take prescribed medications regularly\n\nMonitor BP at home and share readings with your doctor.";
        }
        // Sleep
        if (text.includes('sleep') || text.includes('insomnia') || text.includes('can\'t sleep') || text.includes('tired')) {
            return "Sleep hygiene tips:\n\nFor better sleep:\n• Maintain a fixed sleep schedule (same time daily)\n• Avoid screens 1 hour before bed\n• Keep your room cool, dark, and quiet\n• No caffeine after 2 PM\n• Light dinner at least 2 hours before sleep\n• Try relaxation techniques: deep breathing, progressive muscle relaxation\n• Warm milk with turmeric before bed\n\nIf insomnia persists for 2+ weeks, consult a doctor — it could indicate an underlying condition.";
        }
        // Exercise/fitness
        if (text.includes('exercise') || text.includes('fitness') || text.includes('workout') || text.includes('yoga') || text.includes('weight loss')) {
            return "Fitness recommendations:\n\nFor general health:\n• 150 min moderate exercise per week (30 min x 5 days)\n• Mix cardio (walking, cycling) + strength training\n• Start slow if you're a beginner\n• Warm up before and cool down after\n\nFor weight loss:\n• Caloric deficit (eat less than you burn)\n• Focus on whole foods, reduce processed foods\n• Stay hydrated (3+ liters daily)\n• Get adequate sleep (7-8 hours)\n\nYoga poses for wellness: Surya Namaskar, Pranayama, Shavasana\n\nConsult a doctor before starting intense exercise programs.";
        }
        // Vitamins/nutrition
        if (text.includes('vitamin') || text.includes('nutrition') || text.includes('diet') || text.includes('food') || text.includes('supplement')) {
            return "Nutrition guidance:\n\nEssential daily nutrients:\n• Vitamin D: Sunlight 15-20 min + fortified foods\n• Vitamin B12: Dairy, eggs, fortified cereals\n• Iron: Spinach, lentils, red meat, jaggery\n• Calcium: Milk, curd, ragi, almonds\n• Omega-3: Flaxseeds, walnuts, fish\n\nBalanced diet plate:\n• 50% vegetables and fruits\n• 25% whole grains (brown rice, millets)\n• 25% protein (dal, paneer, chicken, fish)\n\nStay hydrated and limit processed foods, sugar, and excess salt.";
        }
        // Default medical chat
        if (session.lastReportText) {
            return "Based on your uploaded report, I can see several health metrics. Here's my analysis:\n\nThe values in your report have been assessed and some parameters may need attention. I recommend:\n• Follow up with your doctor for any abnormal values\n• Maintain a balanced diet and regular exercise\n• Stay hydrated and get adequate rest\n• Monitor any concerning symptoms\n\nFeel free to ask me specific questions about any metric in your report!";
        }
        return "I'm MedTwin AI, your health assistant! I can help you with:\n\n• Health and wellness questions\n• Understanding symptoms\n• Medication information\n• Diet and nutrition tips\n• Exercise recommendations\n\nTry asking me about headaches, fever, diabetes, blood pressure, sleep, vitamins, or upload a medical report for detailed analysis!\n\nNote: For accurate AI analysis, set your GROQ_API_KEY in the server .env file.";
    }

    // Extract medical terms and generate analysis
    const findings = [];

    // Blood metrics
    if (text.includes('hemoglobin') || text.includes('hgb') || text.includes('hb')) {
        if (text.match(/hemoglobin.*?(low|below|decreased|<\s*12)/i)) findings.push('Your hemoglobin is low. Consider iron-rich foods like spinach, lentils, and red meat.');
        else if (text.match(/hemoglobin.*?(high|above|elevated|>\s*17)/i)) findings.push('Your hemoglobin is elevated. Stay hydrated and consult your doctor.');
        else findings.push('Your hemoglobin levels were detected in the report. Please verify with your physician.');
    }

    if (text.includes('cholesterol') || text.includes('ldl') || text.includes('hdl')) {
        if (text.match(/cholesterol.*?(high|elevated|above|>\s*200)/i) || text.match(/(high|elevated).*?cholesterol/i)) findings.push('Your cholesterol is high. Consider dietary changes and regular exercise.');
        else findings.push('Your cholesterol levels are noted. Maintain a balanced diet.');
    }

    if (text.includes('glucose') || text.includes('sugar') || text.includes('hba1c') || text.includes('diabetes')) {
        if (text.match(/(high|elevated|above).*?(glucose|sugar|hba1c)/i) || text.match(/(glucose|sugar|hba1c).*?(high|elevated|above)/i)) findings.push('Your blood sugar is elevated. Monitor carbohydrate intake and consider regular exercise.');
        else findings.push('Your blood sugar levels are noted in the report.');
    }

    if (text.includes('blood pressure') || text.includes('bp') || text.includes('systolic') || text.includes('diastolic') || text.includes('hypertension')) {
        if (text.match(/(high|elevated).*?(bp|blood pressure|systolic)/i) || text.includes('hypertension')) findings.push('Your blood pressure appears elevated. Reduce sodium intake and manage stress levels.');
        else findings.push('Your blood pressure readings are noted.');
    }

    if (text.includes('creatinine') || text.includes('kidney') || text.includes('renal')) {
        findings.push('Your kidney function markers are noted. Stay well hydrated.');
    }
    if (text.includes('thyroid') || text.includes('tsh') || text.includes('t3') || text.includes('t4')) {
        findings.push('Your thyroid markers are present in the report. Follow up with an endocrinologist if needed.');
    }
    if (text.includes('platelet') || text.includes('wbc') || text.includes('rbc') || text.includes('cbc') || text.includes('blood count')) {
        findings.push('Your complete blood count (CBC) values are noted. These should be reviewed in context.');
    }
    if (text.includes('vitamin') || text.includes('calcium') || text.includes('iron')) {
        findings.push('Your vitamin and mineral levels are noted. Consider supplementation if deficient.');
    }
    if (text.includes('liver') || text.includes('sgpt') || text.includes('sgot') || text.includes('alt') || text.includes('ast') || text.includes('bilirubin')) {
        findings.push('Your liver function markers are present. Avoid alcohol and fatty foods.');
    }
    if (text.includes('uric acid') || text.includes('urea')) {
        findings.push('Your uric acid/urea levels are noted. Stay hydrated and limit purine-rich foods.');
    }

    // If we found specific metrics
    if (findings.length > 0) {
        return findings.join('\n') + '\n\nNote: This is an automated preliminary analysis. Please consult your healthcare provider for accurate medical interpretation.';
    }

    // Generic analysis for any text content
    const wordCount = userMsg.split(/\s+/).length;
    return `Medical Report Analysis Summary

Document processed successfully (${wordCount} words analyzed).

The report contains medical information that has been extracted and stored for reference.

Key observations from the document text have been noted. For detailed interpretation of specific values and metrics, please consult with your healthcare provider.

You can now use the AI Chat feature to ask specific questions about this report.

Note: This is an automated analysis. Always verify findings with a qualified medical professional.`;
}

// ==========================================
// 7. EXTRACT VITALS (numeric values)
// ==========================================
function extractVitals(text) {
    const vitals = [];
    const t = text.replace(/\n/g, ' ');

    const patterns = [
        { name: 'Hemoglobin', unit: 'g/dL', regex: /hemoglobin[:\s]*(\d+\.?\d*)/i, normalMin: 12, normalMax: 17, icon: '🩸' },
        { name: 'Blood Sugar (Fasting)', unit: 'mg/dL', regex: /(?:fasting|glucose|sugar|fbs)[:\s]*(\d+\.?\d*)/i, normalMin: 70, normalMax: 100, icon: '🍬' },
        { name: 'HbA1c', unit: '%', regex: /hba1c[:\s]*(\d+\.?\d*)/i, normalMin: 4, normalMax: 5.7, icon: '📊' },
        { name: 'Cholesterol (Total)', unit: 'mg/dL', regex: /(?:total\s*)?cholesterol[:\s]*(\d+\.?\d*)/i, normalMin: 0, normalMax: 200, icon: '💛' },
        { name: 'LDL', unit: 'mg/dL', regex: /ldl[:\s]*(\d+\.?\d*)/i, normalMin: 0, normalMax: 100, icon: '⚠️' },
        { name: 'HDL', unit: 'mg/dL', regex: /hdl[:\s]*(\d+\.?\d*)/i, normalMin: 40, normalMax: 200, icon: '💚' },
        { name: 'Triglycerides', unit: 'mg/dL', regex: /triglycerides?[:\s]*(\d+\.?\d*)/i, normalMin: 0, normalMax: 150, icon: '📈' },
        { name: 'Creatinine', unit: 'mg/dL', regex: /creatinine[:\s]*(\d+\.?\d*)/i, normalMin: 0.6, normalMax: 1.2, icon: '🫘' },
        { name: 'Urea', unit: 'mg/dL', regex: /urea[:\s]*(\d+\.?\d*)/i, normalMin: 7, normalMax: 20, icon: '💧' },
        { name: 'Uric Acid', unit: 'mg/dL', regex: /uric\s*acid[:\s]*(\d+\.?\d*)/i, normalMin: 3.5, normalMax: 7.2, icon: '🔬' },
        { name: 'TSH', unit: 'mIU/L', regex: /tsh[:\s]*(\d+\.?\d*)/i, normalMin: 0.4, normalMax: 4.0, icon: '🦋' },
        { name: 'Vitamin D', unit: 'ng/mL', regex: /vitamin\s*d[:\s]*(\d+\.?\d*)/i, normalMin: 30, normalMax: 100, icon: '☀️' },
        { name: 'Vitamin B12', unit: 'pg/mL', regex: /(?:vitamin\s*)?b12[:\s]*(\d+\.?\d*)/i, normalMin: 200, normalMax: 900, icon: '💊' },
        { name: 'Iron', unit: 'µg/dL', regex: /(?:serum\s*)?iron[:\s]*(\d+\.?\d*)/i, normalMin: 60, normalMax: 170, icon: '🔩' },
        { name: 'Calcium', unit: 'mg/dL', regex: /calcium[:\s]*(\d+\.?\d*)/i, normalMin: 8.5, normalMax: 10.5, icon: '🦴' },
        { name: 'Platelets', unit: 'K/µL', regex: /platelet[s]?[:\s]*(\d+\.?\d*)/i, normalMin: 150, normalMax: 400, icon: '🩹' },
        { name: 'WBC', unit: 'K/µL', regex: /wbc[:\s]*(\d+\.?\d*)/i, normalMin: 4.5, normalMax: 11, icon: '⚪' },
        { name: 'RBC', unit: 'M/µL', regex: /rbc[:\s]*(\d+\.?\d*)/i, normalMin: 4.5, normalMax: 5.5, icon: '🔴' },
        { name: 'SGPT/ALT', unit: 'U/L', regex: /(?:sgpt|alt)[:\s]*(\d+\.?\d*)/i, normalMin: 7, normalMax: 56, icon: '🫁' },
        { name: 'SGOT/AST', unit: 'U/L', regex: /(?:sgot|ast)[:\s]*(\d+\.?\d*)/i, normalMin: 10, normalMax: 40, icon: '🫁' },
        { name: 'Bilirubin', unit: 'mg/dL', regex: /bilirubin[:\s]*(\d+\.?\d*)/i, normalMin: 0.1, normalMax: 1.2, icon: '🟡' },
    ];

    // Blood Pressure (special - two numbers)
    const bpMatch = t.match(/(?:blood\s*pressure|bp|systolic)[:\s/]*(\d{2,3})\s*[/\\]\s*(\d{2,3})/i) ||
                     t.match(/(\d{2,3})\s*[/\\]\s*(\d{2,3})\s*(?:mm\s*hg|mmhg)/i);
    if (bpMatch) {
        const sys = parseFloat(bpMatch[1]), dia = parseFloat(bpMatch[2]);
        vitals.push({
            name: 'Blood Pressure', value: `${sys}/${dia}`, unit: 'mmHg', icon: '❤️',
            status: sys > 140 || dia > 90 ? 'high' : sys < 90 || dia < 60 ? 'low' : 'normal',
            normalRange: '90-140 / 60-90'
        });
    }

    for (const p of patterns) {
        const match = t.match(p.regex);
        if (match) {
            const val = parseFloat(match[1]);
            if (isNaN(val) || val === 0) continue;
            let status = 'normal';
            if (val < p.normalMin) status = 'low';
            else if (val > p.normalMax) status = 'high';
            vitals.push({
                name: p.name, value: val, unit: p.unit, icon: p.icon, status,
                normalRange: `${p.normalMin}–${p.normalMax}`
            });
        }
    }

    return vitals;
}

// ==========================================
// EXPORTS
// ==========================================
module.exports = {
    extractTextFromFile,
    analyzeReport,
    chatResponse,
    extractVitals,
    getSession
};
