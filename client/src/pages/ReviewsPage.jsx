import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FaStar, FaCheckCircle, FaPen, FaHospital } from 'react-icons/fa';
import { reviewAPI } from '../services/api';
import StarRating from '../components/ui/StarRating';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

export default function ReviewsPage() {
  const [searchParams] = useSearchParams();
  const hospitalId = searchParams.get('hospitalId') || '';
  const hospitalName = searchParams.get('hospitalName') || '';
  const patientName = localStorage.getItem('patientName') || '';

  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ rating: 5, comment: '' });

  useEffect(() => {
    if (hospitalId) loadReviews();
  }, [hospitalId]);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const res = await reviewAPI.getByHospital(hospitalId);
      setReviews(res.data.data);
      setStats(res.data.stats);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await reviewAPI.submit({ patientName, hospitalId, hospitalName, ...form });
      toast.success('Review submitted successfully!');
      setShowForm(false);
      setForm({ rating: 5, comment: '' });
      loadReviews();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit review');
    }
    setSubmitting(false);
  };

  const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

  return (
    <div className="page-enter min-h-screen">
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-dark mb-2">Hospital Reviews</h1>
          <p className="text-gray-500">{hospitalName || 'Select a hospital to view reviews'}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {!hospitalId ? (
          <div className="card-flat p-12 text-center text-gray-400">
            <FaHospital size={48} className="mx-auto mb-4 text-gray-200" />
            <p className="font-medium text-lg">No hospital selected</p>
            <p className="text-sm mt-1">Go to the Hospitals page and select a hospital to view its reviews</p>
          </div>
        ) : (
          <>
            {/* Stats */}
            {stats && stats.totalReviews > 0 && (
              <div className="card p-6 animate-fadeInUp">
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="text-center">
                    <div className="text-5xl font-black text-dark">{stats.avgRating}</div>
                    <StarRating rating={stats.avgRating} size={20} showValue={false} />
                    <p className="text-sm text-gray-500 mt-2">{stats.totalReviews} verified reviews</p>
                  </div>
                  <div className="flex-1 w-full space-y-2">
                    {[5,4,3,2,1].map(n => {
                      const count = stats.distribution[n] || 0;
                      const pct = stats.totalReviews > 0 ? (count / stats.totalReviews * 100) : 0;
                      return (
                        <div key={n} className="flex items-center gap-3 text-sm">
                          <span className="w-4 text-gray-500 font-medium">{n}</span>
                          <FaStar size={12} className="text-amber-400" />
                          <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-400 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="w-8 text-right text-gray-400 text-xs">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Write Review Button */}
            {!showForm ? (
              <button onClick={() => setShowForm(true)} className="btn-primary"><FaPen /> Write a Review</button>
            ) : (
              <div className="card p-6 animate-fadeInUp">
                <h3 className="font-bold text-dark mb-4">Write Your Review</h3>
                <p className="text-sm text-amber-600 bg-amber-50 px-4 py-2 rounded-lg mb-4">
                  ⚠️ Only patients with completed appointments can submit reviews
                </p>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                    <div className="flex items-center gap-2">
                      {[1,2,3,4,5].map(n => (
                        <button key={n} type="button" onClick={() => setForm({...form, rating: n})}
                          className={`p-2 rounded-lg transition-all ${form.rating >= n ? 'text-amber-400 scale-110' : 'text-gray-300 hover:text-amber-300'}`}>
                          <FaStar size={28} />
                        </button>
                      ))}
                      <span className="ml-2 text-sm font-medium text-gray-600">{ratingLabels[form.rating]}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Your Review</label>
                    <textarea value={form.comment} onChange={e => setForm({...form, comment: e.target.value})}
                      className="input-field" rows={4} placeholder="Share your experience..." required />
                  </div>
                  <div className="flex gap-3">
                    <button type="submit" className="btn-primary" disabled={submitting}>
                      {submitting ? 'Submitting...' : '✓ Submit Review'}
                    </button>
                    <button type="button" onClick={() => setShowForm(false)} className="btn-outline">Cancel</button>
                  </div>
                </form>
              </div>
            )}

            {/* Reviews List */}
            {loading ? <LoadingSpinner text="Loading reviews..." /> : (
              <div className="space-y-4">
                {reviews.length === 0 && (
                  <div className="card-flat p-8 text-center text-gray-400">
                    <FaStar size={40} className="mx-auto mb-3 text-gray-200" />
                    <p className="font-medium">No reviews yet</p>
                    <p className="text-sm mt-1">Be the first to review this hospital</p>
                  </div>
                )}
                {reviews.map((review, i) => (
                  <div key={review.id} className="card p-5 animate-fadeInUp" style={{ animationDelay: `${i * 0.05}s` }}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-dark">{review.patientName}</span>
                          {review.verified && (
                            <span className="badge badge-verified text-xs"><FaCheckCircle size={10} className="mr-1" /> Verified</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{new Date(review.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                      </div>
                      <StarRating rating={review.rating} size={14} />
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed">{review.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
