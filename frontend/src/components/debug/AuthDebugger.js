/**
 * Auth Debugger Component
 * Displays current authentication state for debugging purposes
 */

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import jwt_decode from 'jwt-decode';
import { selectIsAuthenticated, selectAuthRole, selectCurrentUser } from '../../redux/slices/authSlice';
import cookieHelper from '../../utils/cookieHelper';

const AuthDebugger = () => {
  const [localStorageData, setLocalStorageData] = useState({
    token: null,
    refreshToken: null,
    user: null,
    tokenDecoded: null
  });

  const isAuthenticated = useSelector(selectIsAuthenticated);
  const role = useSelector(selectAuthRole);
  const user = useSelector(selectCurrentUser);

  useEffect(() => {
    // Read from localStorage
    const token = localStorage.getItem('token');
    const refreshToken = localStorage.getItem('refreshToken');
    const userStr = localStorage.getItem('user');

    // Try to decode the token
    let decodedToken = null;
    if (token) {
      try {
        decodedToken = jwt_decode(token);
      } catch (error) {
        decodedToken = { error: 'Invalid token' };
      }
    }

    setLocalStorageData({
      token: token ? token.substring(0, 20) + '...' : null,
      refreshToken: refreshToken ? refreshToken.substring(0, 20) + '...' : null,
      user: userStr ? JSON.parse(userStr) : null,
      tokenDecoded: decodedToken
    });
  }, [isAuthenticated]); // Re-run when auth state changes

  if (process.env.NODE_ENV !== 'development') {
    return null; // Only show in development
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '10px',
        right: '10px',
        zIndex: 9999,
        padding: '10px',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        color: 'lime',
        borderRadius: '5px',
        fontSize: '12px',
        maxWidth: '400px',
        maxHeight: '300px',
        overflowY: 'auto',
      }}
    >
      <h4 style={{ margin: '0 0 5px', color: 'white' }}>Auth Debug</h4>      <div>
        <strong>Redux State:</strong>
        <ul style={{ margin: '5px 0', paddingLeft: '15px' }}>
          <li>Authenticated: {isAuthenticated ? 'true' : 'false'}</li>
          <li>Role: {role || 'none'}</li>
          <li>User ID: {user?._id || 'none'}</li>
        </ul>
      </div>
      <div>
        <strong>LocalStorage:</strong>
        <ul style={{ margin: '5px 0', paddingLeft: '15px' }}>
          <li>Token: {localStorageData.token || 'none'}</li>
          <li>RefreshToken: {localStorageData.refreshToken || 'none'}</li>
          <li>User Role: {localStorageData.user?.role || 'none'}</li>
        </ul>
      </div>
      <div>
        <strong>Decoded Token:</strong>
        <ul style={{ margin: '5px 0', paddingLeft: '15px' }}>
          <li>ID: {localStorageData.tokenDecoded?.id || 'none'}</li>
          <li>Role: {localStorageData.tokenDecoded?.role || 'none'}</li>
          <li>Exp: {localStorageData.tokenDecoded?.exp ? new Date(localStorageData.tokenDecoded.exp * 1000).toLocaleString() : 'none'}</li>
        </ul>
      </div>
      <button
        onClick={() => {
          localStorage.clear();
          window.location.reload();
        }}
        style={{
          backgroundColor: 'red',
          color: 'white',
          border: 'none',
          padding: '3px 8px',
          borderRadius: '3px',
          cursor: 'pointer',
          marginTop: '5px',
          fontSize: '11px',
        }}
      >
        Clear & Reload
      </button>
    </div>
  );
};

export default AuthDebugger;
