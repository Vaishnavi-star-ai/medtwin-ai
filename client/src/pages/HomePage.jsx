import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Hospital, UserCheck, Star, AlertTriangle, MapPin, Activity, ArrowRight, BrainCircuit } from 'lucide-react';
import { hospitalAPI } from '../services/api';
import { useGeolocation } from '../hooks/useGeolocation';
import StarRating from '../components/ui/StarRating';
import { SkeletonCard } from '../components/ui/LoadingSpinner';
import MapView from '../components/map/MapView';

export default function HomePage() {
  const { location } = useGeolocation();
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = location
          ? await hospitalAPI.searchNearby(location.lat, location.lng)
          : await hospitalAPI.getAll();
        setHospitals(res.data.data);
      } catch {}
      setLoading(false);
    };
    load();
  }, [location]);

  return (
    <div className="page-enter">
      {/* ══════════ HERO ══════════ */}
      <section className="gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-1/2 -right-1/4 w-[500px] h-[500px] bg-white/5 rounded-full blur-[80px]" />
        </div>
        <div className="relative max-w-6xl mx-auto px-6 py-20 md:py-28">
          <div className="text-center text-white space-y-6 max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-2 bg-white/15 backdrop-blur px-5 py-2.5 rounded-full text-sm font-semibold">
              <Activity className="animate-pulse" size={16} /> MedTwin AI — v3.0
            </span>
            <h1 className="text-4xl md:text-6xl font-black leading-[1.1] tracking-tight">
              Your Health,<br />Our <span className="text-[#c8f5c8]">Priority</span>
            </h1>
            <p className="text-lg text-green-100 leading-relaxed max-w-xl mx-auto">
              Find hospitals, check symptoms with AI, book appointments, analyze reports — powered by Groq AI & Firebase.
            </p>
            <div className="max-w-lg mx-auto pt-2">
              <div className="relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[#a89b8d]" size={18} />
                <input type="text" placeholder="Search hospitals, specializations..."
                  value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full py-4 pl-14 pr-32 rounded-2xl text-[#2f2a26] bg-white shadow-xl text-base focus:outline-none focus:ring-4 focus:ring-white/20 border-0" />
                <Link to={`/hospitals${searchQuery ? `?q=${searchQuery}` : ''}`}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-[#77DD77] hover:bg-[#68d168] text-white font-bold py-2.5 px-5 rounded-xl text-sm transition-all">
                  Search
                </Link>
              </div>
            </div>
          </div>
        </div>
        <svg className="absolute bottom-0 w-full" viewBox="0 0 1440 80" fill="none" preserveAspectRatio="none">
          <path d="M0,60 C360,15 1080,15 1440,60 L1440,80 L0,80 Z" fill="#faf0e6" />
        </svg>
      </section>

      {/* ══════════ QUICK ACTIONS ══════════ */}
      <section className="max-w-6xl mx-auto px-6 -mt-5 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Link to="/symptom-checker" className="block group">
            <div className="bg-gradient-to-br from-violet-600 to-indigo-700 rounded-2xl p-6 flex items-center gap-5 text-white shadow-lg hover:shadow-xl transition-all hover:scale-[1.01]">
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center shrink-0"><BrainCircuit size={24} /></div>
              <div className="min-w-0">
                <h3 className="text-lg font-bold">AI Symptom Check</h3>
                <p className="text-violet-200 text-sm">Get instant AI guidance</p>
              </div>
              <ArrowRight className="ml-auto shrink-0 group-hover:translate-x-1 transition-transform" size={20} />
            </div>
          </Link>
          <Link to="/dashboard" className="block group">
            <div className="bg-gradient-to-br from-[#77DD77] to-[#4aad4a] rounded-2xl p-6 flex items-center gap-5 text-white shadow-lg hover:shadow-xl transition-all hover:scale-[1.01]">
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center shrink-0"><Activity size={24} /></div>
              <div className="min-w-0">
                <h3 className="text-lg font-bold">Clinical Dashboard</h3>
                <p className="text-green-100 text-sm">Upload & analyze reports</p>
              </div>
              <ArrowRight className="ml-auto shrink-0 group-hover:translate-x-1 transition-transform" size={20} />
            </div>
          </Link>
          <Link to="/emergency" className="block group">
            <div className="gradient-emergency rounded-2xl p-6 flex items-center gap-5 text-white shadow-lg hover:shadow-xl transition-all hover:scale-[1.01]">
              <div className="emergency-pulse w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center shrink-0"><AlertTriangle size={24} /></div>
              <div className="min-w-0">
                <h3 className="text-lg font-bold">Emergency SOS</h3>
                <p className="text-red-100 text-sm">Find nearest hospital</p>
              </div>
              <ArrowRight className="ml-auto shrink-0 group-hover:translate-x-1 transition-transform" size={20} />
            </div>
          </Link>
        </div>
      </section>

      {/* ══════════ MAP ══════════ */}
      {!loading && hospitals.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 mt-12">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-2xl font-bold text-[#2f2a26]">Nearby Hospitals</h2>
              <p className="text-[#a89b8d] text-sm mt-1 flex items-center gap-2"><MapPin className="text-[#77DD77]" size={14} /> Interactive map</p>
            </div>
            <Link to="/hospitals" className="btn-outline text-sm py-2 px-4">View All <ArrowRight size={14} /></Link>
          </div>
          <MapView hospitals={hospitals} userLocation={location} height="350px" onHospitalClick={(h) => window.location.href = `/hospitals?selected=${h.id}`} />
        </section>
      )}

      {/* ══════════ HOSPITAL GRID ══════════ */}
      <section className="max-w-6xl mx-auto px-6 py-14">
        <h2 className="text-2xl font-bold text-[#2f2a26] mb-8">Top Hospitals</h2>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">{[1,2,3,4].map(i => <SkeletonCard key={i} />)}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {hospitals.slice(0, 8).map((hospital) => (
              <Link key={hospital.id} to={`/hospitals?selected=${hospital.id}`} className="card hover:border-[#77DD77]/40 block">
                <div className="w-12 h-12 rounded-xl bg-[#77DD77]/10 flex items-center justify-center mb-4">
                  <Hospital className="text-[#77DD77]" size={20} />
                </div>
                <h3 className="font-bold text-[#2f2a26] text-sm leading-snug mb-2 line-clamp-2">{hospital.name}</h3>
                <div className="mb-2"><StarRating rating={hospital.rating} size={14} count={hospital.totalReviews} /></div>
                <p className="text-[#a89b8d] text-xs flex items-center gap-1.5 mb-3 line-clamp-1"><MapPin size={11} /> {hospital.address}</p>
                <div className="flex items-center gap-3">
                  {hospital.distance !== undefined && (
                    <span className="text-xs font-semibold text-[#4aad4a] bg-[#77DD77]/10 px-2.5 py-1 rounded-lg">{hospital.distance.toFixed(1)} km</span>
                  )}
                  <span className="text-xs font-medium text-[#77DD77]">● Open 24/7</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
