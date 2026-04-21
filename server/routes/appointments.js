const express = require('express');
const router = express.Router();
const { getDB } = require('../config/firebase');
const { assignDoctor, releaseDoctor } = require('../services/doctorAssignment');

// POST /api/book-appointment — Book with smart doctor routing
router.post('/', async (req, res, next) => {
  try {
    const db = getDB();
    const { patientName, hospitalId, hospitalName, preferredDoctorId, preferredTime, notes } = req.body;

    if (!patientName || !hospitalId) {
      return res.status(400).json({ success: false, error: 'patientName and hospitalId are required' });
    }

    // Smart doctor assignment
    const assignment = await assignDoctor(hospitalId, preferredDoctorId);

    const appointmentData = {
      patientName,
      hospitalId,
      hospitalName: hospitalName || 'Hospital',
      originalDoctor: preferredDoctorId ? assignment.doctor.name : 'Auto-assigned',
      assignedDoctor: assignment.doctor.name,
      assignedDoctorId: assignment.doctor.id,
      doctorSpecialization: assignment.doctor.specialization || 'General',
      handlingType: assignment.handlingType,
      time: assignment.scheduledTime || preferredTime || new Date().toISOString(),
      status: 'booked',
      notes: notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const docRef = await db.collection('appointments').add(appointmentData);

    res.status(201).json({
      success: true,
      data: {
        id: docRef.id,
        ...appointmentData,
        assignmentMessage: assignment.message
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/appointments/:patientName — Get patient's appointments
router.get('/patient/:patientName', async (req, res, next) => {
  try {
    const db = getDB();
    const snap = await db.collection('appointments')
      .where('patientName', '==', req.params.patientName)
      .get();

    const appointments = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    appointments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ success: true, count: appointments.length, data: appointments });
  } catch (error) {
    next(error);
  }
});

// GET /api/appointments — Get all appointments
router.get('/', async (req, res, next) => {
  try {
    const db = getDB();
    const snap = await db.collection('appointments').get();
    const appointments = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    appointments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ success: true, count: appointments.length, data: appointments });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/appointments/:id/complete — Mark appointment as completed
router.patch('/:id/complete', async (req, res, next) => {
  try {
    const db = getDB();
    const docRef = db.collection('appointments').doc(req.params.id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({ success: false, error: 'Appointment not found' });
    }

    const data = docSnap.data();
    await docRef.update({ status: 'completed', updatedAt: new Date().toISOString() });

    // Release the doctor
    await releaseDoctor(data.assignedDoctorId, data.handlingType);

    res.json({ success: true, message: 'Appointment marked as completed' });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/appointments/:id/cancel — Cancel appointment
router.patch('/:id/cancel', async (req, res, next) => {
  try {
    const db = getDB();
    const docRef = db.collection('appointments').doc(req.params.id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({ success: false, error: 'Appointment not found' });
    }

    const data = docSnap.data();
    await docRef.update({ status: 'cancelled', updatedAt: new Date().toISOString() });

    // Release the doctor
    await releaseDoctor(data.assignedDoctorId, data.handlingType);

    res.json({ success: true, message: 'Appointment cancelled' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
