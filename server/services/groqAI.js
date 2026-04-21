const Groq = require('groq-sdk');

let groqClient = null;

// Initialize Groq client if API key is available
if (process.env.GROQ_API_KEY) {
  groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  console.log('🤖 Groq AI connected');
}

/**
 * Analyze symptoms using Groq AI and suggest hospital specializations
 */
async function analyzeSymptoms(symptoms, patientAge, patientGender) {
  if (!groqClient) {
    // Demo fallback when no API key
    return getDemoAnalysis(symptoms);
  }

  try {
    const completion = await groqClient.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are a medical triage assistant for MedTwin+ healthcare platform. 
Analyze the patient's symptoms and provide:
1. Possible conditions (top 3)
2. Urgency level: LOW, MEDIUM, HIGH, or EMERGENCY
3. Recommended medical specialization to visit
4. Immediate care advice
5. Whether emergency room visit is recommended

IMPORTANT: Always include a disclaimer that this is AI-assisted guidance and not a medical diagnosis.
Respond in JSON format:
{
  "conditions": [{"name": "...", "probability": "high/medium/low", "description": "..."}],
  "urgency": "LOW|MEDIUM|HIGH|EMERGENCY",
  "recommendedSpecializations": ["Cardiology", "General Medicine"],
  "immediateAdvice": "...",
  "emergencyRecommended": false,
  "disclaimer": "..."
}`
        },
        {
          role: 'user',
          content: `Patient: Age ${patientAge || 'unknown'}, Gender: ${patientGender || 'unknown'}
Symptoms: ${symptoms}`
        }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_tokens: 1024,
      response_format: { type: 'json_object' }
    });

    const response = JSON.parse(completion.choices[0]?.message?.content || '{}');
    return { success: true, data: response };
  } catch (error) {
    console.error('Groq AI error:', error.message);
    return getDemoAnalysis(symptoms);
  }
}

/**
 * Get AI-based hospital recommendations based on symptoms
 */
async function getHospitalRecommendation(symptoms, hospitals) {
  if (!groqClient) {
    return getDemoRecommendation(symptoms, hospitals);
  }

  try {
    const hospitalList = hospitals.map(h => ({
      id: h.id, name: h.name, rating: h.rating,
      specializations: h.specializations, distance: h.distance?.toFixed(1)
    }));

    const completion = await groqClient.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are a hospital recommendation AI. Based on the patient's symptoms and available hospitals, recommend the best hospitals to visit. Consider specializations, ratings, and distance.
Respond in JSON: { "recommendations": [{"hospitalId": "...", "reason": "...", "matchScore": 95}], "urgentNote": "..." }`
        },
        {
          role: 'user',
          content: `Symptoms: ${symptoms}\n\nAvailable hospitals:\n${JSON.stringify(hospitalList, null, 2)}`
        }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_tokens: 512,
      response_format: { type: 'json_object' }
    });

    const response = JSON.parse(completion.choices[0]?.message?.content || '{}');
    return { success: true, data: response };
  } catch (error) {
    console.error('Groq AI recommendation error:', error.message);
    return getDemoRecommendation(symptoms, hospitals);
  }
}

/**
 * Demo symptom analysis when no Groq API key
 */
