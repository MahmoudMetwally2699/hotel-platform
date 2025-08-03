/**
 * Home Page - Simplified
 * Main landing page focused on My Hotel Services
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from '../../redux/slices/authSlice';

const HomePage = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-blue-700 text-white">
        <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:py-24 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              Hotel Services Platform
            </h1>
            <p className="mt-6 text-xl max-w-3xl mx-auto">
              Access all the services available at your hotel with ease.
            </p>            {/* Main Action - My Hotel Services */}
            {isAuthenticated ? (
              <div className="mt-10">
                <Link
                  to="/my-hotel-services"
                  className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-lg font-medium rounded-md text-blue-700 bg-white hover:bg-gray-100 transition duration-200 shadow-lg"
                >
                  <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  View My Hotel Services
                </Link>
                <p className="mt-4 text-blue-100">
                  Browse and book services available at your hotel
                </p>
              </div>
            ) : (
              <div className="mt-10">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-lg font-medium rounded-md text-blue-700 bg-white hover:bg-gray-100 transition duration-200 shadow-lg"
                >
                  Login to Access Services
                </Link>
                <p className="mt-4 text-blue-100">
                  Sign in to view services available at your hotel
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Services Overview Section */}
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:py-20 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Available Service Categories
          </h2>
          <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
            Your hotel offers various services to make your stay comfortable
          </p>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-3 max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="text-4xl mb-4">🧺</div>
            <h3 className="text-xl font-semibold text-gray-900">Laundry Services</h3>
            <p className="mt-2 text-gray-600">Professional laundry and dry cleaning</p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="text-4xl mb-4">🚗</div>
            <h3 className="text-xl font-semibold text-gray-900">Transportation</h3>
            <p className="mt-2 text-gray-600">Car rentals and taxi services</p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="text-4xl mb-4">🗺️</div>
            <h3 className="text-xl font-semibold text-gray-900">Travel & Tourism</h3>
            <p className="mt-2 text-gray-600">Tours and local experiences</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:py-12 lg:px-8">
          <div className="text-center">
            <p className="text-base text-gray-400">
              &copy; 2025 Hotel Service Platform. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
