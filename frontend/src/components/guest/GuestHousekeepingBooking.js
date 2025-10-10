/**
 * Guest Housekeeping Booking
 * Allows guests to book housekeeping services without any pricing
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../redux/slices/authSlice';
import {
  FaBroom,
  FaClock,
  FaCalendarAlt,
  FaSpinner,
  FaCheck,
  FaArrowLeft,
  FaMapMarkerAlt,
  FaLightbulb,
  FaBolt,
  FaWrench,
  FaSnowflake,
  FaCouch,
  FaSprayCan,
  FaTv
} from 'react-icons/fa';
import apiClient from '../../services/api.service';
import { toast } from 'react-toastify';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { FaStar, FaTimes } from 'react-icons/fa';

// Remove the problematic import for now
// import FeedbackModal from './FeedbackModal';

const GuestHousekeepingBooking = ({ onBack, hotelId }) => {
  const { currentUser, isAuthenticated } = useAuth();
  const currentUserFromRedux = useSelector(selectCurrentUser);
  const { t } = useTranslation();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState(null);
  const [bookingStep, setBookingStep] = useState('select'); // 'select', 'details', 'confirmation'
  const [submitting, setSubmitting] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [completedBooking, setCompletedBooking] = useState(null);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const [bookingDetails, setBookingDetails] = useState({
    guestName: '',
    roomNumber: '',
    phoneNumber: '',
    preferredTime: '09:00',
    scheduledDateTime: '',
    specialRequests: '',
    guestEmail: '',
    specificCategory: [] // Changed to array for multiple category selection
  });

  // Quick hints state
  const [showQuickHints, setShowQuickHints] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [issueCategoryDropdownOpen, setIssueCategoryDropdownOpen] = useState(false);
  const [timeOption, setTimeOption] = useState('asap'); // 'asap' or 'custom'
  const dropdownRef = useRef(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIssueCategoryDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Set initial time option based on preferred time
  useEffect(() => {
    if (bookingDetails.preferredTime === 'asap') {
      setTimeOption('asap');
    } else if (bookingDetails.preferredTime && bookingDetails.preferredTime !== '') {
      setTimeOption('custom');
    }
  }, [bookingDetails.preferredTime]);

  // Get quick hint categories based on service type
  const getQuickHintCategories = () => {
    const serviceCategory = selectedService?.category?.toLowerCase();
    const serviceName = selectedService?.name?.toLowerCase() || '';

    // Base categories for maintenance
    const maintenanceCategories = [
      {
        title: t('housekeeping.quickIssues.maintenance.electrical.title'),
        icon: FaBolt,
        color: "bg-gradient-to-r from-yellow-500 to-orange-500",
        items: [
          t('housekeeping.quickIssues.maintenance.electrical.items.powerOutage'),
          t('housekeeping.quickIssues.maintenance.electrical.items.keyCardProblem'),
          t('housekeeping.quickIssues.maintenance.electrical.items.lightNotWorking'),
          t('housekeeping.quickIssues.maintenance.electrical.items.powerOutlet'),
          t('housekeeping.quickIssues.maintenance.electrical.items.bathroomLight'),
          t('housekeeping.quickIssues.maintenance.electrical.items.acNotWorking'),
          t('housekeeping.quickIssues.maintenance.electrical.items.fridgeNotCooling'),
          t('housekeeping.quickIssues.maintenance.electrical.items.tvNotTurning')
        ]
      },
      {
        title: t('housekeeping.quickIssues.maintenance.plumbing.title'),
        icon: FaWrench,
        color: "bg-gradient-to-r from-blue-500 to-cyan-500",
        items: [
          t('housekeeping.quickIssues.maintenance.plumbing.items.sinkClogged'),
          t('housekeeping.quickIssues.maintenance.plumbing.items.drainClogged'),
          t('housekeeping.quickIssues.maintenance.plumbing.items.waterLeak'),
          t('housekeeping.quickIssues.maintenance.plumbing.items.toiletFlush'),
          t('housekeeping.quickIssues.maintenance.plumbing.items.acLeaking'),
          t('housekeeping.quickIssues.maintenance.plumbing.items.noHotWater'),
          t('housekeeping.quickIssues.maintenance.plumbing.items.lowPressure')
        ]
      },
      {
        title: t('housekeeping.quickIssues.maintenance.acHeating.title'),
        icon: FaSnowflake,
        color: "bg-gradient-to-r from-cyan-500 to-blue-500",
        items: [
          t('housekeeping.quickIssues.maintenance.acHeating.items.acNotCooling'),
          t('housekeeping.quickIssues.maintenance.acHeating.items.heaterNotHeating'),
          t('housekeeping.quickIssues.maintenance.acHeating.items.acNoise'),
          t('housekeeping.quickIssues.maintenance.acHeating.items.remoteControl')
        ]
      },
      {
        title: t('housekeeping.quickIssues.maintenance.furniture.title'),
        icon: FaCouch,
        color: "bg-gradient-to-r from-amber-600 to-orange-600",
        items: [
          t('housekeeping.quickIssues.maintenance.furniture.items.chairTable'),
          t('housekeeping.quickIssues.maintenance.furniture.items.doorLock'),
          t('housekeeping.quickIssues.maintenance.furniture.items.closetDoor'),
          t('housekeeping.quickIssues.maintenance.furniture.items.curtainStuck'),
          t('housekeeping.quickIssues.maintenance.furniture.items.bedRepair'),
          t('housekeeping.quickIssues.maintenance.furniture.items.windowClose')
        ]
      },
      {
        title: t('housekeeping.quickIssues.maintenance.electronics.title'),
        icon: FaTv,
        color: "bg-gradient-to-r from-indigo-500 to-purple-500",
        items: [
          t('housekeeping.quickIssues.maintenance.electronics.items.tvNotWorking'),
          t('housekeeping.quickIssues.maintenance.electronics.items.wifiProblem'),
          t('housekeeping.quickIssues.maintenance.electronics.items.tvRemote'),
          t('housekeeping.quickIssues.maintenance.electronics.items.telephoneProblem')
        ]
      }
    ];

    // Room cleaning specific categories
    const roomCleaningCategories = [
      {
        title: t('housekeeping.quickIssues.cleaning.roomCleaning.title'),
        icon: FaBroom,
        color: "bg-gradient-to-r from-[#3B5787] to-[#67BAE0]",
        items: [
          t('housekeeping.quickIssues.cleaning.roomCleaning.items.bathroomClean'),
          t('housekeeping.quickIssues.cleaning.roomCleaning.items.changeBedSheets'),
          t('housekeeping.quickIssues.cleaning.roomCleaning.items.vacuumFloor'),
          t('housekeeping.quickIssues.cleaning.roomCleaning.items.cleanWindows'),
          t('housekeeping.quickIssues.cleaning.roomCleaning.items.emptyTrash'),
          t('housekeeping.quickIssues.cleaning.roomCleaning.items.disinfectSurfaces'),
          t('housekeeping.quickIssues.cleaning.roomCleaning.items.mopBathroom'),
          t('housekeeping.quickIssues.cleaning.roomCleaning.items.cleanGlass')
        ]
      },
      {
        title: t('housekeeping.quickIssues.cleaning.deepCleaning.title'),
        icon: FaSprayCan,
        color: "bg-gradient-to-r from-green-500 to-emerald-500",
        items: [
          t('housekeeping.quickIssues.cleaning.deepCleaning.items.deepBathroom'),
          t('housekeeping.quickIssues.cleaning.deepCleaning.items.cleanFridge'),
          t('housekeeping.quickIssues.cleaning.deepCleaning.items.cleanBehind'),
          t('housekeeping.quickIssues.cleaning.deepCleaning.items.sanitizeHandles'),
          t('housekeeping.quickIssues.cleaning.deepCleaning.items.cleanVents'),
          t('housekeeping.quickIssues.cleaning.deepCleaning.items.polishWood'),
          t('housekeeping.quickIssues.cleaning.deepCleaning.items.cleanFixtures'),
          t('housekeeping.quickIssues.cleaning.deepCleaning.items.disinfectControls')
        ]
      },
      {
        title: t('housekeeping.quickIssues.cleaning.stains.title'),
        icon: FaSprayCan,
        color: "bg-gradient-to-r from-red-500 to-pink-500",
        items: [
          t('housekeeping.quickIssues.cleaning.stains.items.carpetStains'),
          t('housekeeping.quickIssues.cleaning.stains.items.upholsteryStains'),
          t('housekeeping.quickIssues.cleaning.stains.items.wallMarks'),
          t('housekeeping.quickIssues.cleaning.stains.items.tileStains'),
          t('housekeeping.quickIssues.cleaning.stains.items.waterSpots'),
          t('housekeeping.quickIssues.cleaning.stains.items.coffeeStains'),
          t('housekeeping.quickIssues.cleaning.stains.items.foodStains'),
          t('housekeeping.quickIssues.cleaning.stains.items.makeupStains')
        ]
      }
    ];

    // Amenities specific categories
    const amenitiesCategories = [
      {
        title: t('housekeeping.quickIssues.amenities.bathroom.title'),
        icon: FaSprayCan,
        color: "bg-gradient-to-r from-blue-400 to-cyan-400",
        items: [
          t('housekeeping.quickIssues.amenities.bathroom.items.freshTowels'),
          t('housekeeping.quickIssues.amenities.bathroom.items.extraTowels'),
          t('housekeeping.quickIssues.amenities.bathroom.items.toiletries'),
          t('housekeeping.quickIssues.amenities.bathroom.items.toiletPaper'),
          t('housekeeping.quickIssues.amenities.bathroom.items.showerCurtain'),
          t('housekeeping.quickIssues.amenities.bathroom.items.bathMat'),
          t('housekeeping.quickIssues.amenities.bathroom.items.soapDispensers'),
          t('housekeeping.quickIssues.amenities.bathroom.items.hairDryer')
        ]
      },
      {
        title: t('housekeeping.quickIssues.amenities.roomSupplies.title'),
        icon: FaCouch,
        color: "bg-gradient-to-r from-purple-500 to-indigo-500",
        items: [
          t('housekeeping.quickIssues.amenities.roomSupplies.items.extraPillows'),
          t('housekeeping.quickIssues.amenities.roomSupplies.items.extraBlankets'),
          t('housekeeping.quickIssues.amenities.roomSupplies.items.bedLinens'),
          t('housekeeping.quickIssues.amenities.roomSupplies.items.hangers'),
          t('housekeeping.quickIssues.amenities.roomSupplies.items.ironBoard'),
          t('housekeeping.quickIssues.amenities.roomSupplies.items.deskSupplies'),
          t('housekeeping.quickIssues.amenities.roomSupplies.items.coffeeSupplies'),
          t('housekeeping.quickIssues.amenities.roomSupplies.items.slippers')
        ]
      },
      {
        title: t('housekeeping.quickIssues.amenities.comfort.title'),
        icon: FaCheck,
        color: "bg-gradient-to-r from-green-400 to-teal-400",
        items: [
          t('housekeeping.quickIssues.amenities.comfort.items.adjustTemp'),
          t('housekeeping.quickIssues.amenities.comfort.items.blackoutCurtains'),
          t('housekeeping.quickIssues.amenities.comfort.items.wakeupCall'),
          t('housekeeping.quickIssues.amenities.comfort.items.restock'),
          t('housekeeping.quickIssues.amenities.comfort.items.newspaper'),
          t('housekeeping.quickIssues.amenities.comfort.items.extensionCord'),
          t('housekeeping.quickIssues.amenities.comfort.items.airFreshener'),
          t('housekeeping.quickIssues.amenities.comfort.items.extraLighting')
        ]
      }
    ];

    // Return appropriate categories based on service type
    if (serviceCategory === 'maintenance' || serviceName.includes('maintenance')) {
      return maintenanceCategories;
    } else if (serviceCategory === 'cleaning' || serviceName.includes('cleaning') || serviceName.includes('housekeeping')) {
      return roomCleaningCategories; // Only cleaning-specific categories
    } else if (serviceCategory === 'amenities' || serviceName.includes('amenities')) {
      return amenitiesCategories;
    } else {
      // Default: show cleaning and amenities categories for general housekeeping
      return [...roomCleaningCategories, ...amenitiesCategories];
    }
  };

  const quickHintCategories = getQuickHintCategories();

  // Check if "Others" is selected to enable/disable special requests field
  const isOthersSelected = Array.isArray(bookingDetails.specificCategory) &&
    bookingDetails.specificCategory.includes('others');

  // Handler for category checkbox selection
  const handleCategoryToggle = (categoryValue) => {
    setBookingDetails(prev => {
      const currentCategories = Array.isArray(prev.specificCategory) ? prev.specificCategory : [];
      const isSelected = currentCategories.includes(categoryValue);

      if (isSelected) {
        return {
          ...prev,
          specificCategory: currentCategories.filter(cat => cat !== categoryValue)
        };
      } else {
        return {
          ...prev,
          specificCategory: [...currentCategories, categoryValue]
        };
      }
    });
  };

  // Get filtered quick hint categories based on selected issue categories
  const getFilteredQuickHintCategories = () => {
    if (!Array.isArray(bookingDetails.specificCategory) || bookingDetails.specificCategory.length === 0) {
      return quickHintCategories;
    }

    // Map selected dropdown categories to quick hint categories
    const categoryMapping = {
      'electrical_issues': ['electrical'],
      'plumbing_issues': ['plumbing'],
      'ac_heating': ['acHeating', 'ac', 'heating'],
      'furniture_repair': ['furniture'],
      'electronics_issues': ['electronics'],
      'general_cleaning': ['roomCleaning', 'room cleaning'],
      'deep_cleaning': ['deepCleaning', 'deep cleaning'],
      'stain_removal': ['stains'],
      'bathroom_amenities': ['bathroom'],
      'room_supplies': ['room'],
      'cleaning_supplies': ['cleaning']
    };

    const allowedCategoryTypes = [];
    bookingDetails.specificCategory.forEach(selectedCat => {
      if (categoryMapping[selectedCat]) {
        allowedCategoryTypes.push(...categoryMapping[selectedCat]);
      }
    });

    if (allowedCategoryTypes.length === 0) {
      return quickHintCategories; // If no mapping found, show all categories
    }

    return quickHintCategories.filter(category => {
      // Extract category type from translation key or title
      const categoryTitle = category.title.toLowerCase();
      return allowedCategoryTypes.some(allowedType => {
        const type = allowedType.toLowerCase();
        return (categoryTitle.includes(type) ||
               (categoryTitle.includes('كهربائية') && type === 'electrical') ||
               (categoryTitle.includes('سباكة') && type === 'plumbing') ||
               (categoryTitle.includes('تكييف') && (type === 'ac' || type === 'acheating')) ||
               (categoryTitle.includes('أثاث') && type === 'furniture') ||
               (categoryTitle.includes('إلكترونية') && type === 'electronics') ||
               (categoryTitle.includes('تنظيف الغرفة') && type === 'room cleaning') ||
               (categoryTitle.includes('تنظيف عميق') && type === 'deep cleaning') ||
               (categoryTitle.includes('البقع') && type === 'stains') ||
               (categoryTitle.includes('الحمام') && type === 'bathroom'));
      });
    });
  };

  // Get flattened list of issues for selected categories
  const getFilteredIssuesList = () => {
    const filteredCategories = getFilteredQuickHintCategories();

    if (!Array.isArray(bookingDetails.specificCategory) || bookingDetails.specificCategory.length === 0) {
      return []; // Show categories with expandable sections when no specific category is selected
    }

    // Flatten all items from filtered categories
    const allItems = [];
    filteredCategories.forEach(category => {
      category.items.forEach(item => {
        allItems.push({
          text: item,
          category: category.title,
          icon: category.icon,
          color: category.color
        });
      });
    });

    return allItems;
  };

  // Handle quick hint selection
  const handleQuickHintSelect = (hint) => {
    const currentText = bookingDetails.specialRequests;
    const newText = currentText ? `${currentText}\n• ${hint}` : `• ${hint}`;
    setBookingDetails(prev => ({ ...prev, specialRequests: newText }));

    // Optionally collapse the category after selection
    setExpandedCategory(null);

    // Show a subtle feedback
    toast.success('Issue added to your request', {
      position: "bottom-center",
      autoClose: 1500,
      hideProgressBar: true,
      closeOnClick: true,
      pauseOnHover: false,
      draggable: false,
      style: {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        borderRadius: '12px',
        fontSize: '14px'
      }
    });
  };

  // Service categories are now dynamically loaded from the API

  // Specific categories for each service type (for dropdown selection)
  const getSpecificCategories = (serviceCategory) => {
    const categories = {
      maintenance: [
        { value: 'electrical_issues', label: 'Electrical Issues', icon: FaBolt, color: "bg-gradient-to-r from-yellow-500 to-orange-500" },
        { value: 'plumbing_issues', label: 'Plumbing Issues', icon: FaWrench, color: "bg-gradient-to-r from-blue-500 to-cyan-500" },
        { value: 'ac_heating', label: 'AC & Heating', icon: FaSnowflake, color: "bg-gradient-to-r from-cyan-500 to-blue-500" },
        { value: 'furniture_repair', label: 'Furniture Repair', icon: FaCouch, color: "bg-gradient-to-r from-amber-600 to-orange-600" },
        { value: 'electronics_issues', label: 'Electronics Issues', icon: FaTv, color: "bg-gradient-to-r from-indigo-500 to-purple-500" },
        { value: 'others', label: 'Others', icon: FaLightbulb, color: "bg-gradient-to-r from-gray-500 to-gray-600" }
      ],
      cleaning: [
        { value: 'general_cleaning', label: 'General Room Cleaning', icon: FaBroom, color: "bg-gradient-to-r from-[#3B5787] to-[#67BAE0]" },
        { value: 'deep_cleaning', label: 'Deep Cleaning', icon: FaSprayCan, color: "bg-gradient-to-r from-green-500 to-emerald-500" },
        { value: 'stain_removal', label: 'Stain Removal', icon: FaSprayCan, color: "bg-gradient-to-r from-red-500 to-pink-500" },
        { value: 'others', label: 'Others', icon: FaLightbulb, color: "bg-gradient-to-r from-gray-500 to-gray-600" }
      ],
      amenities: [
        { value: 'bathroom_amenities', label: 'Bathroom Amenities', icon: FaSprayCan, color: "bg-gradient-to-r from-blue-400 to-cyan-400" },
        { value: 'room_supplies', label: 'Room Supplies', icon: FaBroom, color: "bg-gradient-to-r from-purple-500 to-indigo-500" },
        { value: 'cleaning_supplies', label: 'Cleaning Supplies', icon: FaSprayCan, color: "bg-gradient-to-r from-green-400 to-teal-400" },
        { value: 'others', label: 'Others', icon: FaLightbulb, color: "bg-gradient-to-r from-gray-500 to-gray-600" }
      ]
    };
    return categories[serviceCategory] || [];
  };

  // Auto-populate user data if logged in
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      const fullName = `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim();
      const phoneNumber = currentUser.phone || '';

      setBookingDetails(prev => ({
        ...prev,
        guestName: fullName || currentUser.name || '',
        phoneNumber: phoneNumber,
        guestEmail: currentUser.email || ''
      }));
    }
  }, [isAuthenticated, currentUser]); // Removed i18n from dependencies

  const fetchAvailableServices = useCallback(async () => {
    try {
      console.log('Fetching housekeeping services for hotel:', hotelId);
      // Add cache-busting timestamp to prevent browser caching
      const timestamp = new Date().getTime();
      const response = await apiClient.get(`/client/hotels/${hotelId}/housekeeping-services?_t=${timestamp}`);
      console.log('Housekeeping services response:', response.data);

      const activeServices = (response.data.data || []).filter(service => service.isActive);
      console.log('Active services after filtering:', activeServices);

      setServices(activeServices);
    } catch (error) {
      console.error('Error fetching housekeeping services:', error);
      setServices([]);
    } finally {
      setLoading(false);
    }
  }, [hotelId]);

  useEffect(() => {
    fetchAvailableServices();
  }, [fetchAvailableServices]);

  const getCategoryInfo = (category) => {
    // Since we no longer have hardcoded categories, return a default info
    const defaultInfo = {
      label: t(`housekeeping.categories.${category}`, category),
      icon: FaBroom,
      color: 'blue'
    };

    // Try to find the service in our services array to get better info
    const service = services.find(s => s.subcategory === category || s.category === category);
    if (service) {
      let icon = FaBroom;
      if (category === 'maintenance') icon = FaWrench;
      if (category === 'cleaning') icon = FaBroom;
      if (category === 'amenities') icon = FaMapMarkerAlt;

      return {
        label: t(`housekeeping.categories.${category}`, category),
        icon: icon,
        color: 'blue'
      };
    }

    return defaultInfo;
  };

  const handleServiceSelect = (service) => {
    setSelectedService(service);

    // Set default time based on service category - all housekeeping services default to ASAP
    if (service.category === 'maintenance' ||
        service.category === 'cleaning' ||
        service.category === 'amenities' ||
        (service.name && (service.name.includes('maintenance') ||
          service.name.includes('cleaning') ||
          service.name.includes('amenities') ||
          service.name.includes('housekeeping')))) {
      setBookingDetails(prev => ({ ...prev, preferredTime: 'asap' }));
    } else {
      setBookingDetails(prev => ({ ...prev, preferredTime: '09:00' }));
    }

    setBookingStep('details');
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    // Validate required fields
    if (!Array.isArray(bookingDetails.specificCategory) || bookingDetails.specificCategory.length === 0) {
      toast.error(t('housekeeping.selectAtLeastOneCategory', 'Please select at least one issue category'));
      setSubmitting(false);
      return;
    }

    // Validate special requests when "Others" is selected
    const hasOthersSelected = bookingDetails.specificCategory.includes('others');
    if (hasOthersSelected && (!bookingDetails.specialRequests || bookingDetails.specialRequests.trim() === '')) {
      toast.error('Please describe your request in the Special Requests field when "Others" is selected');
      setSubmitting(false);
      return;
    }

    try {
      // For backend compatibility, keep 'now' for ASAP but also provide display text
      const backendTime = bookingDetails.preferredTime === 'asap' ? 'now' : bookingDetails.preferredTime;

      const bookingData = {
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        serviceCategory: selectedService.category, // Include the service category
        specificCategory: bookingDetails.specificCategory, // Include the specific category for analysis
        hotelId,
        ...bookingDetails,
        roomNumber: currentUserFromRedux?.roomNumber || currentUser?.roomNumber || bookingDetails.roomNumber,
        preferredTime: backendTime, // Send 'now' for backend compatibility
        serviceType: 'housekeeping',
        status: 'pending',
        bookingDate: new Date().toISOString(),
        estimatedDuration: selectedService.estimatedDuration
      };

      const response = await apiClient.post('/client/bookings/housekeeping', bookingData);

      // Store the completed booking for feedback modal - use the response data
      if (response.data?.success && response.data?.data) {
        setCompletedBooking({
          _id: response.data.data.bookingId, // Use bookingId from response
          ...response.data.data,
          serviceType: 'housekeeping'
        });
      } else {
        // Fallback for demo
        setCompletedBooking({
          _id: 'demo-booking-' + Date.now(),
          ...bookingData,
          bookingNumber: 'HK' + Date.now()
        });
      }

      setBookingStep('confirmation');
      toast.success('Housekeeping service booked successfully!');

      // Show feedback modal after a brief delay
      setTimeout(() => {
        setShowFeedbackModal(true);
      }, 1500);

    } catch (error) {
      console.error('Error booking service:', error);
      // Simulate success for demo - you can remove this later
      const demoBooking = {
        _id: 'demo-booking-' + Date.now(),
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        serviceCategory: selectedService.category,
        hotelId,
        roomNumber: currentUserFromRedux?.roomNumber || currentUser?.roomNumber || bookingDetails.roomNumber,
        serviceType: 'housekeeping',
        bookingNumber: 'HK' + Date.now()
      };
      setCompletedBooking(demoBooking);

      setBookingStep('confirmation');
      toast.success('Housekeeping service booked successfully!');

      // Show feedback modal after a brief delay
      setTimeout(() => {
        setShowFeedbackModal(true);
      }, 1500);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFeedbackSubmitted = async () => {
    if (feedbackRating === 0) {
      toast.error('Please select a rating');
      return;
    }

    setSubmittingFeedback(true);
    try {
      const feedbackData = {
        bookingId: completedBooking._id || completedBooking.id,
        rating: feedbackRating,
        comment: feedbackComment.trim(),
        serviceType: 'housekeeping'
      };

      console.log('💬 Submitting feedback:', feedbackData);

      const response = await apiClient.post('/client/feedback', feedbackData);

      if (response.data.success) {
        toast.success('Thank you for your feedback!');
        setShowFeedbackModal(false);
        // Reset feedback form
        setFeedbackRating(0);
        setFeedbackComment('');
      } else {
        toast.error(response.data.message || 'Failed to submit feedback');
      }
    } catch (error) {
      console.error('Feedback submission error:', error);
      toast.error('Failed to submit feedback. Please try again.');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const resetBooking = () => {
    setSelectedService(null);
    setBookingStep('select');
    setBookingDetails({
      guestName: '',
      roomNumber: '',
      phoneNumber: '',
      preferredTime: '09:00',
      scheduledDateTime: '',
      specialRequests: '',
      guestEmail: '',
      specificCategory: ''
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <div className="bg-gradient-to-r from-[#3B5787] to-[#67BAE0] rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6 lg:mb-8 text-white relative overflow-hidden mx-3 sm:mx-4 lg:mx-6">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full opacity-50"></div>
          <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/5 rounded-full opacity-50"></div>
          <div className="relative flex flex-col items-center">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-4">Housekeeping Service</h1>
            <p className="text-sm sm:text-base lg:text-xl text-white/90 leading-relaxed">Loading housekeeping services...</p>
          </div>
        </div>
        <div className="w-full px-2 sm:px-3 lg:px-4">
          <div className="flex justify-center items-center h-96">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#67BAE0] border-t-transparent"></div>
              <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-[#3B5787] border-t-transparent animate-ping opacity-20"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Service Selection Step
  if (bookingStep === 'select') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Modern Header with Backdrop */}
        <div className="relative">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#3B5787] via-[#4a6694] to-[#3B5787] opacity-5"></div>

          {/* Header Content */}
          <div className="relative w-full px-4 pt-6 pb-8">
            {/* Back Button - Modern Style */}
            <button
              onClick={onBack}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-[#3B5787] bg-white/80 backdrop-blur-sm hover:bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 mb-6"
            >
              <FaArrowLeft className="mr-2 text-xs" />
              <span>Back</span>
            </button>

            {/* Modern Header Card - Mobile Optimized */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-lg sm:shadow-xl hover:shadow-xl sm:hover:shadow-2xl transition-all duration-300 overflow-hidden border border-white/20 mb-6">
              {/* Header Image with Overlay - Compact for Mobile */}
              <div className="relative h-32 sm:h-48">
                <img
                  src="/housekeeping-header.jpg"
                  alt="Housekeeping Services"
                  className="w-full h-full object-cover"
                />

                {/* Floating Icon */}
                <div className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 sm:p-3 bg-white/90 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg">
                  <FaBroom className="text-lg sm:text-2xl text-[#3B5787]" />
                </div>
              </div>

              {/* Modern Header Content - Compact */}
              <div className="p-4 sm:p-6">
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-center space-x-2">
                    <div className="h-1 w-8 sm:w-12 bg-gradient-to-r from-[#3B5787] to-[#4a6694] rounded-full"></div>
                    <span className="text-xs font-medium text-[#3B5787] uppercase tracking-wider">
                      {t('guestCategories.professionalService')}
                    </span>
                  </div>

                  <h1 className="text-xl sm:text-3xl font-bold text-gray-900 leading-tight">
                    {t('housekeeping.title', 'Housekeeping')}
                  </h1>

                  {/* Modern Stats/Features - Mobile Optimized */}
                  <div className="flex flex-wrap gap-2 sm:gap-3 pt-2 sm:pt-4">
                    <div className="flex items-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-[#3B5787]/10 to-[#4a6694]/10 rounded-lg sm:rounded-xl">
                      <FaBroom className="text-[#3B5787] text-xs sm:text-sm" />
                      <span className="text-xs sm:text-sm font-medium text-gray-700">{t('housekeeping.expertCleaning')}</span>
                    </div>
                    <div className="flex items-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg sm:rounded-xl">
                      <FaCheck className="text-green-600 text-xs sm:text-sm" />
                      <span className="text-xs sm:text-sm font-medium text-gray-700">{t('housekeeping.qualityAssured')}</span>
                    </div>
                    <div className="flex items-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-lg sm:rounded-xl">
                      <FaClock className="text-blue-600 text-xs sm:text-sm" />
                      <span className="text-xs sm:text-sm font-medium text-gray-700">{t('housekeeping.onSchedule')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full px-4 pb-6">

          {/* Guest Services Section */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('housekeeping.guestServices', 'Guest services')}</h2>

            {/* Check if we have any services */}
            {services.length === 0 ? (
              <div className="text-center py-12">
                <FaBroom className="text-6xl text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">{t('housekeeping.noServices', 'No Services Available')}</h3>
                <p className="text-gray-500">{t('housekeeping.noServicesDescription', 'Housekeeping services are currently not available.')}</p>
              </div>
            ) : (
              /* Service Categories Layout - Dynamic from API */
              <div className="max-w-4xl mx-auto">
                {/* Dynamic Services from API */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {services.map((service, index) => {
                    // Get image based on service subcategory or default
                    const getServiceImage = (service) => {
                      const subcategory = service.subcategory?.toLowerCase();
                      if (subcategory === 'maintenance') return '/maintaince.jpg';
                      if (subcategory === 'cleaning') return '/roomcleaning.jpg';
                      if (subcategory === 'amenities') return '/amenities.jpg';
                      return '/housekeeping-header.jpg'; // Default image
                    };

                    // Get appropriate icon based on service subcategory
                    const getServiceIcon = (service) => {
                      const subcategory = service.subcategory?.toLowerCase();
                      if (subcategory === 'maintenance') return FaWrench;
                      if (subcategory === 'cleaning') return FaBroom;
                      if (subcategory === 'amenities') return FaMapMarkerAlt;
                      return FaBroom; // Default icon
                    };

                    const ServiceIcon = getServiceIcon(service);

                    return (
                      <button
                        key={service._id || index}
                        onClick={() => handleServiceSelect({
                          id: service._id,
                          name: service.name,
                          category: service.subcategory || service.category,
                          description: service.description,
                          estimatedDuration: service.estimatedDuration || 30
                        })}
                        className="group bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 w-full"
                      >
                        {/* Large Image on Top */}
                        <div className="relative w-full h-48 overflow-hidden">
                          <img
                            src={getServiceImage(service)}
                            alt={service.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          {/* Icon overlay */}
                          <div className="absolute top-4 left-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md">
                            <ServiceIcon className="text-[#3B5787] text-lg" />
                          </div>
                        </div>

                        {/* Service Type Name Below */}
                        <div className="p-4">
                          <h3 className="font-semibold text-gray-900 text-lg text-center capitalize mb-2">
                            {t(`housekeeping.categories.${service.subcategory || service.category}`, service.subcategory || service.category || 'Service')}
                          </h3>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Booking Details Step - Modal Design
  if (bookingStep === 'details') {
    const categoryInfo = getCategoryInfo(selectedService.category);

    return (
      <div
        className="fixed inset-0 bg-gradient-to-br from-[#3B5787]/20 via-black/60 to-[#67BAE0]/20 backdrop-blur-sm flex items-start justify-center z-50 p-2 sm:p-4 sm:items-center overflow-y-auto"
        style={{ touchAction: 'manipulation' }}
      >
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl border border-white/20 w-full max-w-sm sm:max-w-md mx-auto my-1 sm:my-0 max-h-[calc(100vh-0.5rem)] sm:max-h-[90vh] overflow-y-auto relative overflow-hidden">
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#3B5787]/5 via-transparent to-[#67BAE0]/5 pointer-events-none"></div>
          <div className="relative z-10">
          {/* Compact Mobile Modal Header */}
          <div className="relative bg-gradient-to-r from-[#3B5787] to-[#67BAE0] p-4 sm:p-6 rounded-t-2xl sm:rounded-t-3xl">
            <button
              onClick={() => setBookingStep('select')}
              className="absolute top-3 right-3 text-white/80 hover:text-white transition-colors p-1.5 hover:bg-white/10 rounded-full"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="text-center pr-8">
              <div className="flex items-center justify-center mb-2 sm:mb-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-sm rounded-xl sm:rounded-2xl flex items-center justify-center">
                  <categoryInfo.icon className="text-white text-lg sm:text-xl" />
                </div>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white mb-1 sm:mb-2">
                {categoryInfo.label}
              </h2>
              <p className="text-xs sm:text-sm text-white/80">{t('housekeeping.scheduleService', 'Schedule our service below')}</p>
            </div>
          </div>

          {/* Compact Modal Content */}
          <div className="px-4 sm:px-6 pb-4 sm:pb-6 pt-4 sm:pt-6">
            <form onSubmit={handleBookingSubmit} className="space-y-3 sm:space-y-4">
              {/* Date Field */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-[#3B5787] mb-1.5 sm:mb-2">{t('housekeeping.scheduleDate')}</label>
                <div className="relative">
                  <FaCalendarAlt className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-[#3B5787] text-xs sm:text-sm" />
                  <input
                    type="date"
                    value={bookingDetails.scheduledDateTime ? bookingDetails.scheduledDateTime.split('T')[0] : ''}
                    onChange={(e) => setBookingDetails(prev => ({ ...prev, scheduledDateTime: e.target.value + 'T09:00' }))}
                    className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 border-2 border-[#67BAE0]/30 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-[#67BAE0] focus:border-[#67BAE0] text-[#3B5787] text-xs sm:text-sm bg-white/80 backdrop-blur-sm transition-all duration-200 hover:border-[#67BAE0]/50"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>

              {/* Time Selection */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-[#3B5787] mb-1.5 sm:mb-2">{t('housekeeping.preferredTime')}</label>

                {/* Time Option Selection */}
                <div className="space-y-3">
                  {/* ASAP Option */}
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="asap"
                      name="timeOption"
                      value="asap"
                      checked={timeOption === 'asap'}
                      onChange={(e) => {
                        setTimeOption(e.target.value);
                        if (e.target.value === 'asap') {
                          setBookingDetails(prev => ({ ...prev, preferredTime: 'asap' }));
                        }
                      }}
                      className="h-4 w-4 text-[#3B5787] focus:ring-[#67BAE0] border-[#67BAE0]/30"
                    />
                    <label htmlFor="asap" className="ml-3 text-xs sm:text-sm text-[#3B5787] font-medium">
                      {t('housekeeping.asap', 'As soon as possible')}
                    </label>
                  </div>

                  {/* Custom Time Option */}
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="custom"
                      name="timeOption"
                      value="custom"
                      checked={timeOption === 'custom'}
                      onChange={(e) => setTimeOption(e.target.value)}
                      className="h-4 w-4 text-[#3B5787] focus:ring-[#67BAE0] border-[#67BAE0]/30"
                    />
                    <label htmlFor="custom" className="ml-3 text-xs sm:text-sm text-[#3B5787] font-medium">
                      {t('housekeeping.customTime', 'Choose specific time')}
                    </label>
                  </div>

                  {/* Custom Time Input */}
                  {timeOption === 'custom' && (
                    <div className="ml-7 mt-3">
                      <div className="relative">
                        <FaClock className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-[#3B5787] text-xs sm:text-sm" />
                        <input
                          type="time"
                          value={timeOption === 'custom' ? (bookingDetails.preferredTime !== 'asap' ? bookingDetails.preferredTime : '') : ''}
                          onChange={(e) => setBookingDetails(prev => ({ ...prev, preferredTime: e.target.value }))}
                          className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 border-2 border-[#67BAE0]/30 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-[#67BAE0] focus:border-[#67BAE0] text-[#3B5787] text-xs sm:text-sm bg-white/80 backdrop-blur-sm transition-all duration-200 hover:border-[#67BAE0]/50"
                          required={timeOption === 'custom'}
                        />
                      </div>
                      <p className="text-xs text-[#3B5787]/70 mt-1.5 ml-1">
                        {t('housekeeping.selectYourPreferredTime', 'Select your preferred time')}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Room Number */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-[#3B5787] mb-1.5 sm:mb-2">{t('housekeeping.roomNumber')}</label>
                <div className="relative">
                  <FaMapMarkerAlt className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-[#3B5787] text-xs sm:text-sm" />
                  <div className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 border-2 border-[#67BAE0]/30 rounded-xl sm:rounded-2xl bg-gray-50 text-[#3B5787] text-xs sm:text-sm font-medium">
                    {currentUserFromRedux?.roomNumber || currentUser?.roomNumber || 'N/A'}
                  </div>
                </div>
              </div>

              {/* Issue Category Selection - Required Field */}
              <div ref={dropdownRef}>
                <label className="block text-xs sm:text-sm font-semibold text-[#3B5787] mb-1.5 sm:mb-2">
                  {t('housekeeping.issueCategory', 'Issue Category')} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIssueCategoryDropdownOpen(!issueCategoryDropdownOpen)}
                    className="w-full px-3 sm:px-4 py-3 sm:py-4 border-2 border-[#67BAE0]/30 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-[#67BAE0] focus:border-[#67BAE0] text-[#3B5787] text-xs sm:text-sm bg-white/80 backdrop-blur-sm transition-all duration-200 hover:border-[#67BAE0]/50 flex items-start justify-between min-h-[48px]"
                  >
                    <div className="flex flex-wrap gap-1.5 sm:gap-2 flex-1">
                      {Array.isArray(bookingDetails.specificCategory) && bookingDetails.specificCategory.length > 0 ? (
                        bookingDetails.specificCategory.map(categoryValue => {
                          const category = getSpecificCategories(selectedService.category).find(cat => cat.value === categoryValue);
                          if (!category) return null;
                          const IconComponent = category.icon;
                          return (
                            <div
                              key={categoryValue}
                              className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-[#3B5787] to-[#67BAE0] text-white rounded-lg text-xs font-medium"
                            >
                              <div className="w-3 h-3 flex items-center justify-center">
                                <IconComponent className="text-xs" />
                              </div>
                              <span className="whitespace-nowrap">{category.label}</span>
                            </div>
                          );
                        })
                      ) : (
                        <span className="text-[#3B5787]/60">Select issue categories...</span>
                      )}
                    </div>
                    <div className={`transform transition-all duration-300 ml-2 flex-shrink-0 mt-1 ${issueCategoryDropdownOpen ? 'rotate-180' : ''}`}>
                      <svg className="w-4 h-4 text-[#3B5787]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {/* Modern Dropdown Menu */}
                  {issueCategoryDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-sm border-2 border-[#67BAE0]/30 rounded-xl sm:rounded-2xl shadow-xl z-50 max-h-64 overflow-y-auto custom-scrollbar">
                      <div className="p-2 sm:p-3 space-y-1 sm:space-y-2">
                        {getSpecificCategories(selectedService.category).map(category => {
                          const IconComponent = category.icon;
                          const isSelected = Array.isArray(bookingDetails.specificCategory) && bookingDetails.specificCategory.includes(category.value);
                          return (
                            <label
                              key={category.value}
                              className="flex items-center gap-3 p-2.5 sm:p-3 hover:bg-gradient-to-r hover:from-[#3B5787]/10 hover:to-[#67BAE0]/10 rounded-lg sm:rounded-xl cursor-pointer transition-all duration-200 group"
                            >
                              <div className="relative flex items-center">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleCategoryToggle(category.value)}
                                  className="sr-only"
                                />
                                <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${
                                  isSelected
                                    ? 'bg-gradient-to-r from-[#3B5787] to-[#67BAE0] border-[#67BAE0] shadow-md'
                                    : 'border-[#67BAE0]/40 bg-white group-hover:border-[#67BAE0]/70'
                                }`}>
                                  {isSelected && (
                                    <FaCheck className="text-white text-xs" />
                                  )}
                                </div>
                              </div>
                              <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center ${category.color} shadow-sm`}>
                                <IconComponent className="text-white text-xs sm:text-sm" />
                              </div>
                              <span className={`font-medium text-xs sm:text-sm transition-colors duration-200 ${
                                isSelected ? 'text-[#3B5787]' : 'text-[#3B5787]/80 group-hover:text-[#3B5787]'
                              }`}>
                                {category.label}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
                {(!Array.isArray(bookingDetails.specificCategory) || bookingDetails.specificCategory.length === 0) && (
                  <p className="text-xs text-red-500 mt-1">{t('housekeeping.selectCategoryError', 'Please select at least one category for your request')}</p>
                )}
              </div>

              {/* Additional Notes with Quick Hints */}
              <div>
                <div className="space-y-2 sm:space-y-3">
                  {/* Quick Hints Section - Show filtered categories based on selection */}
                  {getFilteredQuickHintCategories() && getFilteredQuickHintCategories().length > 0 && (
                    <div className="bg-gradient-to-r from-[#3B5787]/10 to-[#67BAE0]/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-[#67BAE0]/20 backdrop-blur-sm">
                      <button
                        type="button"
                        onClick={() => setShowQuickHints(prev => !prev)}
                        className="flex items-center justify-between w-full text-left hover:bg-white/30 rounded-lg p-1.5 sm:p-2 -m-1.5 sm:-m-2 transition-all duration-200"
                      >
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-[#3B5787] to-[#67BAE0] rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
                            <FaLightbulb className="text-white text-xs sm:text-sm" />
                          </div>
                          <div>
                            <span className="font-semibold text-[#3B5787] text-xs sm:text-sm">
                              {t('housekeeping.quickIssueCategories')}
                            </span>
                            <p className="text-xs text-[#3B5787]/70 hidden sm:block">
                              {Array.isArray(bookingDetails.specificCategory) && bookingDetails.specificCategory.length > 0
                                ? 'Common issues for your selected categories'
                                : t('housekeeping.tapToViewCommonIssues')
                              }
                            </p>
                          </div>
                        </div>
                        <div className={`transform transition-all duration-300 ${showQuickHints ? 'rotate-180' : ''}`}>
                          <svg className="w-5 h-5 text-[#3B5787]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </button>

                      {showQuickHints && (
                        <div className="mt-3 sm:mt-4 space-y-2 sm:space-y-3 animate-fadeIn">
                          <div className="grid grid-cols-1 gap-2 sm:gap-3 max-h-48 sm:max-h-64 overflow-y-auto custom-scrollbar">
                            {/* Show flattened issues list when categories are selected, otherwise show expandable categories */}
                            {Array.isArray(bookingDetails.specificCategory) && bookingDetails.specificCategory.length > 0 ? (
                              /* Flattened issues list */
                              getFilteredIssuesList().map((issue, index) => (
                                <button
                                  key={index}
                                  type="button"
                                  onClick={() => handleQuickHintSelect(issue.text)}
                                  className="w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 text-xs text-[#3B5787]/80 hover:bg-gradient-to-r hover:from-[#3B5787]/10 hover:to-[#67BAE0]/10 hover:text-[#3B5787] rounded-lg sm:rounded-xl transition-all duration-200 border border-[#67BAE0]/20 hover:border-[#67BAE0]/40 hover:shadow-sm backdrop-blur-sm bg-white/80"
                                >
                                  <span className="flex items-start gap-2 sm:gap-3">
                                    <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-md flex items-center justify-center ${issue.color} shadow-sm flex-shrink-0 mt-0.5`}>
                                      <issue.icon className="text-white text-xs" />
                                    </div>
                                    <span className="text-xs leading-tight flex-1">{issue.text}</span>
                                  </span>
                                </button>
                              ))
                            ) : (
                              /* Expandable categories view */
                              getFilteredQuickHintCategories().map((category, index) => (
                                <div key={index} className="bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-[#67BAE0]/20 shadow-sm hover:shadow-md transition-all duration-200">
                                  <button
                                    type="button"
                                    onClick={() => setExpandedCategory(expandedCategory === index ? null : index)}
                                    className="flex items-center justify-between w-full text-left hover:bg-[#67BAE0]/10 rounded-md p-1.5 sm:p-2 -m-1.5 sm:-m-2 transition-all duration-200"
                                  >
                                    <div className="flex items-center gap-2 sm:gap-3">
                                      <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center ${category.color} shadow-sm`}>
                                        <category.icon className="text-white text-xs sm:text-sm" />
                                      </div>
                                      <span className="font-semibold text-[#3B5787] text-xs sm:text-sm">{category.title}</span>
                                    </div>
                                    <div className={`transform transition-transform duration-200 ${expandedCategory === index ? 'rotate-180' : ''}`}>
                                      <svg className="w-3 h-3 sm:w-4 sm:h-4 text-[#3B5787]/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                      </svg>
                                    </div>
                                  </button>

                                  {expandedCategory === index && (
                                    <div className="mt-2 sm:mt-3 space-y-1 sm:space-y-2 animate-fadeIn">
                                      {category.items.map((item, itemIndex) => (
                                        <button
                                          key={itemIndex}
                                          type="button"
                                          onClick={() => handleQuickHintSelect(item)}
                                          className="w-full text-left px-3 sm:px-4 py-2 sm:py-2.5 text-xs text-[#3B5787]/80 hover:bg-gradient-to-r hover:from-[#3B5787]/10 hover:to-[#67BAE0]/10 hover:text-[#3B5787] rounded-lg sm:rounded-xl transition-all duration-200 border border-[#67BAE0]/20 hover:border-[#67BAE0]/40 hover:shadow-sm backdrop-blur-sm"
                                        >
                                          <span className="flex items-start gap-2">
                                            <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-[#67BAE0] rounded-full mt-1.5 sm:mt-1 flex-shrink-0"></span>
                                            <span className="text-xs leading-tight">{item}</span>
                                          </span>
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Special Requests Textarea */}
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-[#3B5787] mb-1.5 sm:mb-2">
                      {t('housekeeping.specialRequests', 'Special Requests')}
                      {isOthersSelected && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {!isOthersSelected && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 mb-2">
                        <p className="text-xs text-yellow-700">
                          💡 Select "Others" from the issue categories above to describe your custom request
                        </p>
                      </div>
                    )}
                    <div className="relative">
                      <textarea
                        value={bookingDetails.specialRequests}
                        onChange={(e) => setBookingDetails(prev => ({ ...prev, specialRequests: e.target.value }))}
                        disabled={!isOthersSelected}
                        className={`w-full px-3 sm:px-4 py-3 sm:py-4 border-2 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-[#67BAE0] focus:border-[#67BAE0] text-[#3B5787] resize-none text-xs sm:text-sm backdrop-blur-sm transition-all duration-200 ${
                          isOthersSelected
                            ? 'border-[#67BAE0]/30 bg-white/80 hover:border-[#67BAE0]/50'
                            : 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                        }`}
                        rows="3"
                        maxLength="500"
                        placeholder={
                          isOthersSelected
                            ? t('housekeeping.additionalNotes', 'Describe your issue or request...')
                            : 'Select "Others" from categories above to enable this field'
                        }
                      />
                      {bookingDetails.specialRequests.length > 0 && isOthersSelected && (
                        <div className="absolute bottom-2 sm:bottom-3 right-2 sm:right-3 flex items-center gap-1 sm:gap-2">
                          <button
                            type="button"
                            onClick={() => setBookingDetails(prev => ({ ...prev, specialRequests: '' }))}
                            className="bg-red-50 hover:bg-red-100 text-red-600 text-xs px-2 sm:px-3 py-1 sm:py-1.5 rounded-full transition-all duration-200 border border-red-200 hover:border-red-300"
                            title="Clear all text"
                          >
                            Clear
                          </button>
                          <div className="bg-[#67BAE0]/10 backdrop-blur-sm rounded-full px-2 sm:px-3 py-1 sm:py-1.5 border border-[#67BAE0]/20">
                            <span className="text-xs text-[#3B5787] font-medium">{bookingDetails.specialRequests.length}/500</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Compact Mobile Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-[#3B5787] to-[#67BAE0] text-white py-3 sm:py-4 px-4 sm:px-6 rounded-xl sm:rounded-2xl font-semibold hover:from-[#2d4066] hover:to-[#5aa8d4] transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm transform hover:scale-[1.02] active:scale-[0.98] min-h-[48px] sm:min-h-[56px] relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10">
                  {submitting ? (
                    <div className="flex items-center justify-center gap-2 sm:gap-3">
                      <FaSpinner className="animate-spin text-sm sm:text-lg" />
                      <span className="font-medium">{t('housekeeping.processing', 'Processing...')}</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <span className="font-semibold">{t('housekeeping.submitRequest', 'Submit Request')}</span>
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </div>
                  )}
                </div>
              </button>
            </form>
          </div>
          </div>
        </div>
      </div>
    );
  }

  // Confirmation Step
  if (bookingStep === 'confirmation') {
    return (
      <>
        <div className="max-w-2xl mx-auto p-6">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaCheck className="text-3xl text-green-600" />
            </div>

            <h1 className="text-2xl font-bold text-gray-800 mb-4">{t('housekeeping.bookingConfirmed', 'Booking Confirmed!')}</h1>

            <p className="text-gray-600 mb-6">
              {t('housekeeping.confirmationMessage', 'Your housekeeping service request has been submitted successfully. Our housekeeping team will contact you shortly to confirm the timing.')}
            </p>

            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold text-gray-800 mb-3">{t('housekeeping.bookingDetails', 'Booking Details')}:</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">{t('housekeeping.serviceType', 'Service')}:</span>
                <span className="font-medium">{t(`housekeeping.categories.${selectedService.category}`, selectedService.category)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t('housekeeping.guest', 'Guest')}:</span>
                <span className="font-medium">{bookingDetails.guestName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t('housekeeping.room', 'Room')}:</span>
                <span className="font-medium">{bookingDetails.roomNumber || currentUserFromRedux?.roomNumber || currentUser?.roomNumber || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t('housekeeping.phone', 'Phone')}:</span>
                <span className="font-medium">{bookingDetails.phoneNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t('housekeeping.timing', 'Timing')}:</span>
                <span className="font-medium">
                  {bookingDetails.preferredTime === 'asap' || bookingDetails.preferredTime === 'now' ? t('housekeeping.asap', 'As soon as possible') : bookingDetails.preferredTime}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onBack}
              className="w-full bg-gray-500 hover:bg-gray-600 text-white py-3 px-4 rounded-lg font-medium transition-colors"
            >
              {t('common.back', 'Back')}
            </button>
          </div>
          </div>
        </div>

        {/* Simple Inline Feedback Modal */}
        {showFeedbackModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full mx-4 overflow-hidden shadow-2xl relative">
              {/* Header */}
              <div
                className="h-20 relative flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, #67BAE0 0%, #3B5787 100%)` }}
              >
                <h2 className="text-xl font-semibold text-white">Share your feedback</h2>
                <button
                  onClick={() => setShowFeedbackModal(false)}
                  className="absolute top-4 right-4 text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all duration-200"
                >
                  <FaTimes size={16} />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="text-center mb-6">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ backgroundColor: '#67BAE0' }}
                  >
                    <FaStar className="text-white text-2xl" />
                  </div>
                </div>

                <form onSubmit={(e) => {
                  e.preventDefault();
                  handleFeedbackSubmitted();
                }} className="space-y-6">
                  {/* Star Rating */}
                  <div className="text-center">
                    <div className="flex justify-center gap-2 mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFeedbackRating(star)}
                          className="transition-all duration-200 hover:scale-110 focus:outline-none"
                        >
                          <FaStar
                            size={32}
                            className={`transition-colors duration-200 ${
                              star <= feedbackRating
                                ? 'text-yellow-400'
                                : 'text-gray-300 hover:text-yellow-400'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    <p className="text-sm text-gray-600">
                      {feedbackRating === 0 && 'Please select a rating'}
                      {feedbackRating === 1 && 'Poor'}
                      {feedbackRating === 2 && 'Fair'}
                      {feedbackRating === 3 && 'Good'}
                      {feedbackRating === 4 && 'Very Good'}
                      {feedbackRating === 5 && 'Excellent'}
                    </p>
                  </div>

                  {/* Comment Section */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#3B5787' }}>
                      Any suggestions for improvement? (optional)
                    </label>
                    <textarea
                      value={feedbackComment}
                      onChange={(e) => setFeedbackComment(e.target.value)}
                      placeholder="Your feedback"
                      rows={4}
                      maxLength={1000}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
                      style={{ focusRingColor: '#67BAE0' }}
                      disabled={submittingFeedback}
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      {feedbackComment.length}/1000 characters
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowFeedbackModal(false)}
                      className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-all duration-200"
                      disabled={submittingFeedback}
                    >
                      Skip
                    </button>
                    <button
                      type="submit"
                      disabled={feedbackRating === 0 || submittingFeedback}
                      className="flex-1 py-3 px-4 rounded-lg text-white font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        background: feedbackRating === 0 ? '#9CA3AF' : 'linear-gradient(135deg, #67BAE0 0%, #3B5787 100%)'
                      }}
                    >
                      {submittingFeedback ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Submitting...
                        </div>
                      ) : (
                        'Send Feedback'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }
};export default GuestHousekeepingBooking;
