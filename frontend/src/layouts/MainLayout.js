/**
 * Main Layout Component
 * This is the main layout wrapper for authenticated pages
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Box, CssBaseline } from '@mui/material';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';

const MainLayout = ({ children }) => {
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);

  const handleDrawerToggle = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />

      {/* Header component */}
      <Header onDrawerToggle={handleDrawerToggle} />

      {/* Sidebar component */}
      <Sidebar
        open={isMobileOpen}
        onClose={handleDrawerToggle}
      />

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: 8,
          width: { sm: `calc(100% - 240px)` },
          ml: { sm: '240px' },
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

MainLayout.propTypes = {
  children: PropTypes.node.isRequired,
};

export default MainLayout;
