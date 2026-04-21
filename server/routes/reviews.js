const express = require('express');
const router = express.Router();
const { getDB } = require('../config/firebase');

// POST /api/review — Submit verified review
router.post('/', async (req, res, next) => {
  try {
    const db = getDB();
    const { patientName, hospitalId, hospitalName, rating, comment } = req.body;

    if (!patientName || !hospitalId || !rating) {
      return res.status(400).json({ success: false, error: 'patientName, hospitalId, and rating are required' });
    }

    // Verify patient has a completed appointment at this hospital
    const appointmentSnap = await db.collection('appointments')
      .where('patientName', '==', patientName)
      .where('hospitalId', '==', hospitalId)
      .get();

    const hasCompleted = appointmentSnap.docs.some(doc => doc.data().status === 'completed');

    if (!hasCompleted) {
      return res.status(403).json({
        success: false,
        error: 'You can only review hospitals where you have a completed appointment'
      });
    }

    // Check if already reviewed
    const existingReview = await db.collection('reviews')
      .where('patientName', '==', patientName)
      .where('hospitalId', '==', hospitalId)
      .get();

    if (!existingReview.empty) {
      return res.status(400).json({ success: false, error: 'You have already reviewed this hospital' });
    }

    const reviewData = {
      patientName,
      hospitalId,
      hospitalName: hospitalName || 'Hospital',
      rating: Math.min(5, Math.max(1, parseInt(rating))),
      comment: comment || '',
      verified: true,
      helpfulCount: 0,
      createdAt: new Date().toISOString()
    };

    const docRef = await db.collection('reviews').add(reviewData);

    res.status(201).json({
      success: true,
      data: { id: docRef.id, ...reviewData }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/reviews/:hospitalId — Get reviews for a hospital
router.get('/hospital/:hospitalId', async (req, res, next) => {
  try {
    const db = getDB();
    const snap = await db.collection('reviews')
      .where('hospitalId', '==', req.params.hospitalId)
      .get();

    const reviews = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Calculate stats
    const totalReviews = reviews.length;
    const avgRating = totalReviews > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
      : 0;

    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => { distribution[r.rating] = (distribution[r.rating] || 0) + 1; });

    res.json({
      success: true,
      data: reviews,
      stats: { totalReviews, avgRating: parseFloat(avgRating), distribution }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/feedback — Get ALL verified feedback across all hospitals
router.get('/feedback', async (req, res, next) => {
  try {
    const db = getDB();
    const snap = await db.collection('reviews')
      .where('verified', '==', true)
      .get();

    const allReviews = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    allReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Group by hospital for stats
    const hospitalStats = {};
    allReviews.forEach(r => {
      if (!hospitalStats[r.hospitalId]) {
        hospitalStats[r.hospitalId] = {
          hospitalId: r.hospitalId,
          hospitalName: r.hospitalName,
          totalReviews: 0,
          totalRating: 0,
          distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
        };
      }
      hospitalStats[r.hospitalId].totalReviews++;
      hospitalStats[r.hospitalId].totalRating += r.rating;
      hospitalStats[r.hospitalId].distribution[r.rating]++;
    });

    // Calculate averages and verdicts
    Object.values(hospitalStats).forEach(stat => {
      stat.avgRating = parseFloat((stat.totalRating / stat.totalReviews).toFixed(1));
      if (stat.avgRating >= 4.0) stat.verdict = 'Highly Recommended';
      else if (stat.avgRating >= 3.0) stat.verdict = 'Good';
      else if (stat.avgRating >= 2.0) stat.verdict = 'Mixed Reviews';
      else stat.verdict = 'Needs Improvement';
    });

    res.json({
      success: true,
      totalFeedback: allReviews.length,
      data: allReviews,
      hospitalStats: Object.values(hospitalStats)
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/reviews/:id/helpful — Mark a review as helpful
router.patch('/:id/helpful', async (req, res, next) => {
  try {
    const db = getDB();
    const docRef = db.collection('reviews').doc(req.params.id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({ success: false, error: 'Review not found' });
    }

    const currentCount = docSnap.data().helpfulCount || 0;
    await docRef.update({ helpfulCount: currentCount + 1 });

    res.json({ success: true, helpfulCount: currentCount + 1 });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
