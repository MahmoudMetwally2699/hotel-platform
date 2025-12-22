/**
 * Room Overview Component
 * Displays a visual grid of hotel rooms with their service request statuses
 */

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import hotelService from '../../services/hotel.service';
import { useTheme } from '../../context/ThemeContext';

const RoomOverview = () => {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const [roomData, setRoomData] = useState({ rooms: [], totalRooms: 0, occupiedRooms: 0, roomsWithRequests: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('all');
  const titleText = t('hotelAdmin.roomOverview.title');
  const subtitleText = t('hotelAdmin.roomOverview.subtitle');
  const textLooksRtl = /[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(
    `${titleText} ${subtitleText}`
  );
  const storedLang =
    typeof window !== 'undefined' && typeof window?.localStorage?.getItem === 'function'
      ? window.localStorage.getItem('i18nextLng')
      : '';
  const resolvedLang =
    (typeof i18n?.resolvedLanguage === 'string' && i18n.resolvedLanguage) ||
    (typeof i18n?.language === 'string' && i18n.language) ||
    (Array.isArray(i18n?.languages) && typeof i18n.languages[0] === 'string' && i18n.languages[0]) ||
    (typeof storedLang === 'string' && storedLang) ||
    '';
  const normalizedLang = String(resolvedLang).toLowerCase();
  const isRtl =
    (typeof document !== 'undefined' && document?.documentElement?.dir === 'rtl') ||
    (typeof document !== 'undefined' && document?.body?.dir === 'rtl') ||
    (typeof i18n?.dir === 'function' && i18n.dir() === 'rtl') ||
    normalizedLang.startsWith('ar') ||
    normalizedLang.startsWith('fa') ||
    normalizedLang.startsWith('he') ||
    normalizedLang.startsWith('ur') ||
    textLooksRtl;

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
      return { type: 'no-request', label: t('hotelAdmin.roomOverview.statusLabels.noRequests'), color: 'bg-white text-gray-700' };
    }

    // Check if any service is from external provider
    if (hasExternalProvider(room)) {
      return { type: 'external', label: t('hotelAdmin.roomOverview.statusLabels.external'), color: 'bg-orange-500 text-white' };
    }

    // Get the most recent service request
    const latestRequest = room.serviceRequests[0];

    // Map service types to status categories (Transportation, Laundry, Dining, Housekeeping)
    const statusMap = {
      // Housekeeping subcategories - all green
      'cleaning': { type: 'housekeeping', label: t('hotelAdmin.roomOverview.statusLabels.housekeeping'), color: 'bg-green-500 text-white' },
      'maintenance': { type: 'housekeeping', label: t('hotelAdmin.roomOverview.statusLabels.housekeeping'), color: 'bg-green-500 text-white' },
      'amenities': { type: 'housekeeping', label: t('hotelAdmin.roomOverview.statusLabels.housekeeping'), color: 'bg-green-500 text-white' },
      'housekeeping': { type: 'housekeeping', label: t('hotelAdmin.roomOverview.statusLabels.housekeeping'), color: 'bg-green-500 text-white' },
      // Main services
      'laundry': { type: 'laundry', label: t('hotelAdmin.roomOverview.statusLabels.laundry'), color: 'bg-purple-500 text-white' },
      'dining': { type: 'dining', label: t('hotelAdmin.roomOverview.statusLabels.dining'), color: 'bg-pink-500 text-white' },
      'restaurant': { type: 'dining', label: t('hotelAdmin.roomOverview.statusLabels.dining'), color: 'bg-pink-500 text-white' },
      'transportation': { type: 'transportation', label: t('hotelAdmin.roomOverview.statusLabels.transportation'), color: 'bg-gray-700 text-white' }
    };

    return statusMap[latestRequest.type] || { type: 'housekeeping', label: t('hotelAdmin.roomOverview.statusLabels.housekeeping'), color: 'bg-green-500 text-white' };
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
    { type: 'no-request', label: t('hotelAdmin.roomOverview.statusLabels.noRequests'), color: 'bg-white border border-gray-300' },
    { type: 'housekeeping', label: t('hotelAdmin.roomOverview.statusLabels.housekeeping'), color: 'bg-green-500' },
    { type: 'laundry', label: t('hotelAdmin.roomOverview.statusLabels.laundry'), color: 'bg-purple-500' },
    { type: 'dining', label: t('hotelAdmin.roomOverview.statusLabels.dining'), color: 'bg-pink-500' },
    { type: 'transportation', label: t('hotelAdmin.roomOverview.statusLabels.transportation'), color: 'bg-gray-700' },
    { type: 'external', label: t('hotelAdmin.roomOverview.statusLabels.external'), color: 'bg-orange-500' }
  ];

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-modern-lightBlue border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header Bar (matches screenshot style) */}
      <div
        className="p-4 sm:p-5 border-b"
        style={{ borderColor: `${theme.primaryColor}55`, backgroundColor: '#fff' }}
      >
        <div className="flex items-center justify-between gap-4">
          <div className={`flex items-center gap-3 ${isRtl ? 'text-right' : 'text-left'}`}>
            <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${theme.primaryColor}12` }}>
              <svg className="w-6 h-6" style={{ color: theme.primaryColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <div className="text-lg sm:text-xl font-bold" style={{ color: theme.primaryColor }}>{titleText}</div>
              <div className="text-sm text-modern-darkGray">{subtitleText}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Type dropdown (existing functionality) */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-2 rounded-full bg-white border text-sm font-semibold text-gray-700 hover:shadow-sm"
              style={{ borderColor: `${theme.primaryColor}55` }}
            >
              <option value="all">{t('hotelAdmin.roomOverview.allTypes')}</option>
              {statusLegend.map(status => (
                <option key={status.type} value={status.type}>{status.label}</option>
              ))}
            </select>

            <button
              type="button"
              onClick={fetchRoomStatus}
              className="px-3 py-2 rounded-full bg-white border hover:shadow-sm transition"
              style={{ borderColor: `${theme.primaryColor}55`, color: theme.primaryColor }}
              title={t('hotelAdmin.roomOverview.refresh')}
              aria-label={t('hotelAdmin.roomOverview.refresh')}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Legend row */}
      <div className="px-4 sm:px-5 py-3 border-b border-gray-200">
        <div className={`flex flex-wrap items-center gap-4 ${isRtl ? 'justify-end flex-row-reverse' : 'justify-start'}`}>
          {statusLegend.map(status => (
            <div key={status.type} className="flex items-center gap-2">
              <span className={`inline-block w-2.5 h-2.5 rounded-full ${status.color}`}></span>
              <span className="text-xs font-semibold text-gray-700">{status.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Room Grid */}
      <div className="p-4 sm:p-5 bg-white">
        {filteredRooms.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 font-medium">{t('hotelAdmin.roomOverview.noRoomsFound')}</p>
            <p className="text-gray-400 text-sm mt-1">{t('hotelAdmin.roomOverview.tryAdjustingFilters')}</p>
          </div>
        ) : (
          <div className="bg-gray-200 p-px rounded-lg overflow-hidden">
            <div className="grid grid-cols-6 sm:grid-cols-12 gap-px">
              {filteredRooms.map(room => {
                const status = getRoomStatus(room);
                return (
                  <div
                    key={room.roomNumber}
                    className={`relative h-12 sm:h-14 flex items-center justify-center ${status.color} cursor-default`}
                    title={`${t('hotelAdmin.roomOverview.room')} ${room.roomNumber}${room.guestName ? ' - ' + room.guestName : ''}\n${status.label}${room.serviceRequests.length > 0 ? `\n${room.serviceRequests.length} ${t('hotelAdmin.roomOverview.requests')}` : ''}`}
                  >
                    <span className="text-sm font-bold">{room.roomNumber}</span>
                    {room.serviceRequests.length > 1 && (
                      <div className="absolute top-1 right-1 bg-red-500 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-bold">
                        {room.serviceRequests.length}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomOverview;
