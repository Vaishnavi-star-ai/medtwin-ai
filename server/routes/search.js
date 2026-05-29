const express = require('express');
const router = express.Router();
const { getAllHospitals } = require('../services/placesService');
const { getDB } = require('../config/firebase');

// ═══════════════════════════════════════════════
// Disease → Specialization mapping
// Maps common disease names to hospital specializations
// ═══════════════════════════════════════════════
const diseaseSpecializationMap = {
  // Cardiology
  'heart': ['Cardiology', 'Cardiac Surgery', 'Interventional Cardiology'],
  'heart attack': ['Cardiology', 'Cardiac Surgery', 'Interventional Cardiology'],
  'chest pain': ['Cardiology', 'Cardiac Surgery'],
  'blood pressure': ['Cardiology'],
  'hypertension': ['Cardiology'],
  'cardiac': ['Cardiology', 'Cardiac Surgery', 'Interventional Cardiology'],
  'bypass': ['Cardiac Surgery'],
  'pacemaker': ['Cardiology', 'Interventional Cardiology'],
  'arrhythmia': ['Cardiology'],
  'angina': ['Cardiology'],

  // Oncology / Cancer
  'cancer': ['Oncology'],
  'blood cancer': ['Oncology'],
  'leukemia': ['Oncology'],
  'lymphoma': ['Oncology'],
  'tumor': ['Oncology', 'Neurosurgery'],
  'chemotherapy': ['Oncology'],
  'breast cancer': ['Oncology'],
  'lung cancer': ['Oncology', 'Pulmonology'],
  'prostate cancer': ['Oncology', 'Urology'],

  // Neurology
  'brain': ['Neurology', 'Neurosurgery'],
  'stroke': ['Neurology', 'Neurosurgery'],
  'epilepsy': ['Neurology'],
  'seizure': ['Neurology'],
  'headache': ['Neurology'],
  'migraine': ['Neurology'],
  'paralysis': ['Neurology', 'Neurosurgery'],
  'alzheimer': ['Neurology'],
  'parkinson': ['Neurology'],
  'nerve': ['Neurology'],

  // Orthopedics
  'bone': ['Orthopedics'],
  'fracture': ['Orthopedics', 'Trauma'],
  'joint': ['Orthopedics', 'Joint Replacement'],
  'knee': ['Orthopedics', 'Joint Replacement'],
  'hip replacement': ['Orthopedics', 'Joint Replacement'],
  'spine': ['Orthopedics', 'Spine Surgery'],
  'back pain': ['Orthopedics', 'Spine Surgery'],
  'arthritis': ['Orthopedics', 'Rheumatology'],
  'sports injury': ['Orthopedics', 'Sports Medicine'],

  // Pulmonology
  'lung': ['Pulmonology'],
  'asthma': ['Pulmonology'],
  'breathing': ['Pulmonology'],
  'copd': ['Pulmonology'],
  'pneumonia': ['Pulmonology'],
  'tuberculosis': ['Pulmonology'],
  'tb': ['Pulmonology'],
  'respiratory': ['Pulmonology'],
  'covid': ['Pulmonology', 'Critical Care'],

  // Nephrology
  'kidney': ['Nephrology', 'Dialysis'],
  'dialysis': ['Nephrology', 'Dialysis'],
  'kidney stone': ['Nephrology', 'Urology'],
  'renal': ['Nephrology'],

  // Gastroenterology
  'stomach': ['Gastroenterology'],
  'liver': ['Gastroenterology', 'Liver Transplant'],
  'digestive': ['Gastroenterology'],
  'ulcer': ['Gastroenterology'],
  'jaundice': ['Gastroenterology'],
  'hepatitis': ['Gastroenterology', 'Liver Transplant'],
  'cirrhosis': ['Gastroenterology', 'Liver Transplant'],

  // Gynecology / Obstetrics
  'pregnancy': ['Gynecology', 'Obstetrics'],
  'delivery': ['Gynecology', 'Obstetrics'],
  'pcos': ['Gynecology'],
  'menstrual': ['Gynecology'],
  'fertility': ['Gynecology'],
  'maternity': ['Gynecology', 'Obstetrics'],
  'women': ['Gynecology'],

  // Pediatrics
  'child': ['Pediatrics'],
  'baby': ['Pediatrics'],
  'infant': ['Pediatrics'],
  'newborn': ['Pediatrics'],
  'vaccination': ['Pediatrics'],

  // ENT
  'ear': ['ENT'],
  'nose': ['ENT'],
  'throat': ['ENT'],
  'sinus': ['ENT'],
  'tonsil': ['ENT'],
  'hearing': ['ENT'],

  // Dermatology
  'skin': ['Dermatology'],
  'acne': ['Dermatology'],
  'eczema': ['Dermatology'],
  'psoriasis': ['Dermatology'],
  'rash': ['Dermatology'],
  'hair loss': ['Dermatology'],
  'allergy': ['Dermatology'],

  // Urology
  'urinary': ['Urology'],
  'bladder': ['Urology'],
  'prostate': ['Urology'],

  // Ophthalmology
  'eye': ['Ophthalmology'],
  'vision': ['Ophthalmology'],
  'cataract': ['Ophthalmology'],
  'glaucoma': ['Ophthalmology'],
  'lasik': ['Ophthalmology'],

  // Psychiatry
  'mental health': ['Psychiatry'],
  'depression': ['Psychiatry'],
  'anxiety': ['Psychiatry'],
  'stress': ['Psychiatry'],
  'insomnia': ['Psychiatry'],

  // Diabetes / Endocrinology
  'diabetes': ['Diabetes', 'Endocrinology'],
  'sugar': ['Diabetes', 'Endocrinology'],
  'thyroid': ['Endocrinology'],
  'hormone': ['Endocrinology'],

  // General
  'fever': ['General Medicine'],
  'infection': ['General Medicine'],
  'cold': ['General Medicine', 'ENT'],
  'flu': ['General Medicine', 'Pulmonology'],
  'cough': ['General Medicine', 'Pulmonology'],
  'weight loss': ['Bariatrics', 'Endocrinology'],
  'obesity': ['Bariatrics'],
  'emergency': ['Trauma', 'Critical Care'],
  'accident': ['Trauma', 'Orthopedics'],
  'icu': ['Critical Care'],
  'transplant': ['Liver Transplant', 'Nephrology'],
};

