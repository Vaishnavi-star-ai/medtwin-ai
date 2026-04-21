import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaExclamationTriangle, FaMapMarkerAlt, FaPhone, FaDirections, FaHospital, FaHeartbeat, FaCrosshairs, FaStar } from 'react-icons/fa';
import { hospitalAPI } from '../services/api';
import { useGeolocation } from '../hooks/useGeolocation';
import StarRating from '../components/ui/StarRating';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import MapView from '../components/map/MapView';

export default function EmergencyPage() {
  const { location, loading: geoLoading } = useGeolocation();
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        const res = location
          ? await hospitalAPI.searchNearby(location.lat, location.lng, 50)
          : await hospitalAPI.getAll();
        const sorted = res.data.data.sort((a, b) => (a.distance || 0) - (b.distance || 0));
        setHospitals(sorted);
      } catch (err) { console.error(err); }
      setLoading(false);
    };
    fetchHospitals();
  }, [location]);

  const openDirections = (hospital) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${hospital.location.lat},${hospital.location.lng}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white">
      {/* Emergency Header */}
      <div className="gradient-emergency relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-black/10" />
        </div>
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-white text-center">
          <div className="emergency-pulse w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
            <FaExclamationTriangle size={32} />
          </div>
          <h1 className="text-3xl md:text-4xl font-black mb-2">Emergency Hospital Finder</h1>
          <p className="text-red-100 text-lg">Finding nearest hospitals to your location</p>
          {location && (
            <p className="mt-2 text-sm text-red-200 flex items-center justify-center gap-2">
              <FaCrosshairs /> {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {(loading || geoLoading) ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <FaHeartbeat className="text-red-500 animate-pulse" size={28} />
            </div>
            <LoadingSpinner text="Detecting location and finding nearest hospitals..." />
          </div>
        ) : (
          <>
            {/* Map */}
            <div className="mb-6 animate-fadeInUp">
              <MapView hospitals={hospitals} userLocation={location} height="400px" isEmergency={true}
                onHospitalClick={(h) => openDirections(h)} />
            </div>

            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-dark">Nearest Hospitals</h2>
                <p className="text-gray-500 text-sm">{hospitals.length} hospitals found • sorted by distance</p>
              </div>
              <a href="tel:108" className="btn-danger"><FaPhone /> Call 108</a>
            </div>

            <div className="space-y-3">
              {hospitals.map((hospital, i) => (
                <div key={hospital.id} className="card p-4 animate-fadeInUp border-l-4 border-l-red-400"
                  style={{ animationDelay: `${i * 0.04}s` }}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="relative flex-shrink-0">
                        <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
                          <FaHospital className="text-red-500" size={20} />
                        </div>
                        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">{i + 1}</div>
                      </div>
                      <div>
                        <h3 className="font-bold text-dark text-sm">{hospital.name}</h3>
                        <StarRating rating={hospital.rating} size={12} count={hospital.totalReviews} />
                        <p className="text-gray-400 text-xs mt-1 flex items-center gap-1"><FaMapMarkerAlt size={9} /> {hospital.address}</p>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {hospital.specializations?.slice(0, 2).map(s => (
                            <span key={s} className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded-full">{s}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-center px-3 py-1.5 rounded-xl bg-red-50">
                        <div className="text-lg font-black text-red-600">{hospital.distance?.toFixed(1) || '?'}</div>
                        <div className="text-[10px] text-red-400 font-medium">km away</div>
                      </div>
                      <button onClick={() => openDirections(hospital)} className="btn-danger py-2 px-4 text-sm">
                        <FaDirections /> Navigate
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Emergency Info */}
            <div className="mt-8 card p-5 border-2 border-red-200 bg-red-50">
              <h3 className="font-bold text-red-800 mb-3">🚨 Emergency Helplines</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                {[{ num: '108', label: 'Ambulance' }, { num: '112', label: 'Emergency' }, { num: '102', label: 'Medical Help' }].map(({ num, label }) => (
                  <a key={num} href={`tel:${num}`} className="flex items-center gap-3 p-3 bg-white rounded-xl hover:shadow transition-shadow">
                    <FaPhone className="text-red-500" />
                    <div><p className="font-bold text-dark">{num}</p><p className="text-gray-500 text-xs">{label}</p></div>
                  </a>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
