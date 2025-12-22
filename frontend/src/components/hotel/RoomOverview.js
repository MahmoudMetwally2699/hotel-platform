/**
 * Room Overview Component
 * Displays a visual grid of hotel rooms with their service request statuses
 */

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import hotelService from '../../services/hotel.service';
import { useTheme } from '../../context/ThemeContext';

const RoomOverview = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [roomData, setRoomData] = useState({ rooms: [], totalRooms: 0, occupiedRooms: 0, roomsWithRequests: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('all');

  useEffect(() => {
    fetchRoomStatus();
  }, []);

  const fetchRoomStatus = async () => {
    try {
      setLoading(true);
      const response = await hotelService.getRoomStatusOverview();
      setRoomData(response.data || { rooms: [], totalRooms: 0, occupiedRooms: 0, roomsWithRequests: 0 });
    } catch (error) {
      console.error('Error fetching room status:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatRequestTime = (createdAt) => {
    if (!createdAt) return '';
    const date = new Date(createdAt);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  };

  // Determine room status and color based on service requests
  const getRoomStatus = (room) => {
    if (!room.serviceRequests || room.serviceRequests.length === 0) {
      return { type: 'no-request', label: t('hotelAdmin.roomOverview.statusLabels.noRequests'), color: 'bg-gray-100 border-gray-200 text-gray-600' };
    }

    // Check if any service is from external provider
    if (hasExternalProvider(room)) {
      return { type: 'external', label: t('hotelAdmin.roomOverview.statusLabels.external'), color: 'bg-orange-500 border-orange-600 text-white' };
    }

    // Get the most recent service request
    const latestRequest = room.serviceRequests[0];

    // Map service types to status categories (Transportation, Laundry, Dining, Housekeeping)
    const statusMap = {
      // Housekeeping subcategories - all green
      'cleaning': { type: 'housekeeping', label: t('hotelAdmin.roomOverview.statusLabels.housekeeping'), color: 'bg-green-500 border-green-600 text-white' },
      'maintenance': { type: 'housekeeping', label: t('hotelAdmin.roomOverview.statusLabels.housekeeping'), color: 'bg-green-500 border-green-600 text-white' },
      'amenities': { type: 'housekeeping', label: t('hotelAdmin.roomOverview.statusLabels.housekeeping'), color: 'bg-green-500 border-green-600 text-white' },
      'housekeeping': { type: 'housekeeping', label: t('hotelAdmin.roomOverview.statusLabels.housekeeping'), color: 'bg-green-500 border-green-600 text-white' },
      // Main services
      'laundry': { type: 'laundry', label: t('hotelAdmin.roomOverview.statusLabels.laundry'), color: 'bg-purple-500 border-purple-600 text-white' },
      'dining': { type: 'dining', label: t('hotelAdmin.roomOverview.statusLabels.dining'), color: 'bg-pink-500 border-pink-600 text-white' },
      'restaurant': { type: 'dining', label: t('hotelAdmin.roomOverview.statusLabels.dining'), color: 'bg-pink-500 border-pink-600 text-white' },
      'transportation': { type: 'transportation', label: t('hotelAdmin.roomOverview.statusLabels.transportation'), color: 'bg-gray-700 border-gray-800 text-white' }
    };

    return statusMap[latestRequest.type] || { type: 'housekeeping', label: t('hotelAdmin.roomOverview.statusLabels.housekeeping'), color: 'bg-green-500 border-green-600 text-white' };
  };

  // Check if room has any external provider service
  const hasExternalProvider = (room) => {
    return room.serviceRequests.some(req => req.isExternal);
  };

  // Extract floor from room number (e.g., "101" -> "1", "205" -> "2")
  const getFloor = (roomNumber) => {
    const match = roomNumber.match(/^(\d+)/);
    if (match && match[1].length >= 2) {
      return match[1][0];
    }
    return '1';
  };

  // Group rooms by floor
  const groupRoomsByFloor = () => {
    const floors = {};
    roomData.rooms.forEach(room => {
      const floor = getFloor(room.roomNumber);
      if (!floors[floor]) {
        floors[floor] = [];
      }
      floors[floor].push(room);
    });

    // Sort rooms within each floor by room number
    Object.keys(floors).forEach(floor => {
      floors[floor].sort((a, b) => {
        const numA = parseInt(a.roomNumber.match(/\d+/)?.[0] || 0);
        const numB = parseInt(b.roomNumber.match(/\d+/)?.[0] || 0);
        return numA - numB;
      });
    });

    return floors;
  };

  // Filter rooms based on selected type
  const getFilteredRooms = () => {
    let filtered = roomData.rooms;

    if (selectedType !== 'all') {
      filtered = filtered.filter(room => {
        const status = getRoomStatus(room);
        return status.type === selectedType;
      });
    }

    return filtered;
  };

  const filteredRooms = getFilteredRooms();

  // Status legend
  const statusLegend = [
    { type: 'no-request', label: t('hotelAdmin.roomOverview.statusLabels.noRequests'), color: 'bg-gray-100 border-gray-300' },
    { type: 'housekeeping', label: t('hotelAdmin.roomOverview.statusLabels.housekeeping'), color: 'bg-green-500' },
    { type: 'laundry', label: t('hotelAdmin.roomOverview.statusLabels.laundry'), color: 'bg-purple-500' },
    { type: 'dining', label: t('hotelAdmin.roomOverview.statusLabels.dining'), color: 'bg-pink-500' },
    { type: 'transportation', label: t('hotelAdmin.roomOverview.statusLabels.transportation'), color: 'bg-gray-700' },
    { type: 'external', label: t('hotelAdmin.roomOverview.statusLabels.external'), color: 'bg-orange-500' }
  ];

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-50 overflow-hidden">
        <div className="p-8 flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-modern-lightBlue border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
      {/* Modern Header with Gradient */}
      <div className="relative px-8 py-8 overflow-hidden" style={{ background: `linear-gradient(to right, ${theme.primaryColor}, ${theme.secondaryColor})` }}>
        <div className="absolute inset-0 bg-black opacity-5"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full -ml-24 -mb-24"></div>

        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-white bg-opacity-20 backdrop-blur-sm p-3 rounded-2xl">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center">
                {t('hotelAdmin.roomOverview.title')}
              </h2>
              <p className="text-blue-100 mt-1 text-sm">{t('hotelAdmin.roomOverview.subtitle')}</p>
            </div>
          </div>
          <button
            onClick={fetchRoomStatus}
            className="bg-white bg-opacity-20 backdrop-blur-sm text-white px-5 py-2.5 rounded-xl hover:bg-opacity-30 transition-all duration-300 flex items-center space-x-2 border border-white border-opacity-30 hover:scale-105 transform"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="font-semibold">{t('hotelAdmin.roomOverview.refresh')}</span>
          </button>
        </div>
      </div>

      {/* Modern Filter Section */}
      <div className="px-8 py-6 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Type Filter with Modern Design */}
          <div className="flex items-center space-x-3">
            <span className="text-sm font-semibold text-gray-700">{t('hotelAdmin.roomOverview.filterByType')}:</span>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-300 transition-all duration-200 cursor-pointer shadow-sm"
            >
              <option value="all">{t('hotelAdmin.roomOverview.allTypes')}</option>
              {statusLegend.map(status => (
                <option key={status.type} value={status.type}>{status.label}</option>
              ))}
            </select>
          </div>

          {/* Modern Status Legend */}
          <div className="flex flex-wrap items-center gap-4">
            {statusLegend.map(status => (
              <div key={status.type} className="flex items-center space-x-2 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className={`w-3 h-3 rounded-full ${status.color} shadow-sm`}></div>
                <span className="text-xs font-medium text-gray-700">{status.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Room Grid */}
      <div className="p-8 bg-gradient-to-br from-gray-50 to-white">
        {filteredRooms.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-block p-6 bg-gradient-to-br from-gray-100 to-gray-50 rounded-2xl mb-4">
              <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">{t('hotelAdmin.roomOverview.noRoomsFound')}</p>
            <p className="text-gray-400 text-sm mt-1">{t('hotelAdmin.roomOverview.tryAdjustingFilters')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-3">
            {filteredRooms.map(room => {
              const status = getRoomStatus(room);
              return (
                <div
                  key={room.roomNumber}
                  className={`relative rounded-lg border-2 ${status.color} flex items-center justify-center cursor-pointer hover:shadow-xl hover:z-10 transition-all duration-200 group h-20`}
                  title={`${t('hotelAdmin.roomOverview.room')} ${room.roomNumber}${room.guestName ? ' - ' + room.guestName : ''}\n${status.label}${room.serviceRequests.length > 0 ? `\n${room.serviceRequests.length} ${t('hotelAdmin.roomOverview.requests')}` : ''}`}
                >
                  <div className="text-center z-10">
                    <div className="font-semibold text-base">{room.roomNumber}</div>
                  </div>

                  {room.serviceRequests.length > 1 && (
                    <div className="absolute top-1 right-1 bg-red-500 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-md">
                      {room.serviceRequests.length}
                    </div>
                  )}

                  {hasExternalProvider(room) && (
                    <div className="absolute bottom-1 left-1 bg-orange-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold shadow-md flex items-center gap-0.5">
                      <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"/>
                        <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z"/>
                      </svg>
                      <span>EXT</span>
                    </div>
                  )}

                  {/* Enhanced Tooltip */}
                  <div className="absolute hidden group-hover:block bg-gray-900 text-white text-xs rounded-lg p-2.5 z-20 bottom-full mb-2 left-1/2 transform -translate-x-1/2 whitespace-nowrap shadow-xl">
                    <div className="font-semibold text-sm mb-1">{t('hotelAdmin.roomOverview.room')} {room.roomNumber}</div>
                    {room.guestName && <div className="text-gray-300 text-xs mb-1">{room.guestName}</div>}
                    {room.serviceRequests.length > 0 && (
                      <div className="mt-1.5 pt-1.5 border-t border-gray-700">
                        <div className="text-gray-400 text-xs mb-1">{t('hotelAdmin.roomOverview.serviceRequests')}:</div>
                        {room.serviceRequests.slice(0, 3).map((req, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 text-xs py-0.5">
                            <span className="capitalize">{req.type}</span>
                            {req.createdAt && (
                              <span className="text-gray-400 text-[10px]">• {formatRequestTime(req.createdAt)}</span>
                            )}
                            {req.isExternal && (
                              <span className="inline-flex items-center gap-0.5 bg-orange-500 text-white text-[9px] px-1 py-0.5 rounded-full font-bold">
                                <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"/>
                                  <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z"/>
                                </svg>
                                {t('hotelAdmin.roomOverview.external')}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modern Stats Footer */}
      <div className="px-8 py-6 bg-gradient-to-r from-white to-gray-50 border-t border-gray-200">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-5 text-center transform hover:scale-105 transition-transform duration-300 shadow-md hover:shadow-lg">
            <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">{roomData.totalRooms}</div>
            <div className="text-sm font-semibold text-blue-700 mt-1">{t('hotelAdmin.roomOverview.totalRooms')}</div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-5 text-center transform hover:scale-105 transition-transform duration-300 shadow-md hover:shadow-lg">
            <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">{roomData.occupiedRooms}</div>
            <div className="text-sm font-semibold text-green-700 mt-1">{t('hotelAdmin.roomOverview.occupiedRooms')}</div>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-5 text-center transform hover:scale-105 transition-transform duration-300 shadow-md hover:shadow-lg">
            <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent">{roomData.roomsWithRequests}</div>
            <div className="text-sm font-semibold text-orange-700 mt-1">{t('hotelAdmin.roomOverview.activeRequests')}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomOverview;
