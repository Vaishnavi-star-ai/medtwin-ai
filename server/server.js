require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const errorHandler = require('./middleware/errorHandler');
const seed = require('./seed');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} | ${req.method} ${req.path}`);
  next();
});

// Static uploads
app.use('/uploads', express.static('uploads'));

// Routes — MedTwin+ (Firebase)
app.use('/api/hospitals', require('./routes/hospitals'));
app.use('/api/doctors', require('./routes/doctors'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/ai', require('./routes/ai'));

// Routes — MedTwin AI (PDF Analysis, Chat, Prescriptions)
app.use('/api/medai', require('./routes/medai'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'MedTwin AI Unified API',
    version: '3.0.0',
    features: ['OpenStreetMap', 'Groq AI', 'Firebase', 'Smart Routing', 'PDF Analysis', 'AI Chat', 'Prescriptions'],
    timestamp: new Date().toISOString()
  });
});

// Serve React client in production
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(publicPath, 'index.html'));
});

// Error handler
app.use(errorHandler);

// Start server & seed data
app.listen(PORT, async () => {
  console.log(`
  ╔══════════════════════════════════════════════╗
  ║   🧬 MedTwin AI — Unified Server v3.0      ║
  ║   Running on http://localhost:${PORT}          ║
  ║   Map: OpenStreetMap | DB: Firebase         ║
  ║   AI:  ${process.env.GROQ_API_KEY ? 'Groq AI (LIVE)' : 'Groq AI (DEMO)'}                    ║
  ║   PDF Analysis | Chat | Prescriptions       ║
  ╚══════════════════════════════════════════════╝
  `);

  // Auto-seed on first start
  try {
    await seed();
  } catch (err) {
    console.log('⚠️  Seed warning:', err.message);
  }
});

module.exports = app;
