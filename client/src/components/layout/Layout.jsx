import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import { Activity, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Layout() {
  return (
    <div className="min-h-screen bg-[#faf0e6] font-sans">
      <Navbar />
      <main className="pt-[72px]">
        <Outlet />
      </main>
      <footer className="py-12 border-t border-[#d0bfae]/50 bg-[#faf0e6]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#77DD77] to-[#4aad4a] flex items-center justify-center shadow-lg shadow-[#77DD77]/20">
              <Activity className="text-white" size={20} />
            </div>
            <div>
              <span className="font-extrabold text-xl text-[#2f2a26]">MedTwin AI</span>
              <p className="text-xs text-[#a89b8d] font-medium">Smart Healthcare Platform</p>
            </div>
          </div>
          <div className="flex gap-8 text-sm font-semibold text-[#a89b8d]">
            <Link to="/hospitals" className="hover:text-[#77DD77] transition-colors">Hospitals</Link>
            <Link to="/appointments" className="hover:text-[#77DD77] transition-colors">Appointments</Link>
            <Link to="/dashboard" className="hover:text-[#77DD77] transition-colors">Dashboard</Link>
            <Link to="/chat" className="hover:text-[#77DD77] transition-colors">AI Chat</Link>
          </div>
          <p className="text-sm text-[#a89b8d] flex items-center gap-1.5">
            Built with <Heart size={13} className="text-red-400" /> © 2026 MedTwin AI
          </p>
        </div>
      </footer>
    </div>
  );
}
