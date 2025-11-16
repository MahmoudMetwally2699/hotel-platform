/**
 * Hotel Groups Management Page
 * Super Admin only - manage hotel groups for shared loyalty programs
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api.config';
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  Users,
  Award,
  DollarSign,
  TrendingUp,
  Link as LinkIcon,
  Unlink,
  Search,
  X,
  Check
} from 'lucide-react';

const HotelGroupsPage = () => {
  const [hotelGroups, setHotelGroups] = useState([]);
  const [allHotels, setAllHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    hotels: []
  });

  // Fetch hotel groups
  const fetchHotelGroups = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/hotel-groups`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { search: searchTerm }
      });

      if (response.data.success) {
        setHotelGroups(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching hotel groups:', error);
      alert('Failed to fetch hotel groups');
    } finally {
      setLoading(false);
    }
  };

  // Fetch all hotels
  const fetchAllHotels = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Fetching hotels from:', `${API_BASE_URL}/superadmin/hotels`);
      const response = await axios.get(`${API_BASE_URL}/superadmin/hotels`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Hotels response:', response.data);

      // Handle both response formats: {success: true, data: [...]} and {status: "success", data: {hotels: [...]}}
      if (response.data.status === 'success' || response.data.success) {
        const hotels = response.data.data?.hotels || response.data.hotels || response.data.data || [];
        console.log('Parsed hotels:', hotels);
        setAllHotels(hotels);
      }
    } catch (error) {
      console.error('Error fetching hotels:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
    }
  };

  useEffect(() => {
    fetchHotelGroups();
    fetchAllHotels();
  }, []);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchHotelGroups();
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  // Create hotel group
  const handleCreateGroup = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Group name is required');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_BASE_URL}/hotel-groups`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        alert('Hotel group created successfully!');
        setShowCreateModal(false);
        setFormData({ name: '', description: '', hotels: [] });
        fetchHotelGroups();
      }
    } catch (error) {
      console.error('Error creating hotel group:', error);
      alert(error.response?.data?.message || 'Failed to create hotel group');
    }
  };

  // Update hotel group
  const handleUpdateGroup = async (e) => {
    e.preventDefault();

    if (!selectedGroup) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(
        `${API_BASE_URL}/hotel-groups/${selectedGroup._id}`,
        {
          name: formData.name,
          description: formData.description,
          isActive: formData.isActive
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        alert('Hotel group updated successfully!');
        setShowEditModal(false);
        setSelectedGroup(null);
        fetchHotelGroups();
      }
    } catch (error) {
      console.error('Error updating hotel group:', error);
      alert(error.response?.data?.message || 'Failed to update hotel group');
    }
  };

  // Delete hotel group
  const handleDeleteGroup = async (groupId) => {
    if (!window.confirm('Are you sure you want to delete this hotel group? Hotels will keep their loyalty members but points will no longer be shared.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`${API_BASE_URL}/hotel-groups/${groupId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        alert('Hotel group deleted successfully!');
        fetchHotelGroups();
      }
    } catch (error) {
      console.error('Error deleting hotel group:', error);
      alert('Failed to delete hotel group');
    }
  };

  // Add hotels to group
  const handleAddHotelsToGroup = async (groupId, hotelIds) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(
        `${API_BASE_URL}/hotel-groups/${groupId}/hotels/add`,
        { hotelIds },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        alert('Hotels added to group successfully!');
        fetchHotelGroups();
        if (showDetailsModal) {
          viewGroupDetails(groupId);
        }
      }
    } catch (error) {
      console.error('Error adding hotels to group:', error);
      alert(error.response?.data?.message || 'Failed to add hotels to group');
    }
  };

  // Remove hotel from group
  const handleRemoveHotelFromGroup = async (groupId, hotelId) => {
    if (!window.confirm('Remove this hotel from the group?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(
        `${API_BASE_URL}/hotel-groups/${groupId}/hotels/remove`,
        { hotelIds: [hotelId] },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        alert('Hotel removed from group successfully!');
        fetchHotelGroups();
        if (showDetailsModal) {
          viewGroupDetails(groupId);
        }
      }
    } catch (error) {
      console.error('Error removing hotel from group:', error);
      alert('Failed to remove hotel from group');
    }
  };

  // View group details
  const viewGroupDetails = async (groupId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/hotel-groups/${groupId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setSelectedGroup(response.data.data);
        setShowDetailsModal(true);
      }
    } catch (error) {
      console.error('Error fetching group details:', error);
      alert('Failed to fetch group details');
    }
  };

  // Get available hotels (not in any group)
  const getAvailableHotels = () => {
    const hotelsInGroups = hotelGroups.flatMap(g => g.hotels.map(h => h._id?.toString() || h.toString()));
    return allHotels.filter(h => !hotelsInGroups.includes(h._id.toString()));
  };

  // Open edit modal
  const openEditModal = (group) => {
    setSelectedGroup(group);
    setFormData({
      name: group.name,
      description: group.description || '',
      isActive: group.isActive
    });
    setShowEditModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Hotel Groups</h1>
          <p className="text-gray-600 mt-1">Manage hotel groups for shared loyalty programs</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Hotel Group
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search hotel groups..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Hotel Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {hotelGroups.map((group) => (
          <div key={group._id} className="bg-white rounded-lg shadow hover:shadow-lg transition p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-6 w-6 text-blue-600" />
                <h3 className="text-xl font-semibold text-gray-900">{group.name}</h3>
              </div>
              {!group.isActive && (
                <span className="px-2 py-1 text-xs font-semibold bg-gray-200 text-gray-700 rounded">
                  Inactive
                </span>
              )}
            </div>

            {group.description && (
              <p className="text-sm text-gray-600 mb-4">{group.description}</p>
            )}

            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Hotels:</span>
                <span className="font-semibold">{group.hotels?.length || 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Status:</span>
                <span className={`font-semibold ${group.isActive ? 'text-green-600' : 'text-gray-600'}`}>
                  {group.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => viewGroupDetails(group._id)}
                className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition text-sm font-medium"
              >
                View Details
              </button>
              <button
                onClick={() => openEditModal(group)}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition"
              >
                <Edit2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDeleteGroup(group._id)}
                className="px-3 py-2 bg-red-50 text-red-600 rounded hover:bg-red-100 transition"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}

        {hotelGroups.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            <Building2 className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No hotel groups found</p>
            <p className="text-sm">Create your first hotel group to start sharing loyalty points</p>
          </div>
        )}
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Create Hotel Group</h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData({ name: '', description: '', hotels: [] });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateGroup} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Group Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Premium Hotel Group"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                  placeholder="Optional description of the hotel group"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Hotels (Optional)
                </label>
                <div className="border border-gray-300 rounded-lg p-4 max-h-60 overflow-y-auto">
                  {getAvailableHotels().length === 0 ? (
                    <p className="text-sm text-gray-500">No available hotels (all hotels are already in groups)</p>
                  ) : (
                    getAvailableHotels().map((hotel) => (
                      <label key={hotel._id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.hotels.includes(hotel._id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                hotels: [...formData.hotels, hotel._id]
                              });
                            } else {
                              setFormData({
                                ...formData,
                                hotels: formData.hotels.filter(id => id !== hotel._id)
                              });
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">{hotel.name}</span>
                      </label>
                    ))
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  You can add hotels later from the group details page
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Create Group
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData({ name: '', description: '', hotels: [] });
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Group Modal */}
      {showEditModal && selectedGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Edit Hotel Group</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedGroup(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleUpdateGroup} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Group Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                  Active
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Update Group
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedGroup(null);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Group Details Modal */}
      {showDetailsModal && selectedGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-4xl w-full my-8">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedGroup.name}</h2>
                  {selectedGroup.description && (
                    <p className="text-gray-600 mt-1">{selectedGroup.description}</p>
                  )}
                </div>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedGroup(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Statistics */}
              {selectedGroup.loyaltyStats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-5 w-5 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">Members</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-900">
                      {selectedGroup.loyaltyStats.totalMembers || 0}
                    </p>
                  </div>

                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Award className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium text-green-900">Points</span>
                    </div>
                    <p className="text-2xl font-bold text-green-900">
                      {(selectedGroup.loyaltyStats.totalPoints || 0).toLocaleString()}
                    </p>
                  </div>

                  <div className="bg-yellow-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="h-5 w-5 text-yellow-600" />
                      <span className="text-sm font-medium text-yellow-900">Revenue</span>
                    </div>
                    <p className="text-2xl font-bold text-yellow-900">
                      ${(selectedGroup.loyaltyStats.totalSpending || 0).toLocaleString()}
                    </p>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-5 w-5 text-purple-600" />
                      <span className="text-sm font-medium text-purple-900">Avg Points</span>
                    </div>
                    <p className="text-2xl font-bold text-purple-900">
                      {Math.round(selectedGroup.loyaltyStats.avgPointsPerMember || 0)}
                    </p>
                  </div>
                </div>
              )}

              {/* Hotels in Group */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Hotels in Group</h3>
                  <button
                    onClick={() => {
                      const availableHotels = getAvailableHotels();
                      if (availableHotels.length === 0) {
                        alert('No available hotels to add');
                        return;
                      }
                      const hotelIds = prompt(
                        'Enter hotel IDs separated by commas (or use the Add Hotels button):'
                      );
                      if (hotelIds) {
                        const ids = hotelIds.split(',').map(id => id.trim());
                        handleAddHotelsToGroup(selectedGroup._id, ids);
                      }
                    }}
                    className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Hotels
                  </button>
                </div>

                <div className="space-y-2">
                  {selectedGroup.hotels && selectedGroup.hotels.length > 0 ? (
                    selectedGroup.hotels.map((hotel) => (
                      <div
                        key={hotel._id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{hotel.name}</h4>
                          <p className="text-sm text-gray-600">
                            {hotel.address?.city}, {hotel.address?.country}
                          </p>
                          <p className="text-xs text-gray-500">{hotel.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded ${
                              hotel.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-200 text-gray-700'
                            }`}
                          >
                            {hotel.isActive ? 'Active' : 'Inactive'}
                          </span>
                          <button
                            onClick={() => handleRemoveHotelFromGroup(selectedGroup._id, hotel._id)}
                            className="px-2 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 transition"
                          >
                            <Unlink className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 py-8">No hotels in this group yet</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HotelGroupsPage;
