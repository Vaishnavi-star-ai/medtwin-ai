import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons for leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom hospital icon
const hospitalIcon = new L.DivIcon({
  html: `<div style="background: linear-gradient(135deg, #0ea5e9, #0284c7); width: 32px; height: 32px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
    <span style="transform: rotate(45deg); color: white; font-size: 14px; font-weight: bold;">+</span>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
  className: ''
});

// Emergency icon
const emergencyIcon = new L.DivIcon({
  html: `<div style="background: linear-gradient(135deg, #ef4444, #dc2626); width: 36px; height: 36px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); animation: pulse 1.5s ease infinite;">
    <span style="transform: rotate(45deg); color: white; font-size: 16px; font-weight: bold;">!</span>
  </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36],
  className: ''
});

// User location icon
const userIcon = new L.DivIcon({
  html: `<div style="width: 20px; height: 20px; background: #3b82f6; border: 4px solid white; border-radius: 50%; box-shadow: 0 0 0 3px rgba(59,130,246,0.3), 0 2px 8px rgba(0,0,0,0.3);"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  className: ''
});

// Component to fit bounds
function FitBounds({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length > 0) {
      const b = L.latLngBounds(bounds.map(([lat, lng]) => [lat, lng]));
      map.fitBounds(b, { padding: [50, 50] });
    }
  }, [bounds, map]);
  return null;
}

export default function MapView({
  center = [12.9716, 77.5946],
  zoom = 12,
  hospitals = [],
  userLocation = null,
  onHospitalClick = null,
  selectedHospitalId = null,
  isEmergency = false,
  height = '400px',
  className = ''
}) {
  const bounds = [];
  if (userLocation) bounds.push([userLocation.lat, userLocation.lng]);
  hospitals.forEach(h => {
    if (h.location) bounds.push([h.location.lat, h.location.lng]);
  });

  const mapCenter = userLocation ? [userLocation.lat, userLocation.lng] : center;

  return (
    <div className={`rounded-2xl overflow-hidden shadow-lg border border-gray-200 ${className}`} style={{ height }}>
      <MapContainer center={mapCenter} zoom={zoom} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {bounds.length > 1 && <FitBounds bounds={bounds} />}

        {/* User location */}
        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
            <Popup>
              <div className="text-center">
                <p className="font-bold text-sm">📍 Your Location</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Hospitals */}
        {hospitals.map((hospital) => (
          <Marker
            key={hospital.id}
            position={[hospital.location.lat, hospital.location.lng]}
            icon={isEmergency ? emergencyIcon : hospitalIcon}
            eventHandlers={{
              click: () => onHospitalClick && onHospitalClick(hospital)
            }}
          >
            <Popup>
              <div className="min-w-[200px]">
                <h3 className="font-bold text-sm text-gray-900 mb-1">{hospital.name}</h3>
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-amber-500">★</span>
                  <span className="text-xs font-semibold">{hospital.rating}</span>
                  <span className="text-xs text-gray-400">({hospital.totalReviews?.toLocaleString()} reviews)</span>
                </div>
                <p className="text-xs text-gray-500 mb-2">{hospital.address}</p>
                {hospital.distance !== undefined && (
                  <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                    {hospital.distance.toFixed(1)} km away
                  </span>
                )}
                {hospital.specializations && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {hospital.specializations.slice(0, 3).map(s => (
                      <span key={s} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{s}</span>
                    ))}
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
