/**
 * Hospital Data Service — Firebase/In-Memory
 * NO Google Places API — all data stored locally or in Firestore
 */

// Comprehensive hospital data with real coordinates for Indian cities
const hospitalData = [
  {
    id: 'hosp_001', name: 'Apollo Hospitals Bannerghatta', rating: 4.3, totalReviews: 12847,
    address: '154/11, Opp. IIM, Bannerghatta Main Road, Bangalore, Karnataka 560076',
    location: { lat: 12.8917, lng: 77.5969 }, phone: '+91 80 2630 4050',
    specializations: ['Cardiology', 'Neurology', 'Oncology', 'Orthopedics'],
    type: 'Multi-Specialty Hospital', openHours: '24/7', emergency: true,
    description: 'Apollo Hospitals Bannerghatta is a premier multi-specialty hospital offering world-class healthcare services with cutting-edge technology and experienced medical professionals.'
  },
  {
    id: 'hosp_002', name: 'Fortis Hospital Bannerghatta Road', rating: 4.1, totalReviews: 8234,
    address: '154/9, Bannerghatta Road, Near Meenakshi Mall, Bangalore, Karnataka 560076',
    location: { lat: 12.8889, lng: 77.5979 }, phone: '+91 80 6621 4444',
    specializations: ['Orthopedics', 'Gynecology', 'Trauma', 'General Surgery'],
    type: 'Multi-Specialty Hospital', openHours: '24/7', emergency: true,
    description: 'Fortis Hospital is known for its exceptional orthopedic and trauma care with state-of-the-art operation theaters.'
  },
  {
    id: 'hosp_003', name: 'Narayana Health City', rating: 4.5, totalReviews: 15632,
    address: '#258/A, Bommasandra Industrial Area, Hosur Road, Bangalore, Karnataka 560099',
    location: { lat: 12.8090, lng: 77.6710 }, phone: '+91 80 7122 2222',
    specializations: ['Cardiac Surgery', 'Pediatrics', 'Nephrology', 'Neurosurgery'],
    type: 'Super-Specialty Hospital', openHours: '24/7', emergency: true,
    description: 'Narayana Health City is one of the largest cardiac care centers in the world, providing affordable world-class healthcare.'
  },
  {
    id: 'hosp_004', name: 'Manipal Hospital Old Airport Road', rating: 4.2, totalReviews: 9876,
    address: '98, HAL Old Airport Road, Bangalore, Karnataka 560017',
    location: { lat: 12.9585, lng: 77.6480 }, phone: '+91 80 2502 4444',
    specializations: ['Dermatology', 'Gastroenterology', 'Urology', 'ENT'],
    type: 'Multi-Specialty Hospital', openHours: '24/7', emergency: true,
    description: 'Manipal Hospital is a trusted name in healthcare with comprehensive medical services and advanced diagnostic facilities.'
  },
  {
    id: 'hosp_005', name: 'Columbia Asia Hospital Hebbal', rating: 4.0, totalReviews: 6543,
    address: '26/4, Brigade Gateway, Beside Manyata Tech Park, Hebbal, Bangalore 560024',
    location: { lat: 13.0469, lng: 77.5944 }, phone: '+91 80 7199 9999',
    specializations: ['Oncology', 'Pulmonology', 'Endocrinology', 'Rheumatology'],
    type: 'Multi-Specialty Hospital', openHours: '24/7', emergency: true,
    description: 'Columbia Asia provides international quality healthcare at affordable prices with a focus on patient comfort.'
  },
  {
    id: 'hosp_006', name: 'Sakra World Hospital', rating: 4.4, totalReviews: 7210,
    address: 'SY NO.52/2, Devarabeesanahalli, Opposite Intel, Bangalore 560103',
    location: { lat: 12.9364, lng: 77.7010 }, phone: '+91 80 4969 4969',
    specializations: ['Pulmonology', 'Spine Surgery', 'Joint Replacement', 'Diabetes'],
    type: 'Multi-Specialty Hospital', openHours: '24/7', emergency: true,
    description: 'Sakra World Hospital combines Japanese healthcare precision with Indian medical expertise for outstanding patient outcomes.'
  },
  {
    id: 'hosp_007', name: 'BGS Gleneagles Global Hospital', rating: 4.1, totalReviews: 5432,
    address: '67, Uttarahalli Main Road, Kengeri, Bangalore, Karnataka 560060',
    location: { lat: 12.9081, lng: 77.5279 }, phone: '+91 80 2625 5555',
    specializations: ['ENT', 'Ophthalmology', 'Plastic Surgery', 'Psychiatry'],
    type: 'Multi-Specialty Hospital', openHours: '24/7', emergency: true,
    description: 'BGS Gleneagles offers comprehensive healthcare with a multidisciplinary approach to complex medical conditions.'
  },
  {
    id: 'hosp_008', name: 'Aster CMI Hospital', rating: 4.3, totalReviews: 8901,
    address: '#43/2, New Airport Road, NH-7, Sahakara Nagar, Bangalore 560092',
    location: { lat: 13.0622, lng: 77.5912 }, phone: '+91 80 4342 0100',
    specializations: ['Cardiology', 'Nephrology', 'Liver Transplant', 'Bariatrics'],
    type: 'Multi-Specialty Hospital', openHours: '24/7', emergency: true,
    description: 'Aster CMI Hospital is a quaternary care hospital providing advanced medical treatments with compassionate care.'
  },
  {
    id: 'hosp_009', name: 'Sparsh Hospital Yeshwanthpur', rating: 3.9, totalReviews: 4321,
    address: '29/P2, The Presidency, Tumkur Road, Yeshwanthpur, Bangalore 560022',
    location: { lat: 13.0225, lng: 77.5440 }, phone: '+91 80 2258 0888',
    specializations: ['Orthopedics', 'Sports Medicine', 'Trauma', 'Rehabilitation'],
    type: 'Specialty Hospital', openHours: '24/7', emergency: true,
    description: 'Sparsh is a leading orthopedic and sports medicine hospital known for joint replacements and trauma care.'
  },
  {
    id: 'hosp_010', name: 'MS Ramaiah Memorial Hospital', rating: 4.0, totalReviews: 6789,
    address: 'MSR Nagar, MSRIT Post, Mathikere, Bangalore, Karnataka 560054',
    location: { lat: 13.0312, lng: 77.5655 }, phone: '+91 80 2360 5190',
    specializations: ['General Medicine', 'Pediatrics', 'Obstetrics', 'Radiology'],
    type: 'Teaching Hospital', openHours: '24/7', emergency: true,
    description: 'MS Ramaiah Memorial Hospital is a premier teaching hospital providing quality healthcare with academic excellence.'
  },
  {
    id: 'hosp_011', name: 'Vikram Hospital Millers Road', rating: 4.2, totalReviews: 3456,
    address: '71/1, Millers Road, Vasanth Nagar, Bangalore, Karnataka 560052',
    location: { lat: 12.9891, lng: 77.5867 }, phone: '+91 80 2227 4444',
    specializations: ['Cardiology', 'Neurology', 'Critical Care', 'Dialysis'],
    type: 'Multi-Specialty Hospital', openHours: '24/7', emergency: true,
    description: 'Vikram Hospital is known for its advanced cardiac and neurology care with round-the-clock emergency services.'
  },
  {
    id: 'hosp_012', name: 'Jayadeva Institute of Cardiology', rating: 4.6, totalReviews: 11234,
    address: '9th Block, Jayanagar, Bannerghatta Road, Bangalore, Karnataka 560069',
    location: { lat: 12.9180, lng: 77.5930 }, phone: '+91 80 2653 4346',
    specializations: ['Cardiology', 'Cardiac Surgery', 'Interventional Cardiology'],
    type: 'Super-Specialty Hospital', openHours: '24/7', emergency: true,
    description: 'Sri Jayadeva Institute is a government super-specialty cardiac hospital providing world-class heart care at minimal cost.'
  }
];

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function searchNearbyHospitals(lat, lng, radius = 50) {
  return hospitalData
    .map(h => ({
      ...h,
      distance: calculateDistance(lat, lng, h.location.lat, h.location.lng)
    }))
    .filter(h => h.distance <= radius)
    .sort((a, b) => a.distance - b.distance);
}

function getHospitalById(id) {
  return hospitalData.find(h => h.id === id) || null;
}

function searchHospitalsBySpecialization(specialization) {
  return hospitalData.filter(h =>
    h.specializations.some(s => s.toLowerCase().includes(specialization.toLowerCase()))
  );
}

function getAllHospitals() {
  return hospitalData;
}

module.exports = { searchNearbyHospitals, getHospitalById, searchHospitalsBySpecialization, getAllHospitals, hospitalData };
