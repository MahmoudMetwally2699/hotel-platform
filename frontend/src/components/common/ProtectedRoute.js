/**
 * Protected Route Component
 * Handles route protection based on authentication and roles
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import useAuth from '../../hooks/useAuth';

const ProtectedRoute = ({ children, allowedRoles, redirectPath = '/login' }) => {
  const { isAuthenticated, role } = useAuth();
  const location = useLocation();

  console.log('🛡️ ProtectedRoute Check:', {
    path: location.pathname,
    isAuthenticated,
    userRole: role,
    allowedRoles,
    roleType: typeof role,
    allowedRolesType: typeof allowedRoles
  });

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    console.log('❌ Not authenticated, redirecting to login');
    alert(`🚨 PROTECTED ROUTE REDIRECT!\n\nREASON: Not authenticated\nPath: ${location.pathname}\nAuthenticated: ${isAuthenticated}\nRole: ${role}\nRedirecting to: ${redirectPath}`);
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  // If roles are specified, check if user has required role
  if (allowedRoles) {
    // Convert both to strings and trim any whitespace
    const userRole = String(role || '').trim();
    const allowedRolesArray = Array.isArray(allowedRoles)
      ? allowedRoles.map(r => String(r).trim())
      : [String(allowedRoles).trim()];

    console.log('🔍 Role check details:', {
      userRole,
      allowedRolesArray,
      userRoleLength: userRole.length,
      allowedRolesLength: allowedRolesArray.map(r => r.length)
    });

    const hasRequiredRole = allowedRolesArray.includes(userRole);

    console.log('🔍 Role check result:', {
      hasRequiredRole,
      comparison: allowedRolesArray.map(r => ({ role: r, matches: r === userRole }))
    });

    if (!hasRequiredRole) {
      console.log('❌ Access denied - Role mismatch');
      alert(`🚨 PROTECTED ROUTE REDIRECT!\n\nREASON: Role mismatch\nPath: ${location.pathname}\nUser Role: "${userRole}"\nAllowed Roles: [${allowedRolesArray.join(', ')}]\nAuthenticated: ${isAuthenticated}\nRedirecting to: /forbidden`);
      // User doesn't have required role, redirect to forbidden
      return <Navigate to="/forbidden" state={{ from: location }} replace />;
    } else {
      console.log('✅ Access granted - Role matches');
    }
  } else {
    console.log('✅ Access granted - No role restriction');
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
