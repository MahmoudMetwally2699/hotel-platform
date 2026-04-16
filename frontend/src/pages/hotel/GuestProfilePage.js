import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import hotelService from '../../services/hotel.service';
import { 
  HiLocationMarker, HiMail, HiChevronLeft, HiPencil, HiCalendar,
  HiOutlineSparkles, HiTrendingUp, HiOutlineOfficeBuilding, HiOutlineStar,
  HiFilter, HiDownload, HiStar, HiIdentification, HiCake
} from 'react-icons/hi';

const GuestProfilePage = () => {
  const { guestId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [guest, setGuest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    idNumber: '',
    nationality: '',
    dateOfBirth: '',
    preferences: {}
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchGuestProfile();
  }, [guestId]);

  const fetchGuestProfile = async () => {
    try {
      setLoading(true);
      const res = await hotelService.getGuestProfile(guestId);
      const data = res.data?.guest || res.data;
      setGuest(data);
      
      setEditForm({
        idNumber: data.idNumber || '',
        nationality: data.nationality || '',
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString().split('T')[0] : '',
        preferences: data.preferences || {}
      });
      setError(null);
    } catch (err) {
      console.error('Error fetching guest profile:', err);
      setError('Failed to load guest profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await hotelService.updateGuestInfo(guestId, {
        ...editForm,
        dateOfBirth: editForm.dateOfBirth || null
      });
      await fetchGuestProfile();
      setIsEditModalOpen(false);
    } catch (err) {
      console.error('Failed to update guest:', err);
      alert('Failed to save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !guest) {
    return (
      <div className="p-8 text-center bg-gray-50 h-screen flex flex-col justify-center items-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">{error || 'Guest not found'}</h2>
        <button onClick={() => navigate(-1)} className="text-indigo-600 hover:text-indigo-800 font-medium">
          &larr; Go Back
        </button>
      </div>
    );
  }

  // Calculate KPIs
  const stays = guest.bookings || [];
  const totalStays = stays.filter(b => b.status === 'completed' || b.status === 'checked_out').length || guest.stayHistory?.length || 0;
  
  // Calculate real LTV based on bookings
  const lifetimeValue = stays.reduce((sum, b) => sum + (b.pricing?.totalAmount || 0), 0);
  const formattedLTV = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(lifetimeValue);

  // Determine preferred service type from bookings
  const serviceTypes = stays.map(b => b.serviceDetails?.category || b.serviceType).filter(Boolean);
  const preferredRoom = serviceTypes.sort((a,b) => serviceTypes.filter(v => v===a).length - serviceTypes.filter(v => v===b).length).pop() || 'N/A';

  const formatReviewFormat = (number) => number ? parseFloat(number).toFixed(1) : '5.0';

  return (
    <div className="min-h-screen bg-[#f8f9fa] p-4 sm:p-6 lg:p-8 font-sans pb-24 text-gray-800">
      
      {/* Navigation */}
      <div className="mb-6">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
        >
          <HiChevronLeft className="w-5 h-5 mr-1" />
          Back to Guests
        </button>
      </div>

      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Top VIP Card */}
        <div className="bg-[#0b1426] text-white rounded-[24px] p-6 lg:p-8 shadow-xl relative overflow-hidden">
          {/* Decorative Background */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 transform translate-x-1/2 -translate-y-1/2"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-xs font-bold tracking-wider text-indigo-300 uppercase">Primary Guest</span>
                  <span className="w-1 h-1 rounded-full bg-gray-500"></span>
                  <span className="text-xs font-bold tracking-wider text-[#d4af37] uppercase">Loyalty: {guest.channel || 'Standard'}</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">
                  {guest.firstName} {guest.lastName}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-300 font-medium">
                  {guest.nationality && (
                    <span className="flex items-center gap-1.5">
                      <HiLocationMarker /> {guest.nationality}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <HiMail /> {guest.email}
                  </span>
                  {guest.idNumber && (
                    <span className="flex items-center gap-1.5">
                      <HiIdentification /> ID: {guest.idNumber}
                    </span>
                  )}
                  {guest.dateOfBirth && (
                    <span className="flex items-center gap-1.5">
                      <HiCake /> Born: {new Date(guest.dateOfBirth).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <button 
                onClick={() => setIsEditModalOpen(true)}
                className="flex-1 md:flex-none px-6 py-2.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-sm font-semibold transition-all"
              >
                Edit Profile
              </button>
            </div>
          </div>
        </div>

        {/* Dashboard KPI Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <HiOutlineOfficeBuilding className="w-4 h-4" /> Total Stays
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-gray-900">{totalStays}</span>
              {totalStays > 0 && <span className="text-xs font-bold text-green-500 flex items-center bg-green-50 px-1.5 py-0.5 rounded"><HiTrendingUp className="mr-1"/> +20% YOY</span>}
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <HiOutlineSparkles className="w-4 h-4" /> Life-Time Value
            </span>
            <span className="text-3xl font-extrabold text-indigo-900">{formattedLTV}</span>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              Preferred Room
            </span>
            <span className="text-xl font-bold text-gray-800">{preferredRoom}</span>
          </div>

          <div className="bg-[#fcf5e5] p-6 rounded-2xl shadow-sm border border-[#f5e6c4] flex flex-col justify-center">
            <span className="text-xs font-bold text-[#b89547] uppercase tracking-wider mb-2 flex items-center gap-2">
              <HiOutlineStar className="w-4 h-4" /> Avg Guest Rating
            </span>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-extrabold text-[#7a5e1f]">{formatReviewFormat()}</span>
              <div className="flex text-[#d4af37]">
                {[1,2,3,4,5].map(i => <HiStar key={i} className="w-4 h-4" />)}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Stay History (takes 2/3 space usually but lets use full width or block structured) */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Stay History Block */}
            <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-white">
                <h3 className="text-lg font-bold text-gray-900 flex items-center">
                  Activity & Bookings
                </h3>
                <div className="flex items-center gap-3 text-gray-400">
                  <button className="p-2 hover:bg-gray-50 rounded-lg transition-colors"><HiFilter className="w-5 h-5"/></button>
                  <button className="p-2 hover:bg-gray-50 rounded-lg transition-colors"><HiDownload className="w-5 h-5"/></button>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 text-xs uppercase tracking-wider text-gray-400 font-bold border-b border-gray-100">
                      <th className="px-6 py-4 font-semibold">Dates</th>
                      <th className="px-6 py-4 font-semibold">Service Type</th>
                      <th className="px-6 py-4 font-semibold">Status</th>
                      <th className="px-6 py-4 font-semibold">Revenue</th>
                      <th className="px-6 py-4 font-semibold">Guest Rating</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {stays && stays.length > 0 ? (
                      stays.map((stay, idx) => {
                        const category = stay.serviceDetails?.category || stay.serviceType || 'regular';
                        const serviceName = stay.serviceDetails?.name || category.charAt(0).toUpperCase() + category.slice(1);
                        const rev = stay.pricing?.totalAmount 
                          ? `${stay.pricing.currency || 'USD'} ${stay.pricing.totalAmount.toFixed(2)}` 
                          : '-';
                        
                        const dateText = stay.schedule?.preferredDate 
                          ? new Date(stay.schedule.preferredDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                          : new Date(stay.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

                        const statusColor = {
                          'completed': 'bg-green-100 text-green-700',
                          'pending': 'bg-yellow-100 text-yellow-700',
                          'confirmed': 'bg-blue-100 text-blue-700',
                          'cancelled': 'bg-red-100 text-red-700',
                          'in-progress': 'bg-indigo-100 text-indigo-700',
                        }[stay.status] || 'bg-gray-100 text-gray-600';

                        return (
                          <tr key={idx} className="hover:bg-gray-50/50 transition-colors group">
                            <td className="px-6 py-4">
                              <div className="font-bold text-gray-900">
                                {dateText}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">#{stay.bookingNumber || stay._id?.toString().substring(0,8).toUpperCase()}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded bg-orange-50 flex items-center justify-center text-orange-600">
                                  <HiOutlineOfficeBuilding />
                                </div>
                                <span className="font-semibold text-gray-800">{serviceName}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-gray-600">
                              <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${statusColor}`}>{stay.status}</span>
                            </td>
                            <td className="px-6 py-4 font-semibold text-gray-900">
                              {rev}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-gray-700">5/5</span>
                                <div className="flex text-[#d4af37]">
                                  {[1,2,3,4,5].map(i => <HiStar key={i} className="w-3 h-3" />)}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    ) : (
                      <tr>
                        <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                          <div className="flex flex-col items-center justify-center">
                            <HiCalendar className="w-10 h-10 text-gray-300 mb-3" />
                            <p>No past activity found for this guest.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-4 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
                <span>Showing {stays?.length || 0} activity records</span>
              </div>
            </div>
            
            {/* Preferences and Notes Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Noted Preferences */}
              <div className="bg-[#f8f9fa] rounded-[24px] p-6 lg:p-8">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Noted Preferences</h3>
                
                <div className="space-y-6">
                  {guest.preferences?.foodAndBeverage?.morningDrink && (
                    <div className="flex items-start gap-4">
                      <div className="mt-1 w-8 h-8 rounded-full bg-[#d4af37]/20 flex items-center justify-center text-[#99791b]">
                        <span className="text-sm">🥃</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm">Morning Drink</h4>
                        <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                          Prefers {guest.preferences.foodAndBeverage.morningDrink}.
                        </p>
                      </div>
                    </div>
                  )}

                  {guest.preferences?.roomPreferences?.floor && guest.preferences?.roomPreferences?.view && (
                    <div className="flex items-start gap-4">
                      <div className="mt-1 w-8 h-8 rounded-full bg-[#d4af37]/20 flex items-center justify-center text-[#99791b]">
                        <span className="text-sm">🏢</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm">Room Preference</h4>
                        <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                          Requests {guest.preferences.roomPreferences.floor} floor setups. View preference: {guest.preferences.roomPreferences.view}.
                        </p>
                      </div>
                    </div>
                  )}

                  {guest.preferences?.roomPreferences?.pillow && (
                    <div className="flex items-start gap-4">
                      <div className="mt-1 w-8 h-8 rounded-full bg-[#d4af37]/20 flex items-center justify-center text-[#99791b]">
                        <span className="text-sm">🛏️</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm">Pillow Type</h4>
                        <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                          Comfort mandatory: {guest.preferences.roomPreferences.pillow} pillows.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Internal Concierge Note */}
              <div className="lg:col-span-2 bg-[#0b1426] rounded-[24px] p-6 lg:p-8 shadow-xl flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 opacity-5 pointer-events-none transform translate-x-4 -translate-y-4">
                  <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/></svg>
                </div>
                
                <div>
                  <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-widest flex items-center gap-2 mb-6">
                    <span className="w-5 h-5 bg-indigo-500/20 rounded flex items-center justify-center text-indigo-400">📝</span> 
                    Internal Concierge Note
                  </h3>
                  
                  <p className="text-lg md:text-xl lg:text-2xl font-medium text-white/90 leading-snug italic relative z-10">
                    "{guest.preferences?.extraPersonalization || 'No extra personalization notes provided.'}"
                  </p>
                </div>

                <div className="mt-8 border-t border-white/10 pt-6 relative z-10 text-right">
                  <span className="text-xs font-medium text-gray-500">
                    Last updated: {new Date(guest.updatedAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric'})}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] opacity-100 transition-opacity">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col transform transition-transform scale-100">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-900">
                Edit Guest Profile
              </h3>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-400 hover:text-gray-900 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <form id="edit-profile-form" onSubmit={handleUpdateProfile} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    National ID / Passport
                  </label>
                  <input
                    type="text"
                    value={editForm.idNumber}
                    onChange={(e) => setEditForm(prev => ({ ...prev, idNumber: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-shadow"
                    placeholder="Enter ID number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Nationality
                  </label>
                  <input
                    type="text"
                    value={editForm.nationality}
                    onChange={(e) => setEditForm(prev => ({ ...prev, nationality: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-shadow"
                    placeholder="e.g. Egypt"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={editForm.dateOfBirth}
                    onChange={(e) => setEditForm(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-shadow"
                  />
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <h4 className="font-bold text-gray-900 mb-4">Preferences</h4>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Trip Purpose
                      </label>
                      <input
                        type="text"
                        value={editForm.preferences?.tripPurpose || ''}
                        onChange={(e) => setEditForm(prev => ({ ...prev, preferences: { ...prev.preferences, tripPurpose: e.target.value } }))}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-shadow"
                        placeholder="e.g. Family Vacation"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Extra Personalization Notes
                      </label>
                      <textarea
                        value={editForm.preferences?.extraPersonalization || ''}
                        onChange={(e) => setEditForm(prev => ({ ...prev, preferences: { ...prev.preferences, extraPersonalization: e.target.value } }))}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-shadow resize-y"
                        rows="4"
                        placeholder="Special requests or internal notes..."
                      />
                    </div>
                  </div>
                </div>
              </form>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                type="submit"
                form="edit-profile-form"
                disabled={isSaving}
                className="px-6 py-2.5 text-sm font-semibold text-white bg-[#3b82f6] hover:bg-blue-600 rounded-lg transition-colors shadow-sm disabled:opacity-70 flex items-center justify-center min-w-[120px]"
              >
                {isSaving ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </span>
                ) : (
                  'Save Profile'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuestProfilePage;
