import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Activity, Mail, Lock, User, ArrowRight, Loader2, Sparkles, ArrowLeft } from 'lucide-react';
import { auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, sendPasswordResetEmail } from '../config/firebase';
import toast from 'react-hot-toast';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showForgot, setShowForgot] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [resetEmail, setResetEmail] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, form.email, form.password);
        toast.success('Welcome back!');
      } else {
        if (!form.name.trim()) { toast.error('Please enter your name'); setLoading(false); return; }
        const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
        await updateProfile(cred.user, { displayName: form.name });
        toast.success('Account created!');
      }
      navigate('/home');
    } catch (error) {
      let msg = 'Something went wrong';
      if (error.code === 'auth/email-already-in-use') msg = 'Email already registered. Please login.';
      else if (error.code === 'auth/invalid-email') msg = 'Invalid email address';
      else if (error.code === 'auth/weak-password') msg = 'Password must be at least 6 characters';
      else if (error.code?.includes('invalid-credential') || error.code?.includes('wrong-password') || error.code?.includes('user-not-found')) msg = 'Invalid email or password';
      toast.error(msg);
    }
    setLoading(false);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!resetEmail.trim()) { toast.error('Please enter your email'); return; }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      toast.success('Password reset email sent! Check your inbox.');
      setShowForgot(false);
      setForm({ ...form, email: resetEmail });
      setResetEmail('');
    } catch (error) {
      let msg = 'Failed to send reset email';
      if (error.code === 'auth/user-not-found') msg = 'No account found with this email';
      else if (error.code === 'auth/invalid-email') msg = 'Invalid email address';
      else if (error.code === 'auth/too-many-requests') msg = 'Too many attempts. Please try again later.';
      toast.error(msg);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#faf0e6] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="fixed top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-[#77DD77]/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-[#77DD77]/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <Link to="/" className="flex items-center justify-center gap-2 text-[#77DD77] font-bold text-2xl mb-8">
          <Activity size={28} className="animate-pulse" /> MedTwin AI
        </Link>

        <div className="bg-white/60 backdrop-blur-xl border border-[#d0bfae] rounded-3xl shadow-xl p-8 space-y-6">

          {/* Forgot Password View */}
          {showForgot ? (
            <>
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 text-amber-600 font-bold text-xs mb-4">
                  <Mail size={14} /> Password Recovery
                </div>
                <h1 className="text-2xl font-extrabold text-[#2f2a26] mb-1">Reset Password</h1>
                <p className="text-[#a89b8d] text-sm font-medium">Enter your email and we'll send you a reset link</p>
              </div>

              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#a89b8d] uppercase tracking-wider mb-2">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 text-[#a89b8d]" size={16} />
                    <input type="email" value={resetEmail} onChange={e => setResetEmail(e.target.value)}
                      className="w-full bg-[#faf0e6] border border-[#d0bfae] pl-11 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#77DD77] text-[#2f2a26] font-medium" placeholder="you@example.com" required autoFocus />
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full bg-[#2f2a26] hover:bg-[#403933] text-white font-bold py-3.5 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2">
                  {loading ? <><Loader2 size={18} className="animate-spin" /> Sending...</> : <><Mail size={18} /> Send Reset Link</>}
                </button>
              </form>

              <div className="text-center">
                <button onClick={() => setShowForgot(false)} className="text-[#77DD77] font-bold text-sm hover:underline flex items-center justify-center gap-1 mx-auto">
                  <ArrowLeft size={14} /> Back to Sign In
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Normal Login / Signup View */}
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#77DD77]/10 text-[#4aad4a] font-bold text-xs mb-4">
                  <Sparkles size={14} /> Secure Healthcare Access
                </div>
                <h1 className="text-2xl font-extrabold text-[#2f2a26] mb-1">{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
                <p className="text-[#a89b8d] text-sm font-medium">{isLogin ? 'Sign in to your healthcare dashboard' : 'Join MedTwin AI platform'}</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <div>
                    <label className="block text-xs font-bold text-[#a89b8d] uppercase tracking-wider mb-2">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3 text-[#a89b8d]" size={16} />
                      <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                        className="w-full bg-[#faf0e6] border border-[#d0bfae] pl-11 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#77DD77] text-[#2f2a26] font-medium" placeholder="Enter your name" />
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-bold text-[#a89b8d] uppercase tracking-wider mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 text-[#a89b8d]" size={16} />
                    <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                      className="w-full bg-[#faf0e6] border border-[#d0bfae] pl-11 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#77DD77] text-[#2f2a26] font-medium" placeholder="you@example.com" required />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#a89b8d] uppercase tracking-wider mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 text-[#a89b8d]" size={16} />
                    <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})}
                      className="w-full bg-[#faf0e6] border border-[#d0bfae] pl-11 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#77DD77] text-[#2f2a26] font-medium" placeholder="At least 6 characters" required minLength={6} />
                  </div>
                </div>

                {isLogin && (
                  <div className="text-right">
                    <button type="button" onClick={() => { setShowForgot(true); setResetEmail(form.email); }}
                      className="text-[#77DD77] font-semibold text-sm hover:underline">
                      Forgot Password?
                    </button>
                  </div>
                )}

                <button type="submit" disabled={loading}
                  className="w-full bg-[#2f2a26] hover:bg-[#403933] text-white font-bold py-3.5 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 mt-2">
                  {loading ? <><Loader2 size={18} className="animate-spin" /> Processing...</> : <>{isLogin ? 'Sign In' : 'Create Account'} <ArrowRight size={18} /></>}
                </button>
              </form>

              <div className="text-center text-sm">
                <span className="text-[#a89b8d]">{isLogin ? "Don't have an account?" : 'Already registered?'} </span>
                <button onClick={() => setIsLogin(!isLogin)} className="text-[#77DD77] font-bold hover:underline">
                  {isLogin ? 'Sign Up' : 'Sign In'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
