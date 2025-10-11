/**
 * Protected Route Component
 * Handles route protection based on authentication and roles
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import useAuth from '../../hooks/useAuth';

const ProtectedRoute = ({ children, allowedRoles, redirectPath = '/login' }) => {
  const { isAuthenticated, role, checkToken } = useAuth();
  const location = useLocation();

  // Additional token validation
  const tokenData = checkToken();
  const isTokenValid = !!tokenData;

  // If not authenticated or token is invalid, redirect to login
  if (!isAuthenticated || !isTokenValid) {
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  // If roles are specified, check if user has required role
  if (allowedRoles) {
    // Convert both to strings and trim any whitespace
    const userRole = String(role || '').trim();
    const allowedRolesArray = Array.isArray(allowedRoles)
      ? allowedRoles.map(r => String(r).trim())
      : [String(allowedRoles).trim()];

    const hasRequiredRole = allowedRolesArray.includes(userRole);

    if (!hasRequiredRole) {
      // User doesn't have required role, redirect to forbidden
      return <Navigate to="/forbidden" state={{ from: location }} replace />;
    }
  }

  // User is authenticated and has required role, render the children
  return children;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  allowedRoles: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string),
  ]),
  redirectPath: PropTypes.string,
};

export default ProtectedRoute;
