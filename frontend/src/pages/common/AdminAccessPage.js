/**
 * Admin Access Portal
 * Provides links to role-specific login pages with an ultra-premium UI
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { FaBuilding, FaCrown, FaConciergeBell, FaUser, FaUserPlus, FaArrowLeft } from 'react-icons/fa';

const AdminAccessPage = () => {
  return (
    <div className="min-h-screen relative font-sans flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8">
      {/* Premium Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900/90 via-gray-900/70 to-gray-900/95 z-10" />
        <img
          src="/admin-portal-bg.png"
          alt="Premium Hotel Exterior"
          className="w-full h-full object-cover"
        />
      </div>

      <div className="max-w-6xl w-full z-20">
        <div className="text-center mb-16 animate-fade-in-up">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight drop-shadow-md">
            Platform Operations
          </h1>
          <p className="text-lg text-gray-300 font-light tracking-wide">
            Select your secure portal to continue
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mb-16">
          {/* Hotel Admin Portal */}
          <Link
            to="/hotel/login"
            className="group relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all duration-500 hover:-translate-y-2 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10 flex flex-col h-full">
              <div className="h-14 w-14 rounded-xl bg-blue-500/20 flex items-center justify-center mb-6 text-blue-400 group-hover:scale-110 transition-transform duration-500 shadow-lg shadow-blue-500/20">
                <FaBuilding className="text-2xl" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">Hotel Admin</h3>
              <p className="text-gray-400 text-sm mb-8 flex-grow">
                Manage your specific hotel property, staff, services, and guest relations.
              </p>
              <div className="inline-flex items-center text-sm font-semibold text-blue-400 group-hover:text-blue-300 transition-colors">
                Access Portal
                <svg className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>

          {/* Super Admin Portal */}
          <Link
            to="/super-hotel-admin/login"
            className="group relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all duration-500 hover:-translate-y-2 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10 flex flex-col h-full">
              <div className="h-14 w-14 rounded-xl bg-yellow-500/20 flex items-center justify-center mb-6 text-yellow-400 group-hover:scale-110 transition-transform duration-500 shadow-lg shadow-yellow-500/20">
                <FaCrown className="text-2xl" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">Super Admin</h3>
              <p className="text-gray-400 text-sm mb-8 flex-grow">
                Global oversight, multi-hotel management, and system-wide configurations.
              </p>
              <div className="inline-flex items-center text-sm font-semibold text-yellow-400 group-hover:text-yellow-300 transition-colors">
                Access Portal
                <svg className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>

          {/* Service Provider Portal */}
          <Link
            to="/serviceprovider/login"
            className="group relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all duration-500 hover:-translate-y-2 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10 flex flex-col h-full">
              <div className="h-14 w-14 rounded-xl bg-teal-500/20 flex items-center justify-center mb-6 text-teal-400 group-hover:scale-110 transition-transform duration-500 shadow-lg shadow-teal-500/20">
                <FaConciergeBell className="text-2xl" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">Service Partner</h3>
              <p className="text-gray-400 text-sm mb-8 flex-grow">
                Fulfill guest requests, manage workflows, and operate service endpoints.
              </p>
              <div className="inline-flex items-center text-sm font-semibold text-teal-400 group-hover:text-teal-300 transition-colors">
                Access Portal
                <svg className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        </div>

        {/* Guest Access Section */}
        <div className="max-w-2xl mx-auto text-center relative">
          <div className="absolute inset-0 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl -z-10" />
          <div className="p-8 sm:px-12">
            <h3 className="text-xl font-semibold text-white mb-2">Are you a hotel guest?</h3>
            <p className="text-gray-400 text-sm mb-6">Access your room, book services, and manage your current stay.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/login"
                className="w-full sm:w-auto inline-flex justify-center items-center gap-2 bg-white text-gray-900 py-3 px-8 rounded-xl font-bold hover:bg-gray-100 transition-colors shadow-lg shadow-white/10"
              >
                <FaUser className="text-sm" />
                Guest Login
              </Link>
              <Link
                to="/register"
                className="w-full sm:w-auto inline-flex justify-center items-center gap-2 bg-transparent border border-white/30 text-white py-3 px-8 rounded-xl font-bold hover:bg-white/10 transition-colors"
              >
                <FaUserPlus className="text-sm" />
                Register
              </Link>
            </div>
          </div>
        </div>

        <div className="text-center mt-12">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm font-medium transition-colors"
          >
            <FaArrowLeft className="text-xs" />
            Back to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminAccessPage;
