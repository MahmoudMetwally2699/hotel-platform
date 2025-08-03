/**
 * Auth State Tester Component
 * Debug component to check authentication state inconsistencies
 */

import React from 'react';
import { useSelector } from 'react-redux';
import jwt_decode from 'jwt-decode';
import { selectIsAuthenticated, selectAuthRole, selectCurrentUser } from '../../redux/slices/authSlice';
import { getRoleFromToken } from '../../utils/tokenHelper';
import { getRoleFromCookieToken } from '../../utils/cookieHelper';

const AuthStateTester = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const role = useSelector(selectAuthRole);
  const user = useSelector(selectCurrentUser);

  // Get role from various sources
  const tokenRole = getRoleFromToken();
  const cookieTokenRole = getRoleFromCookieToken();

  // Get token from localStorage and cookie
  const localToken = localStorage.getItem('token');
  const cookieToken = document.cookie.split(';').find(cookie => cookie.trim().startsWith('jwt='));

  let localTokenDecoded = null;
  let cookieTokenDecoded = null;

  if (localToken) {
    try {
      localTokenDecoded = jwt_decode(localToken);
    } catch (e) {
      localTokenDecoded = { error: e.message };
    }
  }

  if (cookieToken) {
    try {
      const token = cookieToken.split('=')[1];
      cookieTokenDecoded = jwt_decode(token);
    } catch (e) {
      cookieTokenDecoded = { error: e.message };
    }
  }

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '400px',
      maxHeight: '500px',
      overflow: 'auto'
    }}>
      <h3>🐛 Auth State Debug</h3>

      <div><strong>Redux State:</strong></div>
      <div>isAuthenticated: {String(isAuthenticated)}</div>
      <div>role: "{role}"</div>
      <div>user: {user ? JSON.stringify(user, null, 2) : 'null'}</div>

      <div style={{ marginTop: '10px' }}><strong>Token Roles:</strong></div>
      <div>tokenRole: "{tokenRole}"</div>
      <div>cookieTokenRole: "{cookieTokenRole}"</div>

      <div style={{ marginTop: '10px' }}><strong>Local Token:</strong></div>
      <div>{localToken ? 'EXISTS' : 'MISSING'}</div>
      {localTokenDecoded && (
        <div style={{ fontSize: '10px' }}>
          Decoded: {JSON.stringify(localTokenDecoded, null, 2)}
        </div>
      )}

      <div style={{ marginTop: '10px' }}><strong>Cookie Token:</strong></div>
      <div>{cookieToken ? 'EXISTS' : 'MISSING'}</div>
      {cookieTokenDecoded && (
        <div style={{ fontSize: '10px' }}>
          Decoded: {JSON.stringify(cookieTokenDecoded, null, 2)}
        </div>
      )}
    </div>
  );
};

export default AuthStateTester;
