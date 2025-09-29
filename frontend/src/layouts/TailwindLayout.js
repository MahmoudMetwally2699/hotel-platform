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
    <div className="flex h-screen bg-background-default">      {/* Sidebar */}
      <TailwindSidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />{/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <TailwindHeader onOpenSidebar={toggleSidebar} />        {/* Main Content Scrollable Area */}
        <main className="flex-1 overflow-y-auto p-6 pt-4 md:ml-0 pb-20 lg:pb-6">
          <div className="w-full">
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
