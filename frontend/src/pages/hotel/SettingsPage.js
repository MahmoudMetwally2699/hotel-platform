import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchHotelById, updateHotelProfile, selectCurrentHotel, selectHotelLoading } from '../../redux/slices/hotelSlice';
import useAuth from '../../hooks/useAuth';

/**
 * Hotel Admin Settings Page
 * @returns {JSX.Element} Settings page
 */
const SettingsPage = () => {
  const dispatch = useDispatch();
  const hotel = useSelector(selectCurrentHotel);
  const isLoading = useSelector(selectHotelLoading);
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    },
    contactEmail: '',
    contactPhone: '',
    website: '',
    defaultMarkupPercentage: 0,
    defaultCurrency: 'USD',
    checkInTime: '14:00',
    checkOutTime: '12:00',
    acceptsBookingsCutoff: 2, // hours before service
    cancellationPolicy: ''
  });
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (user?.hotelId) {
      dispatch(fetchHotelById(user.hotelId));
    }
  }, [dispatch, user]);

  useEffect(() => {
    if (hotel) {
      setFormData({
        name: hotel.name || '',
        description: hotel.description || '',
        address: {
          street: hotel.address?.street || '',
          city: hotel.address?.city || '',
          state: hotel.address?.state || '',
          zipCode: hotel.address?.zipCode || '',
          country: hotel.address?.country || ''
        },
        contactEmail: hotel.contactEmail || '',
        contactPhone: hotel.contactPhone || '',
        website: hotel.website || '',
        defaultMarkupPercentage: hotel.defaultMarkupPercentage || 0,
        defaultCurrency: hotel.defaultCurrency || 'USD',
        checkInTime: hotel.checkInTime || '14:00',
        checkOutTime: hotel.checkOutTime || '12:00',
        acceptsBookingsCutoff: hotel.acceptsBookingsCutoff || 2,
        cancellationPolicy: hotel.cancellationPolicy || ''
      });
    }
  }, [hotel]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSuccessMessage('');
      setErrorMessage('');

      if (user?.hotelId) {
        await dispatch(updateHotelProfile({
          hotelId: user.hotelId,
          hotelData: formData
        })).unwrap();

        setSuccessMessage('Hotel settings updated successfully!');

        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      }
    } catch (error) {
      setErrorMessage(error.message || 'Failed to update hotel settings');

      // Clear error message after 3 seconds
      setTimeout(() => {
        setErrorMessage('');
      }, 3000);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Hotel Settings</h1>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'profile'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Hotel Profile
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'services'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Service Settings
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'notifications'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Notifications
          </button>
        </nav>
      </div>

      {/* Success and Error Messages */}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-md">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
          {errorMessage}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {/* Hotel Profile Form */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSubmit}>
              <div className="bg-white p-6 rounded-lg shadow border border-gray-200 mb-6">
                <h2 className="text-lg font-medium mb-4">Basic Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Hotel Name</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                    <input
                      type="url"
                      id="website"
                      name="website"
                      value={formData.website}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows="3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow border border-gray-200 mb-6">
                <h2 className="text-lg font-medium mb-4">Contact Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                    <input
                      type="email"
                      id="contactEmail"
                      name="contactEmail"
                      value={formData.contactEmail}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
                    <input
                      type="tel"
                      id="contactPhone"
                      name="contactPhone"
                      value={formData.contactPhone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow border border-gray-200 mb-6">
                <h2 className="text-lg font-medium mb-4">Address</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label htmlFor="address.street" className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                    <input
                      type="text"
                      id="address.street"
                      name="address.street"
                      value={formData.address.street}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="address.city" className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input
                      type="text"
                      id="address.city"
                      name="address.city"
                      value={formData.address.city}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="address.state" className="block text-sm font-medium text-gray-700 mb-1">State/Province</label>
                    <input
                      type="text"
                      id="address.state"
                      name="address.state"
                      value={formData.address.state}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="address.zipCode" className="block text-sm font-medium text-gray-700 mb-1">ZIP/Postal Code</label>
                    <input
                      type="text"
                      id="address.zipCode"
                      name="address.zipCode"
                      value={formData.address.zipCode}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="address.country" className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                    <input
                      type="text"
                      id="address.country"
                      name="address.country"
                      value={formData.address.country}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}

          {/* Service Settings Form */}
          {activeTab === 'services' && (
            <form onSubmit={handleSubmit}>
              <div className="bg-white p-6 rounded-lg shadow border border-gray-200 mb-6">
                <h2 className="text-lg font-medium mb-4">Service Settings</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="defaultMarkupPercentage" className="block text-sm font-medium text-gray-700 mb-1">Default Markup Percentage</label>
                    <div className="relative mt-1 rounded-md shadow-sm">
                      <input
                        type="number"
                        id="defaultMarkupPercentage"
                        name="defaultMarkupPercentage"
                        value={formData.defaultMarkupPercentage}
                        onChange={handleInputChange}
                        min="0"
                        max="100"
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">%</span>
                      </div>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">Default markup applied to all services. Can be overridden per service.</p>
                  </div>

                  <div>
                    <label htmlFor="defaultCurrency" className="block text-sm font-medium text-gray-700 mb-1">Default Currency</label>
                    <select
                      id="defaultCurrency"
                      name="defaultCurrency"
                      value={formData.defaultCurrency}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="GBP">GBP - British Pound</option>
                      <option value="JPY">JPY - Japanese Yen</option>
                      <option value="AUD">AUD - Australian Dollar</option>
                      <option value="CAD">CAD - Canadian Dollar</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="acceptsBookingsCutoff" className="block text-sm font-medium text-gray-700 mb-1">Booking Cutoff Time (hours)</label>
                    <input
                      type="number"
                      id="acceptsBookingsCutoff"
                      name="acceptsBookingsCutoff"
                      value={formData.acceptsBookingsCutoff}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="mt-1 text-sm text-gray-500">Minimum hours before service time that bookings are allowed.</p>
                  </div>

                  <div>
                    <label htmlFor="checkInTime" className="block text-sm font-medium text-gray-700 mb-1">Check-in Time</label>
                    <input
                      type="time"
                      id="checkInTime"
                      name="checkInTime"
                      value={formData.checkInTime}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="checkOutTime" className="block text-sm font-medium text-gray-700 mb-1">Check-out Time</label>
                    <input
                      type="time"
                      id="checkOutTime"
                      name="checkOutTime"
                      value={formData.checkOutTime}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="cancellationPolicy" className="block text-sm font-medium text-gray-700 mb-1">Cancellation Policy</label>
                    <textarea
                      id="cancellationPolicy"
                      name="cancellationPolicy"
                      value={formData.cancellationPolicy}
                      onChange={handleInputChange}
                      rows="4"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Describe your cancellation policy..."
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}

          {/* Notifications Settings */}
          {activeTab === 'notifications' && (
            <div className="bg-white p-6 rounded-lg shadow border border-gray-200 mb-6">
              <h2 className="text-lg font-medium mb-4">Notification Settings</h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-md">
                  <div>
                    <h3 className="font-medium">New Booking Notifications</h3>
                    <p className="text-sm text-gray-500">Get notified when a new booking is made</p>
                  </div>
                  <div className="flex items-center">
                    <label className="inline-flex relative items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-md">
                  <div>
                    <h3 className="font-medium">Booking Status Updates</h3>
                    <p className="text-sm text-gray-500">Get notified when a booking status changes</p>
                  </div>
                  <div className="flex items-center">
                    <label className="inline-flex relative items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-md">
                  <div>
                    <h3 className="font-medium">New Service Provider Applications</h3>
                    <p className="text-sm text-gray-500">Get notified when a service provider applies to your hotel</p>
                  </div>
                  <div className="flex items-center">
                    <label className="inline-flex relative items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-md">
                  <div>
                    <h3 className="font-medium">Guest Reviews</h3>
                    <p className="text-sm text-gray-500">Get notified when a guest leaves a review</p>
                  </div>
                  <div className="flex items-center">
                    <label className="inline-flex relative items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-md">
                  <div>
                    <h3 className="font-medium">Marketing Updates</h3>
                    <p className="text-sm text-gray-500">Receive marketing and promotional materials</p>
                  </div>
                  <div className="flex items-center">
                    <label className="inline-flex relative items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition">
                  Save Notification Preferences
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SettingsPage;
