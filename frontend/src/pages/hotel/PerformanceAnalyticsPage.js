/**
 * Performance Analytics Page - Coming Soon
 * Future feature for advanced hotel performance metrics and insights
 */

import React from 'react';

const PerformanceAnalyticsPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-8 animate-pulse">
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
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        </div>
        <h1 className="text-6xl font-bold text-gray-800 mb-4">
          Coming Soon
        </h1>
        <p className="text-xl text-gray-600">
          Performance Analytics
        </p>
      </div>
    </div>
  );
};

export default PerformanceAnalyticsPage;
