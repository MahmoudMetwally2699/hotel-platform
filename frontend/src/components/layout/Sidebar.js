/**
 * Sidebar Component
 * Provides navigation based on user role
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Link as RouterLink, useLocation } from 'react-router-dom';
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
import useAuth from '../../hooks/useAuth';

// Drawer width
const drawerWidth = 240;

// Navigation items by role
const navigationItems = {
  super_admin: [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/superadmin/dashboard' },
    { text: 'Hotels', icon: <HotelIcon />, path: '/superadmin/hotels' },
    { text: 'Hotel Admins', icon: <PeopleIcon />, path: '/superadmin/hotel-admins' },
    { text: 'Service Providers', icon: <CategoryIcon />, path: '/superadmin/service-providers' },
    { text: 'Users', icon: <PersonIcon />, path: '/superadmin/users' },
    { text: 'Analytics', icon: <BarChartIcon />, path: '/superadmin/analytics' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/superadmin/settings' },
  ],
  hotel_admin: [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/hotel/dashboard' },
    { text: 'Service Providers', icon: <CategoryIcon />, path: '/hotel/service-providers' },
    { text: 'Services', icon: <RoomServiceIcon />, path: '/hotel/services' },
    { text: 'Bookings', icon: <BookOnlineIcon />, path: '/hotel/bookings' },
    { text: 'Guests', icon: <PeopleIcon />, path: '/hotel/guests' },
    { text: 'Revenue', icon: <MoneyIcon />, path: '/hotel/revenue' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/hotel/settings' },
  ],
  service_provider: [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/service/dashboard' },
    { text: 'Services', icon: <RoomServiceIcon />, path: '/service/services' },
    { text: 'Orders', icon: <AssignmentIcon />, path: '/service/orders' },
    { text: 'Earnings', icon: <PaymentIcon />, path: '/service/earnings' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/service/settings' },
  ],
  guest: [
    { text: 'Hotels', icon: <HotelIcon />, path: '/' },
    { text: 'Laundry Services', icon: <LocalLaundryServiceIcon />, path: '/services/laundry' },
    { text: 'Transportation', icon: <CommuteIcon />, path: '/services/transportation' },
    { text: 'Travel & Tourism', icon: <TourIcon />, path: '/services/tourism' },
    { text: 'My Bookings', icon: <BookOnlineIcon />, path: '/bookings' },
    { text: 'Profile', icon: <PersonIcon />, path: '/profile' },
  ],
};

const Sidebar = ({ open, onClose }) => {
  const { role } = useAuth();
  const location = useLocation();

  // Get navigation items based on user role
  const items = navigationItems[role] || navigationItems.guest;

  // Sidebar content
  const sidebarContent = (
    <>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Menu
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {items.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              component={RouterLink}
              to={item.path}
              selected={location.pathname === item.path}
              onClick={onClose}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
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
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
      >
        {sidebarContent}
      </Drawer>

      {/* Desktop drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
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