function getDemoAnalysis(symptoms) {
  const lower = symptoms.toLowerCase();
  let result = {
    conditions: [],
    urgency: 'MEDIUM',
    recommendedSpecializations: ['General Medicine'],
    immediateAdvice: 'Please consult a healthcare professional for proper diagnosis.',
    emergencyRecommended: false,
    disclaimer: 'This is AI-assisted guidance only. Please consult a qualified healthcare professional for proper medical diagnosis and treatment.'
  };

  if (lower.includes('chest pain') || lower.includes('heart') || lower.includes('breathing difficulty')) {
    result = {
      conditions: [
        { name: 'Angina / Cardiac Issue', probability: 'medium', description: 'Chest pain may indicate heart-related conditions that need immediate attention.' },
        { name: 'Anxiety / Panic Attack', probability: 'medium', description: 'Chest tightness and difficulty breathing can be associated with anxiety.' },
        { name: 'Acid Reflux (GERD)', probability: 'low', description: 'Chest discomfort may be caused by gastroesophageal reflux.' }
      ],
      urgency: 'HIGH',
      recommendedSpecializations: ['Cardiology', 'Emergency Medicine'],
      immediateAdvice: 'If experiencing severe chest pain, call emergency services (108) immediately. Rest in a comfortable position and avoid physical exertion.',
      emergencyRecommended: true,
      disclaimer: 'This is AI-assisted guidance only. Chest pain requires immediate medical attention. Please call 108 or visit the nearest emergency room.'
    };
  } else if (lower.includes('headache') || lower.includes('migraine') || lower.includes('dizziness')) {
    result = {
      conditions: [
        { name: 'Tension Headache', probability: 'high', description: 'Most common type of headache, usually caused by stress or muscle tension.' },
        { name: 'Migraine', probability: 'medium', description: 'Severe recurring headaches often accompanied by nausea and sensitivity to light.' },
        { name: 'Hypertension', probability: 'low', description: 'High blood pressure can cause persistent headaches and dizziness.' }
      ],
      urgency: 'MEDIUM',
      recommendedSpecializations: ['Neurology', 'General Medicine'],
      immediateAdvice: 'Rest in a dark, quiet room. Stay hydrated and try over-the-counter pain relief. If headache is severe or sudden, seek immediate medical attention.',
      emergencyRecommended: false,
      disclaimer: 'This is AI-assisted guidance only. Please consult a qualified healthcare professional for proper diagnosis.'
    };
  } else if (lower.includes('fever') || lower.includes('cold') || lower.includes('cough') || lower.includes('flu')) {
    result = {
      conditions: [
        { name: 'Viral Infection / Common Cold', probability: 'high', description: 'Upper respiratory tract infection with typical symptoms of fever and cold.' },
        { name: 'Influenza (Flu)', probability: 'medium', description: 'Seasonal flu with higher fever and body aches.' },
        { name: 'Bacterial Infection', probability: 'low', description: 'May require antibiotics if symptoms persist beyond a week.' }
      ],
      urgency: 'LOW',
      recommendedSpecializations: ['General Medicine', 'Pulmonology'],
      immediateAdvice: 'Rest, stay hydrated, and monitor temperature. Take fever-reducing medication if needed. Consult a doctor if fever exceeds 103°F or persists more than 3 days.',
      emergencyRecommended: false,
      disclaimer: 'This is AI-assisted guidance only. Please consult a qualified healthcare professional for proper diagnosis.'
    };
  } else if (lower.includes('bone') || lower.includes('fracture') || lower.includes('joint') || lower.includes('knee') || lower.includes('back pain')) {
    result = {
      conditions: [
        { name: 'Musculoskeletal Strain', probability: 'high', description: 'Muscle or ligament strain from physical activity or poor posture.' },
        { name: 'Arthritis', probability: 'medium', description: 'Joint inflammation that may cause pain and stiffness.' },
        { name: 'Disc Problem', probability: 'low', description: 'Herniated or bulging disc may cause radiating pain.' }
      ],
      urgency: 'MEDIUM',
      recommendedSpecializations: ['Orthopedics', 'Sports Medicine'],
      immediateAdvice: 'Apply ice to the affected area, rest, and avoid heavy lifting. Seek medical attention if pain is severe or you cannot bear weight.',
      emergencyRecommended: false,
      disclaimer: 'This is AI-assisted guidance only. Please consult a qualified healthcare professional for proper diagnosis.'
    };
  } else if (lower.includes('skin') || lower.includes('rash') || lower.includes('itching') || lower.includes('allergy')) {
    result = {
      conditions: [
        { name: 'Allergic Reaction', probability: 'high', description: 'Skin reaction to an allergen causing rash and itching.' },
        { name: 'Dermatitis', probability: 'medium', description: 'Skin inflammation that may be caused by contact or internal factors.' },
        { name: 'Fungal Infection', probability: 'low', description: 'Fungal skin infection that may need antifungal treatment.' }
      ],
      urgency: 'LOW',
      recommendedSpecializations: ['Dermatology', 'General Medicine'],
      immediateAdvice: 'Avoid scratching, apply calamine lotion or antihistamine cream. If you notice swelling of face/throat, seek emergency care immediately.',
      emergencyRecommended: false,
      disclaimer: 'This is AI-assisted guidance only. Please consult a qualified healthcare professional for proper diagnosis.'
    };
  } else {
    result.conditions = [
      { name: 'General Health Concern', probability: 'medium', description: 'Your symptoms require professional evaluation for accurate diagnosis.' },
      { name: 'Stress-related Condition', probability: 'low', description: 'Physical symptoms can sometimes be related to stress and anxiety.' }
    ];
  }

  return { success: true, data: result, isDemo: true };
}

/**
 * Demo hospital recommendation when no Groq API key
 */
function getDemoRecommendation(symptoms, hospitals) {
  const lower = symptoms.toLowerCase();
  let targetSpecs = ['General Medicine'];

  if (lower.includes('heart') || lower.includes('chest')) targetSpecs = ['Cardiology', 'Cardiac Surgery'];
  else if (lower.includes('bone') || lower.includes('joint') || lower.includes('fracture')) targetSpecs = ['Orthopedics', 'Sports Medicine'];
  else if (lower.includes('brain') || lower.includes('headache') || lower.includes('neuro')) targetSpecs = ['Neurology', 'Neurosurgery'];
  else if (lower.includes('skin') || lower.includes('rash')) targetSpecs = ['Dermatology'];
  else if (lower.includes('child') || lower.includes('baby') || lower.includes('pediatric')) targetSpecs = ['Pediatrics'];
  else if (lower.includes('eye') || lower.includes('vision')) targetSpecs = ['Ophthalmology'];
  else if (lower.includes('breathing') || lower.includes('lung') || lower.includes('asthma')) targetSpecs = ['Pulmonology'];

  const recommendations = hospitals
    .map(h => {
      const matchingSpecs = h.specializations?.filter(s =>
        targetSpecs.some(ts => s.toLowerCase().includes(ts.toLowerCase()))
      ) || [];
      const matchScore = matchingSpecs.length > 0
        ? Math.min(95, 70 + matchingSpecs.length * 10 + (h.rating - 3) * 5)
        : Math.max(40, 60 - (h.distance || 0) * 2);
      return { hospitalId: h.id, reason: matchingSpecs.length > 0 ? `Specializes in ${matchingSpecs.join(', ')}` : `General care available, ${h.distance?.toFixed(1)}km away`, matchScore: Math.round(matchScore) };
    })
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 5);

  return { success: true, data: { recommendations, urgentNote: 'Please consult a doctor for proper diagnosis.' }, isDemo: true };
}

module.exports = { analyzeSymptoms, getHospitalRecommendation };
