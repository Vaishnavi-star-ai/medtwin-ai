const express = require('express');
const router = express.Router();
const { analyzeSymptoms, getHospitalRecommendation } = require('../services/groqAI');
const { searchNearbyHospitals, getAllHospitals } = require('../services/placesService');

// POST /api/ai/analyze-symptoms — AI symptom analysis
router.post('/analyze-symptoms', async (req, res, next) => {
  try {
    const { symptoms, age, gender } = req.body;

    if (!symptoms || symptoms.trim().length < 3) {
      return res.status(400).json({ success: false, error: 'Please describe your symptoms (at least 3 characters)' });
    }

    const analysis = await analyzeSymptoms(symptoms, age, gender);
    res.json(analysis);
  } catch (error) {
    next(error);
  }
});

// POST /api/ai/recommend-hospitals — AI hospital recommendation
router.post('/recommend-hospitals', async (req, res, next) => {
  try {
    const { symptoms, lat, lng } = req.body;

    if (!symptoms) {
      return res.status(400).json({ success: false, error: 'Symptoms are required' });
    }

    // Get hospitals (with distance if location provided)
    let hospitals;
    if (lat && lng) {
      hospitals = searchNearbyHospitals(parseFloat(lat), parseFloat(lng));
    } else {
      hospitals = getAllHospitals();
    }

    const recommendation = await getHospitalRecommendation(symptoms, hospitals);

    // Enrich recommendations with full hospital data
    if (recommendation.data?.recommendations) {
      recommendation.data.recommendations = recommendation.data.recommendations.map(rec => {
        const hospital = hospitals.find(h => h.id === rec.hospitalId);
        return { ...rec, hospital };
      }).filter(rec => rec.hospital);
    }

    res.json(recommendation);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
