/**
 * SuperAdmin Hotels Page
 * Displays a list of all hotels and provides management functions including creation
 */

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchAllHotels,
  createHotel,
  updateHotel,
  deleteHotel,
  selectHotels,
  selectHotelsLoading
} from '../../redux/slices/hotelSlice';
import { toast } from 'react-toastify';

const SuperAdminHotelsPage = () => {
  const dispatch = useDispatch();
  const hotels = useSelector(selectHotels);
  const isLoading = useSelector(selectHotelsLoading);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

const SuperAdminHotelsPage = () => {
  const dispatch = useDispatch();
  const hotels = useSelector(selectHotels);
  const isLoading = useSelector(selectHotelsLoading);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    dispatch(fetchAllHotels());
  }, [dispatch]);

  const handleApproveHotel = (hotelId) => {
    dispatch(approveHotel(hotelId))
      .unwrap()
      .then(() => toast.success('Hotel approved successfully'))
      .catch((error) => toast.error(`Error approving hotel: ${error}`));
  };

  const handleSuspendHotel = (hotelId) => {
    if (window.confirm('Are you sure you want to suspend this hotel?')) {
      dispatch(suspendHotel(hotelId))
        .unwrap()
        .then(() => toast.success('Hotel suspended successfully'))
        .catch((error) => toast.error(`Error suspending hotel: ${error}`));
    }
  };

  const handleDeleteHotel = (hotelId) => {
    if (window.confirm('Are you sure you want to delete this hotel? This action cannot be undone.')) {
      dispatch(deleteHotel(hotelId))
        .unwrap()
        .then(() => toast.success('Hotel deleted successfully'))
        .catch((error) => toast.error(`Error deleting hotel: ${error}`));
    }
  };

  const filteredHotels = hotels.filter(hotel => {
    const matchesSearch = hotel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          hotel.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || hotel.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Hotels Management</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all hotels registered on the platform. You can approve, suspend, or delete hotels.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Export Hotels Data
          </button>
        </div>
      </div>

      <div className="mt-6 flex flex-col md:flex-row gap-4 justify-between">
        <div className="w-full md:w-64">
          <label htmlFor="search" className="sr-only">
            Search
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
            <input
              id="search"
              name="search"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Search hotels"
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="w-full md:w-48">
          <select
            id="status"
            name="status"
            className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      <div className="mt-8 overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Hotel
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Location
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Admin
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Services
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Registered
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredHotels.length > 0 ? (
              filteredHotels.map((hotel) => (
                <tr key={hotel._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <img
                          className="h-10 w-10 rounded-full object-cover"
                          src={hotel.image || 'https://via.placeholder.com/100x100?text=Hotel'}
                          alt={hotel.name}
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{hotel.name}</div>
                        <div className="text-sm text-gray-500">{hotel.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{hotel.location}</div>
                    <div className="text-sm text-gray-500">{hotel.address}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{hotel.admin?.name || 'Not assigned'}</div>
                    <div className="text-sm text-gray-500">{hotel.admin?.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                      ${hotel.status === 'active' ? 'bg-green-100 text-green-800' :
                        hotel.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'}`}>
                      {hotel.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {hotel.serviceCount || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(hotel.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      {hotel.status === 'pending' && (
                        <button
                          onClick={() => handleApproveHotel(hotel._id)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Approve
                        </button>
                      )}
                      {hotel.status === 'active' && (
                        <button
                          onClick={() => handleSuspendHotel(hotel._id)}
                          className="text-yellow-600 hover:text-yellow-900"
                        >
                          Suspend
                        </button>
                      )}
                      {hotel.status === 'suspended' && (
                        <button
                          onClick={() => handleApproveHotel(hotel._id)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Reactivate
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteHotel(hotel._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                  No hotels found matching your search criteria
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SuperAdminHotelsPage;
