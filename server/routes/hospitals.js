const express = require('express');
const router = express.Router();
const { searchNearbyHospitals, getHospitalById, searchHospitalsBySpecialization, getAllHospitals } = require('../services/placesService');

// GET /api/hospitals — Get all or search nearby hospitals
router.get('/', (req, res, next) => {
  try {
    const { lat, lng, radius = 50, specialization, q } = req.query;

    let hospitals;
    if (specialization) {
      hospitals = searchHospitalsBySpecialization(specialization);
    } else if (lat && lng) {
      hospitals = searchNearbyHospitals(parseFloat(lat), parseFloat(lng), parseInt(radius));
    } else {
      hospitals = getAllHospitals();
    }

    // Text search filter
    if (q) {
      const query = q.toLowerCase();
      hospitals = hospitals.filter(h =>
        h.name.toLowerCase().includes(query) ||
        h.address.toLowerCase().includes(query) ||
        h.specializations.some(s => s.toLowerCase().includes(query))
      );
    }

    res.json({ success: true, count: hospitals.length, data: hospitals });
  } catch (error) {
    next(error);
  }
});

// GET /api/hospitals/:id — Get hospital details
router.get('/:id', (req, res, next) => {
  try {
    const hospital = getHospitalById(req.params.id);
    if (!hospital) {
      return res.status(404).json({ success: false, error: 'Hospital not found' });
    }
    res.json({ success: true, data: hospital });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
