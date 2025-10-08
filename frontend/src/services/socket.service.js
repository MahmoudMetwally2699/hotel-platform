/**
 * Socket Service
 * Handles real-time updates using Socket.IO
 */

import { io } from 'socket.io-client';
import { SOCKET_EVENTS } from '../config/api.config';
import { addNotification } from '../redux/slices/notificationSlice';
import { fetchBookings } from '../redux/slices/bookingSlice';
import cookieHelper from '../utils/cookieHelper';

let socket = null;
let dispatch = null;

class SocketService {
  /**
   * Initialize socket connection and set up event listeners
   * @param {Function} reduxDispatch - Redux dispatch function
   * @param {string} token - JWT token
   * @param {string} role - User role
   */  init(reduxDispatch, token, role) {
    dispatch = reduxDispatch;

    // Get Socket.IO server URL from environment or use default
    const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

    // If token is not provided, try to get it from cookies
    if (!token) {
      token = cookieHelper.getAuthToken();
    }

    // Connect to Socket.IO server with auth token
    socket = io(SOCKET_URL, {
      auth: {
        token: token
      },
      withCredentials: true // This enables sending cookies with cross-origin requests
    });

    // Connection event listeners
    socket.on('connect', this.handleConnect);
    socket.on('disconnect', this.handleDisconnect);
    socket.on('connect_error', this.handleConnectError);

    // Business event listeners
    socket.on(SOCKET_EVENTS.BOOKING_CREATED, this.handleBookingCreated);
    socket.on(SOCKET_EVENTS.BOOKING_UPDATED, this.handleBookingUpdated);
    socket.on(SOCKET_EVENTS.BOOKING_CANCELLED, this.handleBookingCancelled);
    socket.on(SOCKET_EVENTS.PAYMENT_RECEIVED, this.handlePaymentReceived);
    socket.on(SOCKET_EVENTS.SERVICE_APPROVED, this.handleServiceApproved);
    socket.on(SOCKET_EVENTS.SERVICE_REJECTED, this.handleServiceRejected);
    socket.on(SOCKET_EVENTS.NOTIFICATION, this.handleNotification);

    // Set up room based on role
    if (role === 'hotel') {
      socket.emit('join:hotel_admin');
    } else if (role === 'service') {
      socket.emit('join:service_provider');
    } else if (role === 'superadmin') {
      socket.emit('join:super_admin');
    }
  }

  /**
   * Disconnect socket
   */
  disconnect() {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  }

  /**
   * Handle socket connect event
   */
  handleConnect = () => {
  // ...existing code...
  };

  /**
   * Handle socket disconnect event
   */
  handleDisconnect = (reason) => {
  // ...existing code...
  };

  /**
   * Handle socket connection error
   */
  handleConnectError = (error) => {
  // ...existing code...
  };

  /**
   * Handle booking created event
   * @param {Object} data - Booking data
   */
  handleBookingCreated = (data) => {
    if (dispatch) {
      // Add notification
      dispatch(addNotification({
        _id: Date.now().toString(),
        title: 'New Booking',
        message: `New booking created for ${data.serviceName}`,
        read: false,
        createdAt: new Date().toISOString(),
        type: 'booking',
        data: data
      }));

      // Refresh bookings list
      dispatch(fetchBookings());
    }
  };

  /**
   * Handle booking updated event
   * @param {Object} data - Booking data
   */
  handleBookingUpdated = (data) => {
    if (dispatch) {
      // Add notification
      dispatch(addNotification({
        _id: Date.now().toString(),
        title: 'Booking Updated',
        message: `Booking #${data.bookingId} status updated to ${data.status}`,
        read: false,
        createdAt: new Date().toISOString(),
        type: 'booking',
        data: data
      }));

      // Refresh bookings list
      dispatch(fetchBookings());
    }
  };

  /**
   * Handle booking cancelled event
   * @param {Object} data - Booking data
   */
  handleBookingCancelled = (data) => {
    if (dispatch) {
      // Add notification
      dispatch(addNotification({
        _id: Date.now().toString(),
        title: 'Booking Cancelled',
        message: `Booking #${data.bookingId} has been cancelled`,
        read: false,
        createdAt: new Date().toISOString(),
        type: 'booking',
        data: data
      }));

      // Refresh bookings list
      dispatch(fetchBookings());
    }
  };

  /**
   * Handle payment received event
   * @param {Object} data - Payment data
   */
  handlePaymentReceived = (data) => {
    if (dispatch) {
      // Add notification
      dispatch(addNotification({
        _id: Date.now().toString(),
        title: 'Payment Received',
        message: `Payment of ${data.amount} received for booking #${data.bookingId}`,
        read: false,
        createdAt: new Date().toISOString(),
        type: 'payment',
        data: data
      }));
    }
  };

  /**
   * Handle service approved event
   * @param {Object} data - Service data
   */
  handleServiceApproved = (data) => {
    if (dispatch) {
      // Add notification
      dispatch(addNotification({
        _id: Date.now().toString(),
        title: 'Service Approved',
        message: `Your service ${data.serviceName} has been approved`,
        read: false,
        createdAt: new Date().toISOString(),
        type: 'service',
        data: data
      }));
    }
  };

  /**
   * Handle service rejected event
   * @param {Object} data - Service data
   */
  handleServiceRejected = (data) => {
    if (dispatch) {
      // Add notification
      dispatch(addNotification({
        _id: Date.now().toString(),
        title: 'Service Rejected',
        message: `Your service ${data.serviceName} has been rejected: ${data.reason}`,
        read: false,
        createdAt: new Date().toISOString(),
        type: 'service',
        data: data
      }));
    }
  };

  /**
   * Handle generic notification event
   * @param {Object} data - Notification data
   */
  handleNotification = (data) => {
    if (dispatch) {
      dispatch(addNotification({
        _id: Date.now().toString(),
        title: data.title,
        message: data.message,
        read: false,
        createdAt: new Date().toISOString(),
        type: data.type,
        data: data.data
      }));
    }
  };
}

const socketService = new SocketService();
export default socketService;
