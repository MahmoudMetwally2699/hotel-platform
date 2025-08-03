/**
 * Protected Route Component
 * Handles route protection based on authentication and roles
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import useAuth from '../../hooks/useAuth';
import { tokenHasRole, getRoleFromToken } from '../../utils/tokenHelper';

const ProtectedRoute = ({ children, allowedRoles, redirectPath = '/login' }) => {
  const { isAuthenticated, hasRole, role } = useAuth();
  const location = useLocation();  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  // If roles are specified, check if user has required role
  if (allowedRoles) {
    // First try using Redux state role
    const userRole = role;
    let hasRequiredRole = Array.isArray(allowedRoles)
      ? allowedRoles.includes(userRole)
      : userRole === allowedRoles;

    // Fallback to checking the token directly if Redux state fails
    if (!hasRequiredRole) {
      const tokenRole = getRoleFromToken();      hasRequiredRole = Array.isArray(allowedRoles)
        ? allowedRoles.includes(tokenRole)
        : tokenRole === allowedRoles;
    }

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
