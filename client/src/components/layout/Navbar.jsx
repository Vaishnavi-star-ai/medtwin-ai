import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Activity, LayoutDashboard, MessageSquare, Pill, Hospital, CalendarDays, BrainCircuit, AlertTriangle, Star, LogOut, Menu, X, User, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const mainNav = [
  { path: '/home', label: 'Home', icon: Activity },
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/hospitals', label: 'Hospitals', icon: Hospital },
  { path: '/appointments', label: 'Appointments', icon: CalendarDays },
];

const moreNav = [
  { path: '/symptom-checker', label: 'AI Symptom Check', icon: BrainCircuit },
  { path: '/chat', label: 'AI Chat', icon: MessageSquare },
  { path: '/prescriptions', label: 'Prescriptions', icon: Pill },
  { path: '/feedback', label: 'Reviews', icon: Star },
];

const allNav = [...mainNav, ...moreNav, { path: '/emergency', label: 'Emergency SOS', icon: AlertTriangle }];

export default function Navbar() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, logout } = useAuth();

  const handleLogout = async () => { await logout(); setShowUserMenu(false); };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-[1000]" style={{ background: 'rgba(250,240,230,0.85)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(208,191,174,0.5)' }}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-[72px]">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#77DD77] to-[#4aad4a] flex items-center justify-center shadow-lg shadow-[#77DD77]/25 group-hover:scale-105 transition-transform">
              <Activity size={20} className="text-white" />
            </div>
            <span className="text-xl font-extrabold tracking-tight">
              <span className="text-[#2f2a26]">Med</span><span className="text-[#77DD77]">Twin</span> <span className="text-[#a89b8d] font-bold text-sm">AI</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {mainNav.map(({ path, label, icon: Icon }) => (
              <Link key={path} to={path}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200
                  ${isActive(path) 
                    ? 'bg-[#77DD77]/15 text-[#3a8f3a] shadow-sm' 
                    : 'text-[#a89b8d] hover:text-[#2f2a26] hover:bg-white/60'}`}>
                <Icon size={16} /> {label}
              </Link>
            ))}
            
            {/* More Dropdown */}
            <div className="relative">
              <button onClick={() => setShowMore(!showMore)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all
                  ${moreNav.some(n => isActive(n.path)) 
                    ? 'bg-[#77DD77]/15 text-[#3a8f3a]' 
                    : 'text-[#a89b8d] hover:text-[#2f2a26] hover:bg-white/60'}`}>
                More <ChevronDown size={14} className={`transition-transform ${showMore ? 'rotate-180' : ''}`} />
              </button>
              {showMore && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMore(false)} />
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-[#d0bfae]/50 py-2 z-50 animate-fadeIn">
                    {moreNav.map(({ path, label, icon: Icon }) => (
                      <Link key={path} to={path} onClick={() => setShowMore(false)}
                        className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold transition-colors
                          ${isActive(path) ? 'bg-[#77DD77]/10 text-[#3a8f3a]' : 'text-[#a89b8d] hover:bg-[#faf0e6] hover:text-[#2f2a26]'}`}>
                        <Icon size={16} /> {label}
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Emergency */}
            <Link to="/emergency"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-red-50 text-red-600 hover:bg-red-100 border border-red-200/60 transition-all ml-1">
              <AlertTriangle size={15} /> SOS
            </Link>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {user && (
              <div className="relative hidden lg:block">
                <button onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-3 pl-3 pr-4 py-2 bg-white/70 hover:bg-white rounded-2xl text-sm font-semibold text-[#2f2a26] transition-all border border-[#d0bfae]/50 shadow-sm">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#77DD77] to-[#4aad4a] flex items-center justify-center shadow-inner">
                    <User className="text-white" size={14} />
                  </div>
                  <span className="max-w-[120px] truncate">{user.name}</span>
                  <ChevronDown size={13} className="text-[#a89b8d]" />
                </button>
                {showUserMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-[#d0bfae]/50 py-2 z-50 animate-fadeIn">
                      <div className="px-5 py-3 border-b border-[#f5e6d6]">
                        <p className="font-bold text-[#2f2a26]">{user.name}</p>
                        <p className="text-xs text-[#a89b8d] mt-0.5">{user.email}</p>
                      </div>
                      <button onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-5 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors font-semibold">
                        <LogOut size={15} /> Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Mobile hamburger */}
            <button className="lg:hidden p-2.5 rounded-xl hover:bg-white/60 transition-colors text-[#2f2a26]"
              onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-[#d0bfae]/50 animate-slideDown" style={{ background: 'rgba(250,240,230,0.95)', backdropFilter: 'blur(24px)' }}>
          <div className="px-6 py-4 space-y-1 max-h-[calc(100vh-72px)] overflow-y-auto">
            {user && (
              <div className="flex items-center gap-3 px-4 py-3 mb-3 bg-white/60 rounded-2xl border border-[#d0bfae]/30">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#77DD77] to-[#4aad4a] flex items-center justify-center">
                  <User className="text-white" size={16} />
                </div>
                <div><p className="font-bold text-sm text-[#2f2a26]">{user.name}</p><p className="text-xs text-[#a89b8d]">{user.email}</p></div>
              </div>
            )}
            {allNav.map(({ path, label, icon: Icon }) => {
              const isEmergency = path === '/emergency';
              return (
                <Link key={path} to={path} onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all
                    ${isEmergency ? 'bg-red-50 text-red-600 border border-red-200/60 mt-2' 
                    : isActive(path) ? 'bg-[#77DD77]/15 text-[#3a8f3a]' 
                    : 'text-[#a89b8d] hover:bg-white/60 hover:text-[#2f2a26]'}`}>
                  <Icon size={18} /> {label}
                </Link>
              );
            })}
            {user && (
              <button onClick={handleLogout}
                className="flex items-center gap-3 w-full px-4 py-3.5 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition-all mt-2">
                <LogOut size={18} /> Sign Out
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
