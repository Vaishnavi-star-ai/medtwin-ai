import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaComments, FaCheckCircle, FaThumbsUp, FaStar, FaHospital, FaFilter, FaSortAmountDown, FaArrowRight, FaSearch } from 'react-icons/fa';
import { reviewAPI } from '../services/api';
import StarRating from '../components/ui/StarRating';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

export default function PatientFeedbackPage() {
  const [allFeedback, setAllFeedback] = useState([]);
  const [hospitalStats, setHospitalStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedHospital, setSelectedHospital] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { loadFeedback(); }, []);

  const loadFeedback = async () => {
    try {
      const res = await reviewAPI.getAllFeedback();
      setAllFeedback(res.data.data);
      setHospitalStats(res.data.hospitalStats || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleHelpful = async (id) => {
    try {
      await reviewAPI.markHelpful(id);
      setAllFeedback(prev => prev.map(f => f.id === id ? { ...f, helpfulCount: (f.helpfulCount || 0) + 1 } : f));
      toast.success('Marked as helpful');
    } catch { toast.error('Failed'); }
  };

  let filtered = [...allFeedback];
  if (selectedHospital !== 'all') filtered = filtered.filter(f => f.hospitalId === selectedHospital);
  if (searchQuery) filtered = filtered.filter(f =>
    f.hospitalName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.comment?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.patientName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (sortBy === 'recent') filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  else if (sortBy === 'highest') filtered.sort((a, b) => b.rating - a.rating);
  else if (sortBy === 'lowest') filtered.sort((a, b) => a.rating - b.rating);
  else if (sortBy === 'helpful') filtered.sort((a, b) => (b.helpfulCount || 0) - (a.helpfulCount || 0));

  const getVerdictColor = (verdict) => {
    if (verdict === 'Highly Recommended') return 'text-green-700 bg-green-50 border-green-200';
    if (verdict === 'Good') return 'text-blue-700 bg-blue-50 border-blue-200';
    if (verdict === 'Mixed Reviews') return 'text-amber-700 bg-amber-50 border-amber-200';
    return 'text-red-700 bg-red-50 border-red-200';
  };

  return (
    <div className="page-enter min-h-screen">
      <div className="gradient-hero relative overflow-hidden">
        <div className="absolute inset-0"><div className="absolute -top-1/2 -right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl" /></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 text-white text-center">
          <FaComments size={40} className="mx-auto mb-4 text-cyan-200" />
          <h1 className="text-3xl md:text-4xl font-bold mb-3">Patient Feedback Hub</h1>
          <p className="text-blue-100 max-w-xl mx-auto">Read verified patient experiences to make informed decisions about your healthcare</p>
        </div>
        <svg className="absolute bottom-0 w-full" viewBox="0 0 1440 60" fill="none">
          <path d="M0,40 C360,10 1080,10 1440,40 L1440,60 L0,60 Z" fill="var(--color-surface)" />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hospital Stats Cards */}
        {hospitalStats.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-dark mb-4">Hospital Ratings Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {hospitalStats.map((stat, i) => (
                <div key={stat.hospitalId} className="card p-5 animate-fadeInUp cursor-pointer hover:ring-2 hover:ring-primary-300"
                  style={{ animationDelay: `${i * 0.05}s` }}
                  onClick={() => setSelectedHospital(selectedHospital === stat.hospitalId ? 'all' : stat.hospitalId)}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                        <FaHospital className="text-primary-500" size={16} />
                      </div>
                      <div>
                        <h3 className="font-bold text-dark text-sm">{stat.hospitalName}</h3>
                        <p className="text-xs text-gray-400">{stat.totalReviews} reviews</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-black text-dark">{stat.avgRating}</div>
                      <StarRating rating={stat.avgRating} size={12} showValue={false} />
                    </div>
                  </div>
                  {/* Rating Distribution Mini */}
                  <div className="space-y-1 mb-3">
                    {[5,4,3,2,1].map(n => {
                      const count = stat.distribution[n] || 0;
                      const pct = stat.totalReviews > 0 ? (count / stat.totalReviews * 100) : 0;
                      const colors = { 5: 'bg-green-400', 4: 'bg-lime-400', 3: 'bg-yellow-400', 2: 'bg-orange-400', 1: 'bg-red-400' };
                      return (
                        <div key={n} className="flex items-center gap-2 text-xs">
                          <span className="w-3 text-gray-400">{n}</span>
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full ${colors[n]} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full border ${getVerdictColor(stat.verdict)}`}>
                    {stat.verdict}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div className="relative flex-1 max-w-md">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input type="text" placeholder="Search feedback..." value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)} className="input-field pl-11 text-sm" />
          </div>
          <div className="flex gap-3 items-center">
            <div className="flex items-center gap-2 text-sm">
              <FaFilter className="text-gray-400" size={12} />
              <select value={selectedHospital} onChange={e => setSelectedHospital(e.target.value)}
                className="input-field py-2 px-3 text-sm w-auto">
                <option value="all">All Hospitals</option>
                {hospitalStats.map(s => <option key={s.hospitalId} value={s.hospitalId}>{s.hospitalName}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <FaSortAmountDown className="text-gray-400" size={12} />
              <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                className="input-field py-2 px-3 text-sm w-auto">
                <option value="recent">Most Recent</option>
                <option value="highest">Highest Rated</option>
                <option value="lowest">Lowest Rated</option>
                <option value="helpful">Most Helpful</option>
              </select>
            </div>
          </div>
        </div>

        {/* Feedback Cards */}
        {loading ? <LoadingSpinner text="Loading patient feedback..." /> : (
          <div>
            <p className="text-sm text-gray-500 mb-4">{filtered.length} verified feedback{filtered.length !== 1 ? 's' : ''}</p>
            {filtered.length === 0 ? (
              <div className="card-flat p-12 text-center text-gray-400">
                <FaComments size={48} className="mx-auto mb-4 text-gray-200" />
                <p className="font-medium text-lg">No feedback found</p>
                <p className="text-sm mt-1">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filtered.map((fb, i) => (
                  <div key={fb.id} className="card p-5 animate-fadeInUp" style={{ animationDelay: `${i * 0.03}s` }}>
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <span className="font-bold text-dark">{fb.patientName}</span>
                          <span className="badge badge-verified text-xs"><FaCheckCircle size={10} className="mr-1" /> Verified Patient</span>
                          <span className="text-xs text-gray-400">{new Date(fb.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                        </div>
                        <Link to={`/hospitals?selected=${fb.hospitalId}`} className="text-sm text-primary-600 font-medium hover:underline flex items-center gap-1.5 mb-3">
                          <FaHospital size={12} /> {fb.hospitalName} <FaArrowRight size={10} />
                        </Link>
                        <StarRating rating={fb.rating} size={16} />
                        <p className="text-gray-600 text-sm leading-relaxed mt-3">{fb.comment}</p>
                      </div>
                      <button onClick={() => handleHelpful(fb.id)}
                        className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 bg-gray-50 hover:bg-primary-50 px-4 py-2 rounded-xl transition-all flex-shrink-0">
                        <FaThumbsUp size={14} /> Helpful ({fb.helpfulCount || 0})
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
