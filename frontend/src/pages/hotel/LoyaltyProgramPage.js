/**
 * Loyalty Program Page - Coming Soon
 * Future feature for hotel guest loyalty and rewards management
 */

import React from 'react';

const LoyaltyProgramPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mb-8 animate-pulse">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-16 w-16 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
            />
          </svg>
        </div>
        <h1 className="text-6xl font-bold text-gray-800 mb-4">
          Coming Soon
        </h1>
        <p className="text-xl text-gray-600">
          Loyalty Program
        </p>
      </div>
    </div>
  );
};

export default LoyaltyProgramPage;
