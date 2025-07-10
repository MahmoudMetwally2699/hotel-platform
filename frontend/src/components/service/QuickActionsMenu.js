/**
 * Quick Actions Menu Component for Service Provider Dashboard
 */

import React from 'react';
import { Link } from 'react-router-dom';

const QuickActionsMenu = () => {
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:px-6 bg-gray-50">
        <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
      </div>
      <div className="px-4 py-5 sm:p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            to="/service/services/create"
            className="bg-blue-50 hover:bg-blue-100 p-4 rounded-lg flex flex-col items-center text-center transition-colors duration-200"
          >
            <div className="bg-blue-100 p-3 rounded-full">
              <svg className="h-6 w-6 text-blue-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <span className="mt-2 text-sm font-medium text-gray-900">Add New Service</span>
          </Link>

          <Link
            to="/service/orders"
            className="bg-green-50 hover:bg-green-100 p-4 rounded-lg flex flex-col items-center text-center transition-colors duration-200"
          >
            <div className="bg-green-100 p-3 rounded-full">
              <svg className="h-6 w-6 text-green-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <span className="mt-2 text-sm font-medium text-gray-900">Manage Orders</span>
          </Link>

          <Link
            to="/service/earnings"
            className="bg-yellow-50 hover:bg-yellow-100 p-4 rounded-lg flex flex-col items-center text-center transition-colors duration-200"
          >
            <div className="bg-yellow-100 p-3 rounded-full">
              <svg className="h-6 w-6 text-yellow-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="mt-2 text-sm font-medium text-gray-900">View Earnings</span>
          </Link>

          <Link
            to="/service/settings"
            className="bg-purple-50 hover:bg-purple-100 p-4 rounded-lg flex flex-col items-center text-center transition-colors duration-200"
          >
            <div className="bg-purple-100 p-3 rounded-full">
              <svg className="h-6 w-6 text-purple-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <span className="mt-2 text-sm font-medium text-gray-900">Settings</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default QuickActionsMenu;
