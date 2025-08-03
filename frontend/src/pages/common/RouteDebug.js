/**
 * Debug Route Test
 * Simple component to test if routes work without auth checks
 */

import React from 'react';
import { useLocation } from 'react-router-dom';

const RouteDebug = () => {
  const location = useLocation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Route Debug</h1>
        <div className="space-y-2">
          <p><strong>Current Path:</strong> {location.pathname}</p>
          <p><strong>Search:</strong> {location.search}</p>
          <p><strong>Hash:</strong> {location.hash}</p>
          <p><strong>State:</strong> {JSON.stringify(location.state)}</p>
        </div>
        <div className="mt-6">
          <p className="text-green-600 font-medium">✅ This route is working without authentication!</p>
        </div>
        <div className="mt-4">
          <a
            href="/admin"
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Go to Admin Portal
          </a>
        </div>
      </div>
    </div>
  );
};

export default RouteDebug;
