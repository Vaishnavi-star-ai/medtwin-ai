import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BrainCircuit, Stethoscope, AlertTriangle, Hospital, ArrowRight, Info, Heart, Send, Loader2 } from 'lucide-react';
import { aiAPI } from '../services/api';
import { useGeolocation } from '../hooks/useGeolocation';
import StarRating from '../components/ui/StarRating';

const quickSymptoms = [
  { label: 'Chest Pain', icon: '💔', symptoms: 'chest pain and discomfort' },
  { label: 'Headache', icon: '🤕', symptoms: 'severe headache and dizziness' },
  { label: 'Fever & Cold', icon: '🤒', symptoms: 'high fever with cold and cough' },
  { label: 'Joint Pain', icon: '🦴', symptoms: 'joint pain and swelling in knee' },
  { label: 'Skin Rash', icon: '🔴', symptoms: 'skin rash and itching on arms' },
  { label: 'Breathing Issues', icon: '😮‍💨', symptoms: 'difficulty breathing and wheezing' },
];

export default function SymptomCheckerPage() {
  const { location } = useGeolocation();
  const [symptoms, setSymptoms] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('input');

  const handleAnalyze = async (customSymptoms) => {
    const symptomText = customSymptoms || symptoms;
    if (!symptomText.trim()) return;
    setLoading(true); setStep('analyzing'); setAnalysis(null); setRecommendations(null);
    try {
      const analysisRes = await aiAPI.analyzeSymptoms({ symptoms: symptomText, age, gender });
      setAnalysis(analysisRes.data.data);
      const recRes = await aiAPI.recommendHospitals({ symptoms: symptomText, lat: location?.lat, lng: location?.lng });
      setRecommendations(recRes.data.data);
      setStep('results');
    } catch (err) { console.error(err); setStep('input'); }
    setLoading(false);
  };

  const urgencyColors = {
    LOW: 'bg-[#e8fbe8] text-[#3a8f3a] border-[#77DD77]/30',
    MEDIUM: 'bg-amber-50 text-amber-700 border-amber-200',
    HIGH: 'bg-orange-50 text-orange-700 border-orange-200',
    EMERGENCY: 'bg-red-50 text-red-700 border-red-200'
  };
  const urgencyIcons = { LOW: '✅', MEDIUM: '⚠️', HIGH: '🔶', EMERGENCY: '🚨' };

  return (
    <div className="page-enter">
      {/* Header */}
      <div className="gradient-hero relative overflow-hidden">
        <div className="relative max-w-4xl mx-auto px-6 py-14 text-white text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-5">
            <BrainCircuit size={28} />
          </div>
          <h1 className="text-3xl md:text-4xl font-black mb-3">AI Symptom Checker</h1>
          <p className="text-green-100 max-w-lg mx-auto text-base">Powered by Groq AI — Describe symptoms and get instant guidance</p>
        </div>
        <svg className="absolute bottom-0 w-full" viewBox="0 0 1440 50" fill="none" preserveAspectRatio="none">
          <path d="M0,30 C360,5 1080,5 1440,30 L1440,50 L0,50 Z" fill="#faf0e6" />
        </svg>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">
        {/* Input */}
        {step === 'input' && (
          <div className="space-y-8 animate-fadeInUp">
            <div>
              <h3 className="text-sm font-bold text-[#a89b8d] uppercase tracking-wider mb-4">Quick Select</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {quickSymptoms.map(({ label, icon, symptoms: s }) => (
                  <button key={label} onClick={() => { setSymptoms(s); handleAnalyze(s); }}
                    className="card text-left hover:border-[#77DD77]/50 transition-all group">
                    <span className="text-3xl block mb-2">{icon}</span>
                    <p className="font-bold text-[#2f2a26] text-sm">{label}</p>
                    <p className="text-xs text-[#a89b8d] mt-1 group-hover:text-[#4aad4a]">Tap to check →</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="card-solid p-8 space-y-5">
              <h3 className="font-bold text-[#2f2a26] text-lg flex items-center gap-2"><Stethoscope className="text-[#77DD77]" size={20} /> Describe Your Symptoms</h3>
              <textarea value={symptoms} onChange={e => setSymptoms(e.target.value)} className="input-field" rows={4}
                placeholder="e.g., I've been having severe headaches for the past 3 days, along with dizziness and nausea..." />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#a89b8d] mb-1.5">Age (optional)</label>
                  <input type="number" value={age} onChange={e => setAge(e.target.value)} className="input-field" placeholder="e.g., 35" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#a89b8d] mb-1.5">Gender (optional)</label>
                  <select value={gender} onChange={e => setGender(e.target.value)} className="input-field">
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <button onClick={() => handleAnalyze()} disabled={!symptoms.trim() || loading} className="btn-primary w-full text-base py-4">
                <Send size={18} /> Analyze Symptoms
              </button>
            </div>
          </div>
        )}

        {/* Analyzing */}
        {step === 'analyzing' && (
          <div className="card-solid p-16 text-center animate-fadeIn">
            <div className="w-20 h-20 rounded-full bg-[#77DD77]/15 flex items-center justify-center mx-auto mb-6">
              <BrainCircuit className="text-[#77DD77] animate-pulse" size={36} />
            </div>
            <h3 className="text-xl font-bold text-[#2f2a26] mb-2">Analyzing Your Symptoms...</h3>
            <p className="text-[#a89b8d]">Our AI is processing and finding recommendations</p>
            <div className="flex justify-center gap-3 mt-8">
              {['Analyzing', 'Matching', 'Recommending'].map((t, i) => (
                <span key={t} className="text-xs font-semibold text-[#4aad4a] bg-[#77DD77]/10 px-4 py-2 rounded-full animate-pulse" style={{ animationDelay: `${i * 0.3}s` }}>{t}...</span>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {step === 'results' && analysis && (
          <div className="space-y-6 animate-fadeInUp">
            <button onClick={() => { setStep('input'); setAnalysis(null); setRecommendations(null); }} className="btn-outline text-sm">← New Check</button>

            {/* Urgency */}
            <div className={`p-5 rounded-2xl border-2 ${urgencyColors[analysis.urgency] || urgencyColors.MEDIUM} flex items-center gap-4`}>
              <span className="text-3xl">{urgencyIcons[analysis.urgency] || '⚠️'}</span>
              <div>
                <h3 className="font-bold text-lg">Urgency: {analysis.urgency}</h3>
                {analysis.emergencyRecommended && <p className="font-semibold">⚡ Emergency room visit recommended</p>}
              </div>
            </div>

            {/* Conditions */}
            <div className="card-solid p-6 space-y-4">
              <h3 className="font-bold text-[#2f2a26] text-lg flex items-center gap-2"><Heart className="text-[#77DD77]" size={18} /> Possible Conditions</h3>
              {analysis.conditions?.map((c, i) => (
                <div key={i} className="p-4 rounded-xl bg-[#faf0e6] border border-[#e8dccf]">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-bold text-[#2f2a26]">{c.name}</h4>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${c.probability === 'high' ? 'bg-red-100 text-red-700' : c.probability === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-[#e8dccf] text-[#a89b8d]'}`}>{c.probability}</span>
                  </div>
                  <p className="text-sm text-[#a89b8d]">{c.description}</p>
                </div>
              ))}
            </div>

            {/* Specializations */}
            <div className="card-solid p-6">
              <h3 className="font-bold text-[#2f2a26] mb-3">Recommended Specializations</h3>
              <div className="flex flex-wrap gap-2">
                {analysis.recommendedSpecializations?.map(s => <span key={s} className="badge badge-senior">{s}</span>)}
              </div>
            </div>

            {/* Advice */}
            <div className="card-solid p-6 bg-blue-50 border-2 border-blue-200">
              <h3 className="font-bold text-blue-800 mb-2 flex items-center gap-2"><Info size={16} /> Immediate Advice</h3>
              <p className="text-blue-700 text-sm leading-relaxed">{analysis.immediateAdvice}</p>
            </div>

            {/* Hospital Recommendations */}
            {recommendations?.recommendations?.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-bold text-[#2f2a26] text-xl flex items-center gap-2"><Hospital className="text-[#77DD77]" size={20} /> Recommended Hospitals</h3>
                {recommendations.recommendations.map((rec, i) => rec.hospital && (
                  <div key={i} className="card">
                    <div className="flex items-start justify-between gap-5">
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div className="relative shrink-0">
                          <div className="w-14 h-14 rounded-xl bg-[#77DD77]/10 flex items-center justify-center"><Hospital className="text-[#77DD77]" size={20} /></div>
                          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[#77DD77] text-white text-xs font-bold flex items-center justify-center shadow">{i + 1}</div>
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-[#2f2a26]">{rec.hospital.name}</h4>
                          <div className="mt-1"><StarRating rating={rec.hospital.rating} size={13} count={rec.hospital.totalReviews} /></div>
                          <p className="text-xs text-[#a89b8d] mt-1">{rec.hospital.address}</p>
                          <p className="text-sm text-[#4aad4a] mt-1.5 font-semibold">💡 {rec.reason}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-2xl font-black text-[#4aad4a]">{rec.matchScore}%</div>
                        <p className="text-xs text-[#a89b8d]">match</p>
                        {rec.hospital.distance !== undefined && <p className="text-xs font-semibold text-[#4aad4a] mt-1">{rec.hospital.distance.toFixed(1)} km</p>}
                      </div>
                    </div>
                    <div className="mt-4 flex gap-3 pt-3 border-t border-[#e8dccf]">
                      <Link to={`/hospitals?selected=${rec.hospital.id}`} className="btn-primary text-xs py-2.5 px-5">View Details</Link>
                      <Link to={`/appointments?hospitalId=${rec.hospital.id}&hospitalName=${encodeURIComponent(rec.hospital.name)}`} className="btn-outline text-xs py-2.5 px-5">Book Appointment</Link>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Disclaimer */}
            <div className="p-5 rounded-xl bg-amber-50 border border-amber-200">
              <p className="text-xs text-amber-700 flex items-start gap-2.5">
                <AlertTriangle className="shrink-0 mt-0.5" size={14} />
                {analysis.disclaimer || 'This is AI-assisted guidance only. Please consult a qualified healthcare professional for proper diagnosis.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
