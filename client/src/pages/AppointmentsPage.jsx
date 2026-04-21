import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FaCalendarAlt, FaCheckCircle, FaTimesCircle, FaClock, FaUserMd, FaHospital, FaInfoCircle } from 'react-icons/fa';
import { appointmentAPI } from '../services/api';
import StatusBadge from '../components/ui/StatusBadge';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function AppointmentsPage() {
  const [searchParams] = useSearchParams();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(false);
  const [showBooking, setShowBooking] = useState(!!searchParams.get('hospitalId'));
  const [bookingResult, setBookingResult] = useState(null);
  const { user } = useAuth();

  const patientName = user?.name || localStorage.getItem('patientName') || '';
  const hospitalId = searchParams.get('hospitalId') || '';
  const hospitalName = searchParams.get('hospitalName') || '';

  const [form, setForm] = useState({
    patientName: patientName,
    hospitalId: hospitalId,
    hospitalName: hospitalName,
    preferredTime: '',
    notes: ''
  });

  useEffect(() => {
    if (patientName) loadAppointments();
  }, [patientName]);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const res = await appointmentAPI.getByPatient(patientName);
      setAppointments(res.data.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleBook = async (e) => {
    e.preventDefault();
    if (!form.patientName || !form.hospitalId) {
      toast.error('Patient name and hospital are required');
      return;
    }
    setBooking(true);
    try {
      const res = await appointmentAPI.book(form);
      setBookingResult(res.data.data);
      toast.success('Appointment booked successfully!');
      localStorage.setItem('patientName', form.patientName);
      loadAppointments();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Booking failed');
    }
    setBooking(false);
  };

  const handleComplete = async (id) => {
    try {
      await appointmentAPI.complete(id);
      toast.success('Appointment marked as completed');
      loadAppointments();
    } catch (err) { toast.error('Failed to update'); }
  };

  const handleCancel = async (id) => {
    try {
      await appointmentAPI.cancel(id);
      toast.success('Appointment cancelled');
      loadAppointments();
    } catch (err) { toast.error('Failed to cancel'); }
  };

  return (
    <div className="page-enter">
      <div className="bg-white/60 border-b border-[#e8dccf]">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <h1 className="text-3xl font-black text-[#2f2a26] mb-1">Appointments</h1>
          <p className="text-[#a89b8d] font-medium">Book and manage your healthcare appointments</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Booking Form */}
        {!showBooking ? (
          <button onClick={() => setShowBooking(true)} className="btn-primary"><FaCalendarAlt /> Book New Appointment</button>
        ) : (
          <div className="card p-6 animate-fadeInUp">
            <h2 className="text-xl font-bold text-dark mb-6 flex items-center gap-2"><FaCalendarAlt className="text-primary-500" /> Book Appointment</h2>
            <form onSubmit={handleBook} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Patient Name *</label>
                  <input type="text" value={form.patientName} onChange={e => setForm({...form, patientName: e.target.value})}
                    className="input-field" placeholder="Your full name" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Hospital ID *</label>
                  <input type="text" value={form.hospitalId} onChange={e => setForm({...form, hospitalId: e.target.value})}
                    className="input-field" placeholder="Hospital place ID" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Hospital Name</label>
                  <input type="text" value={form.hospitalName} onChange={e => setForm({...form, hospitalName: e.target.value})}
                    className="input-field" placeholder="Hospital name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Preferred Time</label>
                  <input type="datetime-local" value={form.preferredTime} onChange={e => setForm({...form, preferredTime: e.target.value})}
                    className="input-field" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
                <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}
                  className="input-field" rows={3} placeholder="Describe your symptoms or reason for visit..." />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="btn-primary" disabled={booking}>
                  {booking ? 'Booking...' : '✓ Book Appointment'}
                </button>
                <button type="button" onClick={() => { setShowBooking(false); setBookingResult(null); }} className="btn-outline">Cancel</button>
              </div>
            </form>

            {/* Booking Result */}
            {bookingResult && (
              <div className="mt-6 p-5 rounded-xl bg-green-50 border border-green-200 animate-fadeInUp">
                <h3 className="font-bold text-green-800 mb-3 flex items-center gap-2"><FaCheckCircle /> Appointment Confirmed!</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-gray-500">Assigned Doctor:</span><p className="font-semibold text-dark">{bookingResult.assignedDoctor}</p></div>
                  <div><span className="text-gray-500">Handling Type:</span><p><StatusBadge status={bookingResult.handlingType} type="handling" /></p></div>
                  <div><span className="text-gray-500">Specialization:</span><p className="font-medium">{bookingResult.doctorSpecialization}</p></div>
                  <div><span className="text-gray-500">Time:</span><p className="font-medium">{new Date(bookingResult.time).toLocaleString()}</p></div>
                </div>
                <div className="mt-3 p-3 rounded-lg bg-blue-50 border border-blue-100">
                  <p className="text-sm text-blue-700 flex items-center gap-2"><FaInfoCircle /> {bookingResult.assignmentMessage}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Appointment History */}
        <div>
          <h2 className="text-xl font-bold text-dark mb-4 flex items-center gap-2"><FaClock className="text-primary-500" /> Your Appointments</h2>
          {!patientName ? (
            <div className="card-flat p-8 text-center text-gray-400">
              <p>Enter your name on the Home page to view appointments</p>
            </div>
          ) : loading ? (
            <LoadingSpinner text="Loading appointments..." />
          ) : appointments.length === 0 ? (
            <div className="card-flat p-8 text-center text-gray-400">
              <FaCalendarAlt size={40} className="mx-auto mb-3 text-gray-200" />
              <p className="font-medium">No appointments yet</p>
              <p className="text-sm mt-1">Book your first appointment from the Hospitals page</p>
            </div>
          ) : (
            <div className="space-y-4">
              {appointments.map((appt, i) => (
                <div key={appt.id} className="card p-5 animate-fadeInUp" style={{ animationDelay: `${i * 0.05}s` }}>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                        <FaHospital className="text-primary-500" size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-dark">{appt.hospitalName}</h3>
                        <p className="text-sm text-gray-500 mt-0.5">
                          <FaUserMd className="inline mr-1" size={12} /> {appt.assignedDoctor}
                          <span className="mx-2">•</span>{appt.doctorSpecialization || 'General'}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">{new Date(appt.time).toLocaleString()}</p>
                        <div className="flex gap-2 mt-2">
                          <StatusBadge status={appt.status} type="status" />
                          <StatusBadge status={appt.handlingType} type="handling" />
                        </div>
                      </div>
                    </div>
                    {appt.status === 'booked' && (
                      <div className="flex gap-2">
                        <button onClick={() => handleComplete(appt.id)} className="text-xs font-semibold text-green-600 bg-green-50 px-4 py-2 rounded-lg hover:bg-green-100 transition-colors flex items-center gap-1">
                          <FaCheckCircle /> Complete
                        </button>
                        <button onClick={() => handleCancel(appt.id)} className="text-xs font-semibold text-red-600 bg-red-50 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-1">
                          <FaTimesCircle /> Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
