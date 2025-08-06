/**
 * Sidebar Component
 * Provides navigation based on user role
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Divider,
  IconButton,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import HotelIcon from '@mui/icons-material/Hotel';
import PeopleIcon from '@mui/icons-material/People';
import CategoryIcon from '@mui/icons-material/Category';
import BookOnlineIcon from '@mui/icons-material/BookOnline';
import BarChartIcon from '@mui/icons-material/BarChart';
import PaymentIcon from '@mui/icons-material/Payment';
import SettingsIcon from '@mui/icons-material/Settings';
import PersonIcon from '@mui/icons-material/Person';
import RoomServiceIcon from '@mui/icons-material/RoomService';
import AssignmentIcon from '@mui/icons-material/Assignment';
import MoneyIcon from '@mui/icons-material/Money';
import CommuteIcon from '@mui/icons-material/Commute';
import TourIcon from '@mui/icons-material/Tour';
import LocalLaundryServiceIcon from '@mui/icons-material/LocalLaundryService';
import CloseIcon from '@mui/icons-material/Close';
import useAuth from '../../hooks/useAuth';

// Drawer width
const drawerWidth = 240;

// Navigation items by role
const getNavigationItems = (t) => ({
  super_admin: [
    { text: t('navigation.dashboard'), icon: <DashboardIcon />, path: '/superadmin/dashboard' },
    { text: t('navigation.hotels'), icon: <HotelIcon />, path: '/superadmin/hotels' },
    { text: t('navigation.hotelAdmins'), icon: <PeopleIcon />, path: '/superadmin/hotel-admins' },
    { text: t('navigation.serviceProviders'), icon: <CategoryIcon />, path: '/superadmin/service-providers' },
    { text: t('navigation.users'), icon: <PersonIcon />, path: '/superadmin/users' },
    { text: t('navigation.analytics'), icon: <BarChartIcon />, path: '/superadmin/analytics' },
    { text: t('navigation.settings'), icon: <SettingsIcon />, path: '/superadmin/settings' },
  ],
  hotel_admin: [
    { text: t('navigation.dashboard'), icon: <DashboardIcon />, path: '/hotel/dashboard' },
    { text: t('navigation.orders'), icon: <AssignmentIcon />, path: '/hotel/orders' },
    { text: t('navigation.serviceProviders'), icon: <CategoryIcon />, path: '/hotel/service-providers' },
    { text: t('navigation.revenue'), icon: <MoneyIcon />, path: '/hotel/revenue' },
    { text: t('navigation.settings'), icon: <SettingsIcon />, path: '/hotel/settings' },
  ],
  service_provider: [
    { text: t('navigation.dashboard'), icon: <DashboardIcon />, path: '/service/dashboard' },
    { text: t('navigation.services'), icon: <RoomServiceIcon />, path: '/service/services' },
    { text: t('navigation.orders'), icon: <AssignmentIcon />, path: '/service/orders' },
    { text: t('navigation.earnings'), icon: <PaymentIcon />, path: '/service/earnings' },
    { text: t('navigation.settings'), icon: <SettingsIcon />, path: '/service/settings' },
  ],
  guest: [
    { text: t('navigation.hotels'), icon: <HotelIcon />, path: '/' },
    { text: t('navigation.laundryServices'), icon: <LocalLaundryServiceIcon />, path: '/services/laundry' },
    { text: t('navigation.transportation'), icon: <CommuteIcon />, path: '/services/transportation' },
    { text: t('navigation.travelTourism'), icon: <TourIcon />, path: '/services/tourism' },
    { text: t('navigation.myBookings'), icon: <BookOnlineIcon />, path: '/bookings' },
    { text: t('navigation.profile'), icon: <PersonIcon />, path: '/profile' },
  ],
});

const Sidebar = ({ open, onClose }) => {
  const { t } = useTranslation();
  const { role } = useAuth();
  const location = useLocation();

  // Get navigation items based on user role
  const navigationItems = getNavigationItems(t);
  const items = navigationItems[role] || navigationItems.guest;// Sidebar content
  const sidebarContent = (
    <>
      <Toolbar sx={{
        minHeight: { xs: 64, sm: 64 },
        px: { xs: 3, sm: 3 },
        borderBottom: { xs: '1px solid #e0e0e0', sm: 'none' }
      }}>
        <Typography
          variant="h6"
          noWrap
          component="div"
          sx={{
            fontSize: { xs: '1.3rem', sm: '1.25rem' },
            fontWeight: 600,
            color: 'primary.main',
            flexGrow: 1
          }}
        >
          Menu
        </Typography>
        {/* Close button for mobile */}
        <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
          <IconButton
            onClick={onClose}
            sx={{
              color: 'text.secondary',
              ml: 1
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </Toolbar>
      <Divider />
      <List sx={{ px: { xs: 2, sm: 0 }, py: { xs: 2, sm: 1 } }}>
        {items.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: { xs: 1, sm: 0.5 } }}>
            <ListItemButton
              component={RouterLink}
              to={item.path}
              selected={location.pathname === item.path}
              onClick={onClose}
              sx={{
                minHeight: { xs: 56, sm: 44 },
                px: { xs: 3, sm: 2.5 },
                py: { xs: 2, sm: 1 },
                borderRadius: { xs: 2, sm: 0 },
                mx: { xs: 0, sm: 0 },
                '&.Mui-selected': {
                  backgroundColor: 'primary.light',
                  color: 'primary.contrastText',
                  '&:hover': {
                    backgroundColor: 'primary.main',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'primary.contrastText',
                  },
                },
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
              }}
            >              <ListItemIcon
                sx={{
                  minWidth: { xs: 48, sm: 56 },
                  color: location.pathname === item.path ? 'inherit' : 'action.active'
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                sx={{
                  '& .MuiListItemText-primary': {
                    fontSize: { xs: '1.1rem', sm: '1rem' },
                    fontWeight: location.pathname === item.path ? 600 : 500,
                  }
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </>
  );
  return (
    <Box
      component="nav"
      sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      aria-label="mailbox folders"
    >
      {/* Mobile Bottom Navigation */}
      <Box
        sx={{
          display: { xs: 'block', sm: 'none' },
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1200,
          backgroundColor: 'background.paper',
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <List sx={{ display: 'flex', flexDirection: 'row', p: 0 }}>
          {items.slice(0, 5).map((item) => (
            <ListItem key={item.text} disablePadding sx={{ flex: 1 }}>
              <ListItemButton
                component={RouterLink}
                to={item.path}
                selected={location.pathname === item.path}
                sx={{
                  flexDirection: 'column',
                  py: 1,
                  px: 0.5,
                  minHeight: 64,
                  '&.Mui-selected': {
                    backgroundColor: 'primary.light',
                    color: 'primary.contrastText',
                    '& .MuiListItemIcon-root': {
                      color: 'primary.contrastText',
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 'unset',
                    mb: 0.5,
                    color: location.pathname === item.path ? 'inherit' : 'action.active'
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  sx={{
                    margin: 0,
                    '& .MuiListItemText-primary': {
                      fontSize: '0.75rem',
                      textAlign: 'center',
                      lineHeight: 1.2,
                    }
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
          {items.length > 5 && (
            <ListItem disablePadding sx={{ flex: 1 }}>
              <ListItemButton
                onClick={() => onClose()}
                sx={{
                  flexDirection: 'column',
                  py: 1,
                  px: 0.5,
                  minHeight: 64,
                }}
              >
                <ListItemIcon sx={{ minWidth: 'unset', mb: 0.5 }}>
                  <SettingsIcon />
                </ListItemIcon>
                <ListItemText
                  primary="More"
                  sx={{
                    margin: 0,
                    '& .MuiListItemText-primary': {
                      fontSize: '0.75rem',
                      textAlign: 'center',
                      lineHeight: 1.2,
                    }
                  }}
                />
              </ListItemButton>
            </ListItem>
          )}
        </List>
      </Box>

      {/* Mobile drawer - for additional items if needed */}
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: '100vw',
            maxWidth: '100vw',
            height: '100vh',
          },
        }}
      >
        {sidebarContent}
      </Drawer>

      {/* Desktop drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
            padding: '8px 0',
            '& .MuiListItemButton-root': {
              padding: '12px 16px',
              minHeight: '48px',
              borderRadius: '8px',
              margin: '2px 8px',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
              },
              '&.Mui-selected': {
                backgroundColor: 'rgba(25, 118, 210, 0.12)',
                borderLeft: '4px solid #1976d2',
                '&:hover': {
                  backgroundColor: 'rgba(25, 118, 210, 0.16)',
                },
              },
            },
            '& .MuiListItemIcon-root': {
              minWidth: '40px',
              color: '#666',
            },
            '& .MuiListItemText-primary': {
              fontSize: '16px',
              fontWeight: '500',
            },
            '& .MuiToolbar-root': {
              padding: '16px 24px',
              minHeight: '56px',
            },
            '& .MuiTypography-h6': {
              fontSize: '18px',
              fontWeight: '600',
              color: '#333',
            },
          },
        }}
        open
      >
        {sidebarContent}
      </Drawer>
    </Box>
  );
};

Sidebar.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default Sidebar;
