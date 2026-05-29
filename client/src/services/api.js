import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Hospital API
export const hospitalAPI = {
  searchNearby: (lat, lng, radius = 50) =>
    API.get('/hospitals', { params: { lat, lng, radius } }),
  getAll: () => API.get('/hospitals'),
  getDetails: (id) => API.get(`/hospitals/${id}`),
  searchBySpec: (specialization) =>
    API.get('/hospitals', { params: { specialization } })
};

// Doctor API
export const doctorAPI = {
  getByHospital: (hospitalId) => API.get(`/doctors/${hospitalId}`)
};

// Appointment API
export const appointmentAPI = {
  book: (data) => API.post('/appointments', data),
  getByPatient: (patientName) => API.get(`/appointments/patient/${patientName}`),
  getAll: () => API.get('/appointments'),
  complete: (id) => API.patch(`/appointments/${id}/complete`),
  cancel: (id) => API.patch(`/appointments/${id}/cancel`)
};

// Review API
export const reviewAPI = {
  submit: (data) => API.post('/reviews', data),
  getByHospital: (hospitalId) => API.get(`/reviews/hospital/${hospitalId}`),
  getAllFeedback: () => API.get('/reviews/feedback'),
  markHelpful: (id) => API.patch(`/reviews/${id}/helpful`)
};

// AI API (Groq)
export const aiAPI = {
  analyzeSymptoms: (data) => API.post('/ai/analyze-symptoms', data),
  recommendHospitals: (data) => API.post('/ai/recommend-hospitals', data)
};

// Unified Search API
export const searchAPI = {
  search: (query) => API.get('/search', { params: { q: query } })
};

export default API;
