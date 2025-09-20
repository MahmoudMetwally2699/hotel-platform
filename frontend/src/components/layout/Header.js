/**
 * Header Component
 * Top navigation bar with user profile menu and notifications
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {  AppBar,
  Avatar,
  Box,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import useAuth from '../../hooks/useAuth';

const Header = ({ onDrawerToggle }) => {
  const { t } = useTranslation();
  const { currentUser, role, logout } = useAuth();

  // Profile menu state
  const [anchorElUser, setAnchorElUser] = useState(null);

  // Handle profile menu open
  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  // Handle profile menu close
  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  // Get dashboard route based on user role
  const getDashboardRoute = () => {
    switch (role) {
      case 'super_admin':
        return '/superadmin/dashboard';
      case 'hotel_admin':
        return '/hotel/dashboard';
      case 'service_provider':
        return '/service/dashboard';
      default:
        return '/';
    }
  };

  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={onDrawerToggle}
          sx={{ mr: 2, display: { sm: 'none' } }}
        >
          <MenuIcon />
        </IconButton>

        <Typography
          variant="h6"
          noWrap
          component={RouterLink}
          to={getDashboardRoute()}
          sx={{
            mr: 2,
            display: { xs: 'none', md: 'flex' },
            fontWeight: 700,
            color: 'inherit',
            textDecoration: 'none',
          }}
        >
          {t('platform.hotelPlatform')}
        </Typography>

        <Box sx={{ flexGrow: 1 }} />

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Divider orientation="vertical" flexItem sx={{ mx: 1, bgcolor: 'background.paper', opacity: 0.5 }} />

          {/* User menu */}
          <Box sx={{ ml: 1 }}>
            <Tooltip title="Account settings">
              <IconButton onClick={handleOpenUserMenu}>
                {currentUser?.profileImage ? (
                  <Avatar
                    alt={currentUser.name}
                    src={currentUser.profileImage}
                    sx={{ width: 32, height: 32 }}
                  />
                ) : (
                  <Avatar sx={{ width: 32, height: 32 }}>
                    <AccountCircleIcon />
                  </Avatar>
                )}
              </IconButton>
            </Tooltip>

            <Menu
              sx={{ mt: '45px' }}
              id="menu-appbar"
              anchorEl={anchorElUser}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
            >
              <Box sx={{ px: 2, py: 1 }}>
                <Typography variant="subtitle1" noWrap>
                  {currentUser?.name || 'User'}
                </Typography>
                <Typography variant="body2" color="textSecondary" noWrap>
                  {currentUser?.email || ''}
                </Typography>
              </Box>

              <Divider />

              <MenuItem
                component={RouterLink}
                to="/profile"
                onClick={handleCloseUserMenu}
              >
                Profile
              </MenuItem>

              {role === 'superadmin' && (
                <MenuItem
                  component={RouterLink}
                  to="/superadmin/settings"
                  onClick={handleCloseUserMenu}
                >
                  Settings
                </MenuItem>
              )}

              {role === 'hotel' && (
                <MenuItem
                  component={RouterLink}
                  to="/hotel/settings"
                  onClick={handleCloseUserMenu}
                >
                  Hotel Settings
                </MenuItem>
              )}

              {role === 'service' && (
                <MenuItem
                  component={RouterLink}
                  to="/service/settings"
                  onClick={handleCloseUserMenu}
                >
                  Service Settings
                </MenuItem>
              )}

              <Divider />

              <MenuItem onClick={logout}>
                <Typography textAlign="center">Logout</Typography>
              </MenuItem>
            </Menu>
          </Box>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

Header.propTypes = {
  onDrawerToggle: PropTypes.func.isRequired,
};

export default Header;
