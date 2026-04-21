import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import Landing from './pages/Landing';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import HospitalsPage from './pages/HospitalsPage';
import AppointmentsPage from './pages/AppointmentsPage';
import PatientFeedbackPage from './pages/PatientFeedbackPage';
import EmergencyPage from './pages/EmergencyPage';
import SymptomCheckerPage from './pages/SymptomCheckerPage';
import DashboardPage from './pages/DashboardPage';
import ChatPage from './pages/ChatPage';
import PrescriptionsPage from './pages/PrescriptionsPage';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf0e6]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-med-green-100 border-t-med-green-400 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-beige-500 font-semibold">Loading MedTwin AI...</p>
        </div>
      </div>
    );
  }
  return user ? children : <Navigate to="/auth" replace />;
}

function AuthRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/home" replace /> : children;
}

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" toastOptions={{ style: { borderRadius: '1rem', background: '#faf0e6', border: '1px solid #d0bfae', color: '#2f2a26', fontWeight: 600 } }} />
      <Router>
        <Routes>
          <Route path="/auth" element={<AuthRoute><AuthPage /></AuthRoute>} />
          <Route path="/" element={<Landing />} />
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/home" element={<HomePage />} />
            <Route path="/hospitals" element={<HospitalsPage />} />
            <Route path="/appointments" element={<AppointmentsPage />} />
            <Route path="/feedback" element={<PatientFeedbackPage />} />
            <Route path="/emergency" element={<EmergencyPage />} />
            <Route path="/symptom-checker" element={<SymptomCheckerPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/prescriptions" element={<PrescriptionsPage />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}
