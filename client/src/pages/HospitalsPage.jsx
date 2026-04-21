import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Hospital, MapPin, Phone, UserCheck, Search, X, ArrowRight, Calendar, Star, Map, List, LocateFixed, Loader2, AlertCircle } from 'lucide-react';
import { hospitalAPI, doctorAPI } from '../services/api';
import { useGeolocation } from '../hooks/useGeolocation';
import StarRating from '../components/ui/StarRating';
import LoadingSpinner, { SkeletonCard } from '../components/ui/LoadingSpinner';
import MapView from '../components/map/MapView';

export default function HospitalsPage() {
  const { location: geoLocation, loading: geoLoading, isReal, error: geoError, retry } = useGeolocation();
  const [searchParams] = useSearchParams();
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [doctors, setDoctors] = useState(null);
  const [doctorsLoading, setDoctorsLoading] = useState(false);
  const [viewMode, setViewMode] = useState('map');

  // Manual location search
  const [customLocation, setCustomLocation] = useState(null);
  const [locationInput, setLocationInput] = useState('');
  const [locationSearching, setLocationSearching] = useState(false);
  const [locationLabel, setLocationLabel] = useState('');

  const activeLocation = customLocation || geoLocation;

  const handleLocationSearch = async (e) => {
    e.preventDefault();
    if (!locationInput.trim()) return;
    setLocationSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationInput)}&limit=1`);
      const data = await res.json();
      if (data.length > 0) {
        setCustomLocation({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
        setLocationLabel(data[0].display_name.split(',').slice(0, 2).join(','));
      }
    } catch { /* ignore */ }
    setLocationSearching(false);
  };

  const clearCustomLocation = () => {
    setCustomLocation(null);
    setLocationInput('');
    setLocationLabel('');
  };

  useEffect(() => {
    if (geoLoading && !customLocation) return;
    const fetchHospitals = async () => {
      setLoading(true);
      try {
        const loc = activeLocation;
        const res = loc ? await hospitalAPI.searchNearby(loc.lat, loc.lng) : await hospitalAPI.getAll();
        setHospitals(res.data.data);
        setLoading(false);
        const selected = searchParams.get('selected');
        if (selected) { const h = res.data.data.find(h => h.id === selected); if (h) handleSelectHospital(h); }
      } catch { setLoading(false); }
    };
    fetchHospitals();
  }, [activeLocation, geoLoading]);

  const handleSelectHospital = async (hospital) => {
    setSelectedHospital(hospital);
    setDoctorsLoading(true);
    try { const res = await doctorAPI.getByHospital(hospital.id); setDoctors(res.data.data); }
    catch { setDoctors({ seniors: [], practitioners: [], all: [] }); }
    setDoctorsLoading(false);
  };

  const filtered = hospitals.filter(h =>
    h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.specializations?.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="page-enter">
      {/* Header */}
      <div className="bg-white/60 border-b border-[#e8dccf]">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-[#2f2a26] mb-1">Find Hospitals</h1>
              <p className="text-[#a89b8d] text-sm font-medium">Real hospitals with ratings, specializations & doctors</p>
            </div>
            <div className="flex items-center gap-2 bg-[#faf0e6] rounded-xl p-1 border border-[#e8dccf]">
              <button onClick={() => setViewMode('list')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${viewMode === 'list' ? 'bg-white text-[#2f2a26] shadow-sm' : 'text-[#a89b8d]'}`}>
                <List size={15} /> List
              </button>
              <button onClick={() => setViewMode('map')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${viewMode === 'map' ? 'bg-white text-[#2f2a26] shadow-sm' : 'text-[#a89b8d]'}`}>
                <Map size={15} /> Map
              </button>
            </div>
          </div>
          <div className="relative max-w-md mt-5">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a89b8d] pointer-events-none" size={16} />
            <input type="text" placeholder="Search by name, area, or specialization..."
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.75rem', paddingRight: '2.5rem' }}
              className="input-field" />
            {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#a89b8d] hover:text-[#2f2a26]"><X size={16} /></button>}
          </div>
        </div>
      </div>


      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Location Search + Status */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <form onSubmit={handleLocationSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a89b8d] pointer-events-none" size={16} />
              <input type="text" placeholder="Enter a city, area or address..."
                value={locationInput} onChange={(e) => setLocationInput(e.target.value)}
                style={{ paddingLeft: '2.75rem' }}
                className="input-field w-full" />
            </div>
            <button type="submit" disabled={locationSearching || !locationInput.trim()}
              className="btn-primary px-6 shrink-0 disabled:opacity-50">
              {locationSearching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              <span className="ml-2 hidden sm:inline">Search</span>
            </button>
          </form>
          <button onClick={customLocation ? clearCustomLocation : retry}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-[#77DD77]/10 border border-[#77DD77]/30 text-[#2d7a2d] hover:bg-[#77DD77]/20 transition-all shrink-0">
            <LocateFixed size={15} /> {customLocation ? 'Reset to My Location' : 'Use My Location'}
          </button>
        </div>

        {/* Location Status Banner */}
        {customLocation ? (
          <div className="flex items-center gap-3 bg-violet-50 border border-violet-200 text-violet-700 px-5 py-3 rounded-2xl mb-6">
            <MapPin size={18} />
            <span className="text-sm font-semibold">Showing hospitals near: <strong>{locationLabel}</strong></span>
            <button onClick={clearCustomLocation} className="ml-auto text-violet-400 hover:text-violet-600"><X size={16} /></button>
          </div>
        ) : geoLoading ? (
          <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 text-blue-700 px-5 py-3 rounded-2xl mb-6 animate-pulse">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-sm font-semibold">Detecting your location…</span>
          </div>
        ) : isReal ? (
          <div className="flex items-center gap-3 bg-[#77DD77]/10 border border-[#77DD77]/30 text-[#2d7a2d] px-5 py-3 rounded-2xl mb-6">
            <LocateFixed size={18} />
            <span className="text-sm font-semibold">Showing hospitals near your current location</span>
          </div>
        ) : (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 text-amber-700 px-5 py-3 rounded-2xl mb-6">
            <AlertCircle size={18} />
            <span className="text-sm font-semibold">Using default location (Bangalore) — search above or allow location access</span>
          </div>
        )}

        {/* Map View */}
        {viewMode === 'map' && !loading && (
          <div className="mb-8"><MapView hospitals={filtered} userLocation={activeLocation} height="500px" selectedHospitalId={selectedHospital?.id} onHospitalClick={handleSelectHospital} /></div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Hospital List */}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-[#a89b8d] mb-4 font-semibold">{filtered.length} hospitals found</p>
            {loading ? (
              <div className="space-y-4">{[1,2,3].map(i => <SkeletonCard key={i} />)}</div>
            ) : (
              <div className="space-y-4">
                {filtered.map((hospital) => (
                  <div key={hospital.id} onClick={() => handleSelectHospital(hospital)}
                    className={`card cursor-pointer ${selectedHospital?.id === hospital.id ? 'ring-2 ring-[#77DD77] border-[#77DD77]/50' : ''}`}>
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-xl bg-[#77DD77]/10 flex items-center justify-center shrink-0">
                        <Hospital className="text-[#77DD77]" size={22} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-[#2f2a26] mb-1">{hospital.name}</h3>
                        <StarRating rating={hospital.rating} size={14} count={hospital.totalReviews} />
                        <p className="text-[#a89b8d] text-xs mt-1.5 flex items-center gap-1.5"><MapPin size={11} /> {hospital.address}</p>
                        <div className="flex flex-wrap gap-1.5 mt-2.5">
                          {hospital.specializations?.slice(0, 3).map(s => (
                            <span key={s} className="text-[11px] bg-[#77DD77]/10 text-[#4aad4a] px-2.5 py-1 rounded-lg font-semibold">{s}</span>
                          ))}
                        </div>
                        <div className="flex items-center gap-3 mt-2.5">
                          {hospital.distance !== undefined && <span className="text-xs font-semibold text-[#4aad4a] bg-[#77DD77]/10 px-2.5 py-1 rounded-lg">📍 {hospital.distance.toFixed(1)} km</span>}
                          <span className="text-xs text-[#77DD77] font-medium">● Open 24/7</span>
                          <span className="text-xs text-[#a89b8d]">{hospital.type}</span>
                        </div>
                      </div>
                      <ArrowRight className="text-[#d0bfae] shrink-0 mt-2" size={16} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Detail Panel */}
          <div className="lg:w-[400px] shrink-0">
            {selectedHospital ? (
              <div className="card-flat sticky top-[88px] space-y-5 max-h-[calc(100vh-104px)] overflow-y-auto animate-slideInRight">
                <div className="w-14 h-14 rounded-2xl gradient-hero flex items-center justify-center shadow-lg">
                  <Hospital className="text-white" size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#2f2a26] mb-1">{selectedHospital.name}</h2>
                  <StarRating rating={selectedHospital.rating} size={16} count={selectedHospital.totalReviews} />
                  <p className="text-xs text-[#a89b8d] mt-1">{selectedHospital.type}</p>
                </div>
                <p className="text-sm text-[#a89b8d] leading-relaxed">{selectedHospital.description}</p>
                <div className="space-y-2.5 text-sm text-[#a89b8d]">
                  <p className="flex items-center gap-2.5"><MapPin className="text-[#77DD77] shrink-0" size={14} /> {selectedHospital.address}</p>
                  <p className="flex items-center gap-2.5"><Phone className="text-[#77DD77] shrink-0" size={14} /> {selectedHospital.phone}</p>
                  {selectedHospital.distance !== undefined && <p className="flex items-center gap-2.5">📍 {selectedHospital.distance.toFixed(1)} km from you</p>}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#a89b8d] uppercase tracking-wider mb-2.5">Specializations</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedHospital.specializations?.map(s => <span key={s} className="text-xs bg-violet-50 text-violet-600 px-3 py-1.5 rounded-lg font-semibold">{s}</span>)}
                  </div>
                </div>
                <hr className="border-[#e8dccf]" />
                <div>
                  <h3 className="font-bold text-[#2f2a26] mb-3 text-sm flex items-center gap-2"><UserCheck className="text-[#77DD77]" size={16} /> Doctors</h3>
                  {doctorsLoading ? <LoadingSpinner size="sm" text="Loading..." /> : doctors ? (
                    <div className="space-y-2.5">
                      {doctors.all?.length === 0 && <p className="text-[#a89b8d] text-xs">No doctors registered yet.</p>}
                      {doctors.seniors?.map(doc => (
                        <div key={doc.id} className="p-3.5 rounded-xl bg-violet-50 border border-violet-100">
                          <div className="flex items-center justify-between">
                            <div><p className="font-semibold text-sm text-[#2f2a26]">{doc.name}</p><p className="text-xs text-[#a89b8d] mt-0.5">{doc.specialization} • {doc.experience}</p></div>
                            <div className="text-right"><span className="badge badge-senior">Senior</span><p className={`text-xs mt-1 font-medium ${doc.isAvailable ? 'text-[#77DD77]' : 'text-red-500'}`}>{doc.isAvailable ? '● Available' : '● Busy'}</p></div>
                          </div>
                        </div>
                      ))}
                      {doctors.practitioners?.map(doc => (
                        <div key={doc.id} className="p-3.5 rounded-xl bg-amber-50 border border-amber-100">
                          <div className="flex items-center justify-between">
                            <div><p className="font-semibold text-sm text-[#2f2a26]">{doc.name}</p><p className="text-xs text-[#a89b8d] mt-0.5">{doc.specialization} • {doc.experience}</p></div>
                            <div className="text-right"><span className="badge badge-practitioner">Practitioner</span><p className={`text-xs mt-1 font-medium ${doc.isAvailable ? 'text-[#77DD77]' : 'text-red-500'}`}>{doc.isAvailable ? '● Available' : '● Busy'}</p></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div className="space-y-2.5 pt-2">
                  <Link to={`/appointments?hospitalId=${selectedHospital.id}&hospitalName=${encodeURIComponent(selectedHospital.name)}`} className="btn-primary w-full"><Calendar size={16} /> Book Appointment</Link>
                  <Link to={`/feedback?hospitalId=${selectedHospital.id}&hospitalName=${encodeURIComponent(selectedHospital.name)}`} className="btn-outline w-full"><Star size={16} /> Reviews</Link>
                </div>
              </div>
            ) : (
              <div className="card-flat text-center text-[#a89b8d] sticky top-[88px]">
                <Hospital size={48} className="mx-auto mb-4 text-[#e8dccf]" />
                <p className="font-semibold text-base">Select a hospital</p>
                <p className="text-sm mt-1">Click on any hospital to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
