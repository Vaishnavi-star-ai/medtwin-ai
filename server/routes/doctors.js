const express = require('express');
const router = express.Router();
const { getDB } = require('../config/firebase');

// GET /api/doctors/:hospitalId — Get all doctors for a hospital
router.get('/:hospitalId', async (req, res, next) => {
  try {
    const db = getDB();
    const { hospitalId } = req.params;

    // Get senior doctors
    const seniorSnap = await db.collection('doctors')
      .where('hospitalId', '==', hospitalId)
      .get();

    const seniors = seniorSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      tier: 'senior'
    }));

    // Get practitioner doctors
    const practSnap = await db.collection('practitionerDoctors')
      .where('hospitalId', '==', hospitalId)
      .get();

    const practitioners = practSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      tier: 'practitioner'
    }));

    const allDoctors = [...seniors, ...practitioners];

    res.json({
      success: true,
      count: allDoctors.length,
      data: {
        seniors,
        practitioners,
        all: allDoctors
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
