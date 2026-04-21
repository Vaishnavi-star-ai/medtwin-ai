import React from 'react';
import { FaHeartbeat, FaGithub, FaLinkedin } from 'react-icons/fa';

export default function Footer() {
  return (
    <footer className="bg-dark text-gray-400 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg gradient-hero flex items-center justify-center">
                <FaHeartbeat className="text-white" size={16} />
              </div>
              <span className="text-white font-bold text-lg">MedTwin+</span>
            </div>
            <p className="text-sm leading-relaxed max-w-md">
              Smart Healthcare Access System — Find real hospitals near you, book appointments with intelligent doctor routing, and access verified patient reviews.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/hospitals" className="hover:text-primary-400 transition-colors">Find Hospitals</a></li>
              <li><a href="/appointments" className="hover:text-primary-400 transition-colors">Appointments</a></li>
              <li><a href="/feedback" className="hover:text-primary-400 transition-colors">Patient Feedback</a></li>
              <li><a href="/emergency" className="hover:text-primary-400 transition-colors">Emergency</a></li>
            </ul>
          </div>

          {/* Features */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Features</h4>
            <ul className="space-y-2 text-sm">
              <li>🏥 Real Hospital Data</li>
              <li>🧑‍⚕️ Smart Doctor Routing</li>
              <li>⭐ Verified Reviews</li>
              <li>🚨 Emergency Finder</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-500">© 2026 MedTwin+ — Smart Healthcare Access System. Built for Healthcare Innovation.</p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-600">Powered by Google Places API & Firebase</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
