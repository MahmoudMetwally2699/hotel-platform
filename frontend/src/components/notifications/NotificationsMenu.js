/**
 * Notifications Menu Component
 * Displays a list of notifications in a dropdown menu
 */

import React from 'react';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Popover,
  Typography,
} from '@mui/material';
import BookingIcon from '@mui/icons-material/Book';
import PaymentIcon from '@mui/icons-material/Payment';
import InventoryIcon from '@mui/icons-material/Inventory';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { formatDistanceToNow } from 'date-fns';
import { markAllNotificationsAsRead, markNotificationAsRead } from '../../redux/slices/notificationSlice';

const NotificationsMenu = ({ open, anchorEl, onClose, notifications }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Handle notification click
  const handleNotificationClick = (notification) => {
    // Mark notification as read
    dispatch(markNotificationAsRead(notification._id));

    // Navigate to relevant page based on notification type
    switch (notification.type) {
      case 'booking':
        navigate(`/bookings/${notification.data?.bookingId}`);
        break;
      case 'payment':
        navigate(`/payments/${notification.data?.paymentId}`);
        break;
      case 'service':
        navigate(`/services/${notification.data?.serviceId}`);
        break;
      default:
        break;
    }

    // Close the menu
    onClose();
  };

  // Handle "Mark all as read" button click
  const handleMarkAllAsRead = () => {
    dispatch(markAllNotificationsAsRead());
  };

  // Render notification icon based on type
  const renderNotificationIcon = (type) => {
    switch (type) {
      case 'booking':
        return <BookingIcon color="primary" />;
      case 'payment':
        return <PaymentIcon color="success" />;
      case 'service':
        return <InventoryIcon color="info" />;
      default:
        return <NotificationsIcon />;
    }
  };

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
    >
      <Box sx={{ width: 320 }}>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Notifications</Typography>
          <Button
            size="small"
            onClick={handleMarkAllAsRead}
          >
            Mark all as read
          </Button>
        </Box>

        <Divider />

        {notifications && notifications.length > 0 ? (
          <List sx={{ maxHeight: 400, overflow: 'auto' }}>
            {notifications.map((notification) => (
              <React.Fragment key={notification._id}>
                <ListItem disablePadding>
                  <ListItemButton
                    onClick={() => handleNotificationClick(notification)}
                    sx={{
                      backgroundColor: notification.read ? 'transparent' : 'action.hover',
                    }}
                  >
                    <ListItemAvatar>
                      {renderNotificationIcon(notification.type)}
                    </ListItemAvatar>
                    <ListItemText
                      primary={notification.title}
                      secondary={
                        <>
                          <Typography
                            component="span"
                            variant="body2"
                            color="textPrimary"
                            sx={{ display: 'block' }}
                          >
                            {notification.message}
                          </Typography>
                          <Typography
                            component="span"
                            variant="caption"
                            color="textSecondary"
                          >
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                          </Typography>
                        </>
                      }
                    />
                  </ListItemButton>
                </ListItem>
                <Divider variant="inset" component="li" />
              </React.Fragment>
            ))}
          </List>
        ) : (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="textSecondary">No notifications</Typography>
          </Box>
        )}
      </Box>
    </Popover>
  );
};

NotificationsMenu.propTypes = {
  open: PropTypes.bool.isRequired,
  anchorEl: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  notifications: PropTypes.array,
};

NotificationsMenu.defaultProps = {
  notifications: [],
};

export default NotificationsMenu;
