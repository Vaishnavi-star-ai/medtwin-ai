import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Hospital, UserCheck, Star, AlertTriangle, MapPin, Activity, ArrowRight, BrainCircuit, Loader2, X, Phone } from 'lucide-react';
import { hospitalAPI, searchAPI } from '../services/api';
import { useGeolocation } from '../hooks/useGeolocation';
import StarRating from '../components/ui/StarRating';
import { SkeletonCard } from '../components/ui/LoadingSpinner';
import MapView from '../components/map/MapView';

const TABS = [
  { key: 'hospitals', label: 'Hospitals', icon: Hospital },
  { key: 'patients', label: 'Patients', icon: UserCheck },
  { key: 'reviews', label: 'Reviews', icon: Star },
];

export default function HomePage() {
  const { location } = useGeolocation();
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Search results state
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [activeTab, setActiveTab] = useState('hospitals');

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

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    setActiveTab('hospitals');
    try {
      const res = await searchAPI.search(searchQuery);
      setSearchResults(res.data);
    } catch {
      setSearchResults({ hospitals: [], patients: [], reviews: [], report: null, counts: { hospitals: 0, patients: 0, reviews: 0 } });
    }
    setSearching(false);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults(null);
  };

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
            <form onSubmit={handleSearch} className="max-w-lg mx-auto pt-2">
              <div className="relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[#a89b8d]" size={18} />
                <input type="text" placeholder="Search diseases, specializations, hospitals..."
                  value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full py-4 pl-14 pr-32 rounded-2xl text-[#2f2a26] bg-white shadow-xl text-base focus:outline-none focus:ring-4 focus:ring-white/20 border-0" />
                {searchResults && (
                  <button type="button" onClick={clearSearch} className="absolute right-28 top-1/2 -translate-y-1/2 text-[#a89b8d] hover:text-[#2f2a26] p-1">
                    <X size={16} />
                  </button>
                )}
                <button type="submit" disabled={searching || !searchQuery.trim()}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-[#77DD77] hover:bg-[#68d168] text-white font-bold py-2.5 px-5 rounded-xl text-sm transition-all disabled:opacity-50 flex items-center gap-2">
                  {searching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                  Search
                </button>
              </div>
            </form>
          </div>
        </div>
        <svg className="absolute bottom-0 w-full" viewBox="0 0 1440 80" fill="none" preserveAspectRatio="none">
          <path d="M0,60 C360,15 1080,15 1440,60 L1440,80 L0,80 Z" fill="#faf0e6" />
        </svg>
      </section>

      {/* ══════════ SEARCH RESULTS ══════════ */}
      {(searching || searchResults) && (
        <section className="max-w-6xl mx-auto px-6 -mt-5 relative z-10 mb-8">
          <div className="bg-white/80 backdrop-blur-xl border border-[#e8dccf] rounded-3xl shadow-xl overflow-hidden">
            {/* Results Header */}
            <div className="px-6 pt-6 pb-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-[#2f2a26]">
                  {searching ? 'Searching...' : `Results for "${searchResults?.query}"`}
                </h2>
                <button onClick={clearSearch} className="text-[#a89b8d] hover:text-[#2f2a26] p-2 rounded-lg hover:bg-[#faf0e6] transition-all">
                  <X size={18} />
                </button>
              </div>

              {/* Tabs */}
              {!searching && (
                <div className="flex gap-1 bg-[#faf0e6] rounded-xl p-1 border border-[#e8dccf]">
                  {TABS.map(tab => (
                    <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all flex-1 justify-center
                        ${activeTab === tab.key ? 'bg-white text-[#2f2a26] shadow-sm' : 'text-[#a89b8d] hover:text-[#2f2a26]'}`}>
                      <tab.icon size={15} />
                      {tab.label}
                      {searchResults?.counts?.[tab.key] !== undefined && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === tab.key ? 'bg-[#77DD77]/15 text-[#4aad4a]' : 'bg-[#e8dccf] text-[#a89b8d]'}`}>
                          {tab.key === 'reports' ? (searchResults?.report ? '1' : '0') : searchResults.counts[tab.key]}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {searching ? (
                <div className="flex items-center justify-center py-16 gap-3 text-[#a89b8d]">
                  <Loader2 size={24} className="animate-spin text-[#77DD77]" />
                  <span className="font-medium">Searching across hospitals, patients & reviews...</span>
                </div>
              ) : (
                <>
                  {/* HOSPITALS TAB */}
                  {activeTab === 'hospitals' && (
                    <div className="space-y-4 animate-fadeIn">
                      {searchResults?.hospitals?.length === 0 ? (
                        <p className="text-center text-[#a89b8d] py-12">No hospitals found for this search.</p>
                      ) : (
                        searchResults?.hospitals?.map(hospital => (
                          <Link key={hospital.id} to={`/hospitals?selected=${hospital.id}`}
                            className="flex items-start gap-4 p-5 rounded-2xl bg-[#faf0e6]/60 border border-[#e8dccf] hover:border-[#77DD77]/40 hover:shadow-md transition-all">
                            <div className="w-12 h-12 rounded-xl bg-[#77DD77]/10 flex items-center justify-center shrink-0">
                              <Hospital className="text-[#77DD77]" size={20} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-[#2f2a26] mb-1">{hospital.name}</h3>
                              <StarRating rating={hospital.rating} size={13} count={hospital.totalReviews} />
                              <p className="text-[#a89b8d] text-xs mt-1 flex items-center gap-1.5"><MapPin size={11} /> {hospital.address}</p>
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {hospital.specializations?.map(s => (
                                  <span key={s} className={`text-[11px] px-2.5 py-1 rounded-lg font-semibold ${s.toLowerCase().includes(searchResults.query.toLowerCase()) ? 'bg-[#77DD77]/20 text-[#2d7a2d] ring-1 ring-[#77DD77]/30' : 'bg-[#77DD77]/10 text-[#4aad4a]'}`}>{s}</span>
                                ))}
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1 shrink-0">
                              <span className="text-xs text-[#77DD77] font-medium">● Open 24/7</span>
                              {hospital.phone && <span className="text-xs text-[#a89b8d] flex items-center gap-1"><Phone size={10} /> {hospital.phone}</span>}
                            </div>
                          </Link>
                        ))
                      )}
                    </div>
                  )}

                  {/* PATIENTS TAB — Only treated/completed patients */}
                  {activeTab === 'patients' && (
                    <div className="space-y-3 animate-fadeIn">
                      {searchResults?.patients?.length === 0 ? (
                        <div className="text-center py-12">
                          <UserCheck size={48} className="mx-auto mb-4 text-[#e8dccf]" />
                          <p className="text-[#a89b8d] font-semibold text-lg mb-1">No treated patients found</p>
                          <p className="text-[#a89b8d] text-sm">No patients have been treated for "{searchResults?.query}" yet.</p>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm text-[#a89b8d] mb-4 font-medium">
                            {searchResults.patients.length} patient{searchResults.patients.length > 1 ? 's' : ''} treated for "{searchResults.query}"
                          </p>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="text-left text-[#a89b8d] text-xs uppercase tracking-wider border-b border-[#e8dccf]">
                                  <th className="pb-3 pr-4 font-bold">Patient Name</th>
                                  <th className="pb-3 pr-4 font-bold">Hospital</th>
                                  <th className="pb-3 pr-4 font-bold">Treated By</th>
                                  <th className="pb-3 font-bold">Disease Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {searchResults.patients.map((p, i) => (
                                  <tr key={p.id || i} className="border-b border-[#e8dccf]/50 last:border-0">
                                    <td className="py-3 pr-4 font-semibold text-[#2f2a26]">{p.patientName}</td>
                                    <td className="py-3 pr-4 text-[#a89b8d]">{p.hospitalName}</td>
                                    <td className="py-3 pr-4 text-[#2f2a26]">{p.assignedDoctor}</td>
                                    <td className="py-3">
                                      <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-[#77DD77]/15 text-[#4aad4a]">
                                        ✓ Resolved
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* REVIEWS TAB */}
                  {activeTab === 'reviews' && (
                    <div className="space-y-4 animate-fadeIn">
                      {searchResults?.reviews?.length === 0 ? (
                        <div className="text-center py-12">
                          <Star size={48} className="mx-auto mb-4 text-[#e8dccf]" />
                          <p className="text-[#a89b8d] font-semibold text-lg mb-1">No reviews found</p>
                          <p className="text-[#a89b8d] text-sm">No reviews mentioning "{searchResults?.query}" yet.</p>
                        </div>
                      ) : (
                        <>
                          {searchResults.reviewsFallback && (
                            <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm font-medium px-4 py-3 rounded-xl mb-4">
                              ⚠️ No reviews specifically about "{searchResults.query}". Showing reviews from hospitals that treat this condition.
                            </div>
                          )}
                          <p className="text-sm text-[#a89b8d] mb-4 font-medium">
                            {searchResults.reviews.length} {searchResults.reviewsFallback ? 'hospital' : 'disease-related'} reviews
                          </p>
                          {searchResults.reviews.map((review, i) => (
                            <div key={review.id || i} className="p-5 rounded-2xl bg-[#faf0e6]/60 border border-[#e8dccf]">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <p className="font-bold text-[#2f2a26] text-sm">{review.patientName}</p>
                                  <p className="text-xs text-[#a89b8d]">{review.hospitalName}</p>
                                </div>
                                <div className="text-right">
                                  <StarRating rating={review.rating} size={13} />
                                  {review.verified && <span className="text-[10px] text-[#4aad4a] font-bold">✓ Verified</span>}
                                </div>
                              </div>
                              <p className="text-sm text-[#403933] leading-relaxed">{review.comment}</p>
                              <div className="flex items-center gap-3 mt-3 text-xs text-[#a89b8d]">
                                <span>{new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                {review.helpfulCount > 0 && <span>👍 {review.helpfulCount} found helpful</span>}
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ══════════ QUICK ACTIONS ══════════ */}
      {!searchResults && (
        <>
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
        </>
      )}
    </div>
  );
}