function findSpecializations(query) {
  const q = query.toLowerCase().trim();
  const matchedSpecs = new Set();

  // Direct specialization match
  const allHospitals = getAllHospitals();
  allHospitals.forEach(h => {
    h.specializations.forEach(s => {
      if (s.toLowerCase().includes(q) || q.includes(s.toLowerCase())) {
        matchedSpecs.add(s);
      }
    });
  });

  // Disease-to-specialization mapping
  for (const [disease, specs] of Object.entries(diseaseSpecializationMap)) {
    if (q.includes(disease) || disease.includes(q)) {
      specs.forEach(s => matchedSpecs.add(s));
    }
  }

  return Array.from(matchedSpecs);
}

// GET /api/search?q=blood+cancer — Unified disease/specialization search
router.get('/', async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || !q.trim()) {
      return res.status(400).json({ success: false, error: 'Search query (q) is required' });
    }

    const query = q.toLowerCase().trim();
    const db = getDB();

    // 1. Find mapped specializations for this query
    const matchedSpecs = findSpecializations(query);

    // 2. Find hospitals matching specializations OR name/description
    const allHospitals = getAllHospitals();
    const matchedHospitals = allHospitals.filter(h =>
      h.specializations?.some(s =>
        matchedSpecs.some(ms => s.toLowerCase() === ms.toLowerCase()) ||
        s.toLowerCase().includes(query)
      ) ||
      h.name.toLowerCase().includes(query) ||
      h.description?.toLowerCase().includes(query)
    );

    const matchedHospitalIds = matchedHospitals.map(h => h.id);

    // 3. Find ONLY completed/treated patients for this disease (real data only)
    let patients = [];
    try {
      const apptSnap = await db.collection('appointments').get();
      const allAppts = apptSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Root-word match: "Cardiology" ↔ "Cardiologist" both share root "cardiol"
      const getRoot = (s) => s?.toLowerCase().replace(/(ologist|ology|ician|ist|ics|ery|ist)$/i, '').trim();
      const queryRoot = getRoot(query);

      // Only completed appointments where doctor specialization matches the disease
      const treatedPatients = allAppts.filter(a => {
        if (a.status !== 'completed') return false;
        const specRoot = getRoot(a.doctorSpecialization || '');
        return (
          matchedSpecs.some(ms => {
            const msRoot = getRoot(ms);
            return specRoot && msRoot && (specRoot.includes(msRoot) || msRoot.includes(specRoot));
          }) ||
          (specRoot && queryRoot && (specRoot.includes(queryRoot) || queryRoot.includes(specRoot))) ||
          a.doctorSpecialization?.toLowerCase().includes(query) ||
          a.notes?.toLowerCase().includes(query)
        );
      });

      // Sort newest first, deduplicate by patientName
      treatedPatients.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      const seen = new Set();
      patients = treatedPatients.filter(a => {
        if (seen.has(a.patientName)) return false;
        seen.add(a.patientName);
        return true;
      });
    } catch (e) { console.log('Search appointments error:', e.message); }

    // 4. Find reviews SPECIFIC to the disease first, fallback to hospital reviews
    let reviews = [];
    let reviewsFallback = false;
    try {
      const reviewSnap = await db.collection('reviews').get();
      const allReviews = reviewSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Priority 1: Reviews that mention the disease/query in comments
      const diseaseSpecificReviews = allReviews.filter(r =>
        r.comment?.toLowerCase().includes(query) ||
        matchedSpecs.some(ms => r.comment?.toLowerCase().includes(ms.toLowerCase()))
      );

      let filtered;
      if (diseaseSpecificReviews.length > 0) {
        filtered = diseaseSpecificReviews;
      } else {
        // Fallback: All reviews from matched hospitals
        filtered = allReviews.filter(r => matchedHospitalIds.includes(r.hospitalId));
        reviewsFallback = filtered.length > 0;
      }

      // Sort newest first, then deduplicate by patientName
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      const seenReviewers = new Set();
      reviews = filtered.filter(r => {
        if (seenReviewers.has(r.patientName)) return false;
        seenReviewers.add(r.patientName);
        return true;
      });
    } catch (e) { console.log('Search reviews error:', e.message); }

    res.json({
      success: true,
      query: q,
      matchedSpecializations: matchedSpecs,
      hospitals: matchedHospitals,
      patients,
      reviews,
      reviewsFallback,
      counts: {
        hospitals: matchedHospitals.length,
        patients: patients.length,
        reviews: reviews.length
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
