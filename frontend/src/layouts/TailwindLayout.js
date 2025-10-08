/**
 * Main Tailwind Layout Component
 * This is the main layout wrapper for authenticated pages using Tailwind CSS
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import TailwindHeader from './TailwindHeader';
import TailwindSidebar from './TailwindSidebar';

const TailwindLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="grid h-screen bg-background-default overflow-hidden" style={{ gridTemplateColumns: 'auto 1fr' }}>
      {/* Sidebar */}
      <div className="overflow-hidden">
        <TailwindSidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      </div>

      {/* Main Content */}
      <div className="flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <TailwindHeader onOpenSidebar={toggleSidebar} />

        {/* Main Content Scrollable Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 pt-4 pb-20 lg:pb-6">
          <div className="w-full max-w-none">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

TailwindLayout.propTypes = {
  children: PropTypes.node.isRequired
};

export default TailwindLayout;
