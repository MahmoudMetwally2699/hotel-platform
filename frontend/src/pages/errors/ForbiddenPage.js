/**
 * Forbidden Page
 * Displayed when a user tries to access a restricted route
 */

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const ForbiddenPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-2 sm:px-3 lg:px-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h1 className="text-9xl font-extrabold text-red-600">403</h1>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Access Forbidden</h2>
          <p className="mt-2 text-sm text-gray-600">
            You don't have permission to access this page.
          </p>
        </div>
        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center px-5 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Go back
          </button>
          <Link
            to="/"
            className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Go to home page
          </Link>
        </div>
        <div className="mt-4 text-sm">
          <p>
            If you believe this is a mistake, please{' '}
            <a href="/contact" className="text-blue-600 hover:text-blue-500">
              contact support
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForbiddenPage;
