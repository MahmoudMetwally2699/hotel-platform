import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '../../config/api.config';

const SuperHotelsPage = () => {
  const { t } = useTranslation();
  const [superHotels, setSuperHotels] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedSuperHotel, setSelectedSuperHotel] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    email: '',
    password: '',
    contactPerson: {
      name: '',
      email: '',
      phone: ''
    },
    permissions: {
      canViewStatistics: true,
      canViewClients: true,
      canViewAnalytics: true,
      canViewBookings: true,
      canViewRevenue: false
    }
  });
  const [assignedHotels, setAssignedHotels] = useState([]);

  // Fetch super hotels and available hotels
  useEffect(() => {
    fetchSuperHotels();
    fetchHotels();
  }, []);

  const fetchSuperHotels = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/superadmin/superhotels`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSuperHotels(data.data.superHotels);
      } else {
        toast.error('Failed to fetch super hotels');
      }
    } catch (error) {
      console.error('Error fetching super hotels:', error);
      toast.error('Error fetching super hotels');
    } finally {
      setLoading(false);
    }
  };

  const fetchHotels = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/superadmin/hotels`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setHotels(data.data.hotels);
      } else {
        toast.error('Failed to fetch hotels');
      }
    } catch (error) {
      console.error('Error fetching hotels:', error);
      toast.error('Error fetching hotels');
    }
  };

  const handleCreateSuperHotel = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/superadmin/superhotels`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success('Super hotel created successfully');
        setShowCreateModal(false);
        resetForm();
        fetchSuperHotels();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to create super hotel');
      }
    } catch (error) {
      console.error('Error creating super hotel:', error);
      toast.error('Error creating super hotel');
    }
  };

  const handleAssignHotels = async (e) => {
    e.preventDefault();

    console.log('Assigning hotels:', assignedHotels);
    console.log('Number of hotels to assign:', assignedHotels.length);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/superadmin/superhotels/${selectedSuperHotel._id}/assign-hotels`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ hotelIds: assignedHotels })
      });

      console.log('Response status:', response.status);
      const responseData = await response.json();
      console.log('Response data:', responseData);

      if (response.ok) {
        toast.success('Hotels assigned successfully');
        setShowAssignModal(false);
        setSelectedSuperHotel(null);
        setAssignedHotels([]);
        fetchSuperHotels();
      } else {
        toast.error(responseData.message || 'Failed to assign hotels');
      }
    } catch (error) {
      console.error('Error assigning hotels:', error);
      toast.error('Error assigning hotels');
    }
  };

  const handleDeleteSuperHotel = async (superHotelId) => {
    if (!window.confirm('Are you sure you want to delete this super hotel?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/superadmin/superhotels/${superHotelId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast.success('Super hotel deleted successfully');
        fetchSuperHotels();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to delete super hotel');
      }
    } catch (error) {
      console.error('Error deleting super hotel:', error);
      toast.error('Error deleting super hotel');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      email: '',
      password: '',
      contactPerson: {
        name: '',
        email: '',
        phone: ''
      },
      permissions: {
        canViewStatistics: true,
        canViewClients: true,
        canViewAnalytics: true,
        canViewBookings: true,
        canViewRevenue: false
      }
    });
  };

  const openAssignModal = (superHotel) => {
    setSelectedSuperHotel(superHotel);
    setAssignedHotels(superHotel.assignedHotels.map(hotel => hotel._id));
    setShowAssignModal(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Super Hotels Management</h1>
          <p className="text-gray-600 mt-2">Create and manage super hotels that supervise multiple hotels</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          Create Super Hotel
        </button>
      </div>

      {/* Super Hotels List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Super Hotel
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned Hotels
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {superHotels.map((superHotel) => (
                <tr key={superHotel._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{superHotel.name}</div>
                      <div className="text-sm text-gray-500">{superHotel.email}</div>
                      {superHotel.description && (
                        <div className="text-xs text-gray-400 mt-1">{superHotel.description}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{superHotel.contactPerson?.name}</div>
                    <div className="text-sm text-gray-500">{superHotel.contactPerson?.email}</div>
                    <div className="text-sm text-gray-500">{superHotel.contactPerson?.phone}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {superHotel.assignedHotels?.map((hotel) => (
                        <span
                          key={hotel._id}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {hotel.name}
                        </span>
                      ))}
                      {superHotel.assignedHotels?.length === 0 && (
                        <span className="text-sm text-gray-400">No hotels assigned</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        superHotel.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {superHotel.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openAssignModal(superHotel)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Assign Hotels
                      </button>
                      <button
                        onClick={() => handleDeleteSuperHotel(superHotel._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Super Hotel Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Create Super Hotel</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleCreateSuperHotel} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Password *</label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Contact Person Name</label>
                  <input
                    type="text"
                    value={formData.contactPerson.name}
                    onChange={(e) => setFormData({
                      ...formData,
                      contactPerson: { ...formData.contactPerson, name: e.target.value }
                    })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Contact Person Email</label>
                  <input
                    type="email"
                    value={formData.contactPerson.email}
                    onChange={(e) => setFormData({
                      ...formData,
                      contactPerson: { ...formData.contactPerson, email: e.target.value }
                    })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Contact Person Phone</label>
                  <input
                    type="tel"
                    value={formData.contactPerson.phone}
                    onChange={(e) => setFormData({
                      ...formData,
                      contactPerson: { ...formData.contactPerson, phone: e.target.value }
                    })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Assign Hotels Modal */}
      {showAssignModal && selectedSuperHotel && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Assign Hotels to {selectedSuperHotel.name}
                </h3>
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleAssignHotels} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Hotels</label>
                  <div className="mb-2 p-2 bg-gray-100 rounded text-sm">
                    <strong>Currently selected ({assignedHotels.length}):</strong> {assignedHotels.join(', ')}
                  </div>
                  <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-md p-2">
                    {hotels.map((hotel) => (
                      <label key={hotel._id} className="flex items-center space-x-2 py-1">
                        <input
                          type="checkbox"
                          checked={assignedHotels.includes(hotel._id)}
                          onChange={(e) => {
                            console.log(`Checkbox changed for hotel ${hotel.name}:`, e.target.checked);
                            if (e.target.checked) {
                              const newAssigned = [...assignedHotels, hotel._id];
                              console.log('Adding hotel, new array:', newAssigned);
                              setAssignedHotels(newAssigned);
                            } else {
                              const newAssigned = assignedHotels.filter(id => id !== hotel._id);
                              console.log('Removing hotel, new array:', newAssigned);
                              setAssignedHotels(newAssigned);
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{hotel.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAssignModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Assign Hotels
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperHotelsPage;
