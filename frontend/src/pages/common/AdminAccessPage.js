/**
 * Admin Access Portal
 * Provides links to role-specific login pages
 */

import React from 'react';
import { Link } from 'react-router-dom';

const AdminAccessPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 py-12 px-2 sm:px-3 lg:px-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Admin Portal Access</h1>
          <p className="text-xl text-gray-300">Choose your portal to continue</p>
        </div>        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Hotel Admin Portal */}
          <Link
            to="/hotel/login"
            className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-6 text-center hover:bg-opacity-20 transition-all duration-300 transform hover:scale-105 border border-white border-opacity-20"
          >
            <div className="mb-4">
              <div className="mx-auto h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center mb-3">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white mb-1">Hotel Admin</h3>
              <p className="text-gray-300 text-xs">Hotel management</p>
            </div>
            <div className="bg-blue-600 text-white py-2 px-4 rounded-lg font-medium text-sm">
              Hotel Dashboard
            </div>
          </Link>

          {/* Super Hotel Portal */}
          <Link
            to="/super-hotel-admin/login"
            className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-6 text-center hover:bg-opacity-20 transition-all duration-300 transform hover:scale-105 border border-white border-opacity-20"
          >
            <div className="mb-4">
              <div className="mx-auto h-12 w-12 bg-yellow-600 rounded-full flex items-center justify-center mb-3">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white mb-1">Super Hotel</h3>
              <p className="text-gray-300 text-xs">Multi-hotel supervision</p>
            </div>
            <div className="bg-yellow-600 text-white py-2 px-4 rounded-lg font-medium text-sm">
              Super Hotel Portal
            </div>
          </Link>

          {/* Service Provider Portal */}
          <Link
            to="/serviceprovider/login"
            className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-6 text-center hover:bg-opacity-20 transition-all duration-300 transform hover:scale-105 border border-white border-opacity-20"
          >
            <div className="mb-4">
              <div className="mx-auto h-12 w-12 bg-green-600 rounded-full flex items-center justify-center mb-3">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0v2a2 2 0 01-2 2H10a2 2 0 01-2-2V6m8 0H8m8 0h2a2 2 0 012 2v6.445" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white mb-1">Service Provider</h3>
              <p className="text-gray-300 text-xs">Partner services</p>
            </div>
            <div className="bg-green-600 text-white py-2 px-4 rounded-lg font-medium text-sm">
              Provider Portal
            </div>
          </Link>
        </div>

        <div className="text-center mt-12">
          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-6 border border-white border-opacity-20">
            <h3 className="text-xl font-bold text-white mb-3">Guest Access</h3>
            <p className="text-gray-300 mb-4">Book services and manage your stay</p>
            <div className="space-x-4">
              <Link
                to="/login"
                className="inline-block bg-white text-gray-900 py-2 px-6 rounded-lg font-medium hover:bg-gray-100 transition-colors"
              >
                Guest Login
              </Link>
              <Link
                to="/register"
                className="inline-block bg-transparent border-2 border-white text-white py-2 px-6 rounded-lg font-medium hover:bg-white hover:text-gray-900 transition-colors"
              >
                Register
              </Link>
            </div>
          </div>
        </div>

        <div className="text-center mt-8">
          <Link
            to="/"
            className="text-gray-300 hover:text-white text-sm underline"
          >
            ← Back to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminAccessPage;
