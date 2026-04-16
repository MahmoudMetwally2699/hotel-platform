import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { HiArrowRight, HiArrowLeft, HiCheck, HiBriefcase, HiOutlineSun, HiOutlineMoon, HiHeart, HiHome, HiOfficeBuilding } from 'react-icons/hi';
import { selectCurrentUser, updateProfile } from '../../redux/slices/authSlice';
import { toast } from 'react-hot-toast';

const GuestOnboardingWizard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);

  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    idNumber: user?.idNumber || '',
    dateOfBirth: user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
    preferences: {
      tripPurpose: user?.preferences?.tripPurpose || 'Leisure',
      roomPreferences: {
        temperature: user?.preferences?.roomPreferences?.temperature || 'Standard',
        floor: user?.preferences?.roomPreferences?.floor || 'Any',
        smoking: user?.preferences?.roomPreferences?.smoking || false,
        view: user?.preferences?.roomPreferences?.view || 'Any',
        pillow: user?.preferences?.roomPreferences?.pillow || 'Medium',
        wakeup: user?.preferences?.roomPreferences?.wakeup || '',
      },
      foodAndBeverage: {
        breakfastStyle: user?.preferences?.foodAndBeverage?.breakfastStyle || '',
        morningDrink: user?.preferences?.foodAndBeverage?.morningDrink || '',
      },
      extraPersonalization: user?.preferences?.extraPersonalization || ''
    }
  });

  const steps = [
    { title: 'Welcome', id: 'welcome' },
    { title: 'Personal Info', id: 'personal' },
    { title: 'Trip Purpose', id: 'purpose' },
    { title: 'Room Comfort', id: 'room' },
    { title: 'Food & Beverage', id: 'food' },
    { title: 'Extra Details', id: 'extra' },
  ];

  // Options
  const purposes = [
    { value: 'Business', label: 'Business', icon: <HiBriefcase className="w-6 h-6" /> },
    { value: 'Leisure', label: 'Leisure', icon: <HiOutlineSun className="w-6 h-6" /> },
    { value: 'Family Vacation', label: 'Family Vacation', icon: <HiHome className="w-6 h-6" /> },
    { value: 'Honeymoon', label: 'Honeymoon', icon: <HiHeart className="w-6 h-6" /> },
    { value: 'Event/Conference', label: 'Event', icon: <HiOfficeBuilding className="w-6 h-6" /> },
    { value: 'Transit', label: 'Transit', icon: <HiArrowRight className="w-6 h-6" /> },
  ];

  const pillowTypes = ['Soft', 'Medium', 'Firm'];
  const temperatures = ['Cool (18-20°C)', 'Standard (21-22°C)', 'Warm (23-25°C)'];
  const floorPreferences = ['Lower', 'Any', 'Higher'];
  const views = ['Any', 'City', 'Pool', 'Nature'];

  // Handle Updates
  const updateNestedState = (category, field, value) => {
    setFormData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [category]: {
          ...prev.preferences[category],
          [field]: value
        }
      }
    }));
  };

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      await handleSubmit();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Set onboarding completed
      const payload = {
        ...formData,
        onboardingCompleted: true
      };

      await dispatch(updateProfile(payload)).unwrap();
      
      toast.success('Preferences saved successfully!');
      
      // Navigate to hotel categories
      const hotelId = user?.selectedHotelId?._id || user?.selectedHotelId;
      if (hotelId) {
        navigate(`/hotels/${hotelId}/categories`, { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (error) {
      toast.error('Failed to save preferences. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render Steps
  const renderWelcome = () => (
    <div className="text-center space-y-6 animate-fade-in-up">
      <div className="w-24 h-24 mx-auto bg-indigo-100 rounded-full flex items-center justify-center mb-6">
        <span className="text-4xl">👋</span>
      </div>
      <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
        Welcome, {user?.firstName}!
      </h2>
      <p className="text-lg text-gray-600 max-w-md mx-auto">
        We're thrilled to have you. Let's quickly personalize your stay with a few questions to ensure everything is perfect.
      </p>
    </div>
  );

  const renderPersonalInfo = () => (
    <div className="space-y-6 animate-fade-in-up w-full max-w-xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Personal Details</h2>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">National ID / Passport</label>
          <input
            type="text"
            placeholder="Enter your ID or Passport number"
            value={formData.idNumber}
            onChange={(e) => setFormData(p => ({ ...p, idNumber: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
          <input
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => setFormData(p => ({ ...p, dateOfBirth: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
          />
        </div>
      </div>
    </div>
  );

  const renderPurpose = () => (
    <div className="space-y-6 animate-fade-in-up">
      <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">What brings you here?</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {purposes.map(purpose => (
          <button
            key={purpose.value}
            onClick={() => setFormData(p => ({ ...p, preferences: { ...p.preferences, tripPurpose: purpose.value } }))}
            className={`p-4 rounded-xl border-2 transition-all duration-300 flex flex-col items-center justify-center gap-3 hover:shadow-md ${
              formData.preferences.tripPurpose === purpose.value
                ? 'border-indigo-600 bg-indigo-50 text-indigo-700 scale-105'
                : 'border-gray-200 hover:border-indigo-300 bg-white text-gray-600'
            }`}
          >
            {purpose.icon}
            <span className="font-medium text-sm">{purpose.label}</span>
          </button>
        ))}
      </div>
    </div>
  );

  const renderRoomComfort = () => (
    <div className="space-y-8 animate-fade-in-up w-full max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 text-center mb-4">Your Room Comfort</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        <div className="space-y-3">
          <label className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Temperature</label>
          <div className="flex bg-gray-100 p-1 rounded-lg">
            {temperatures.map(temp => (
              <button
                key={temp}
                onClick={() => updateNestedState('roomPreferences', 'temperature', temp)}
                className={`flex-1 py-2 px-1 text-xs sm:text-sm font-medium rounded-md transition-all ${
                  formData.preferences.roomPreferences.temperature === temp
                    ? 'bg-white shadow text-indigo-700'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {temp.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Pillow Type</label>
          <div className="flex bg-gray-100 p-1 rounded-lg">
            {pillowTypes.map(pillow => (
              <button
                key={pillow}
                onClick={() => updateNestedState('roomPreferences', 'pillow', pillow)}
                className={`flex-1 py-2 px-2 text-sm font-medium rounded-md transition-all ${
                  formData.preferences.roomPreferences.pillow === pillow
                    ? 'bg-white shadow text-indigo-700'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {pillow}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Floor Preference</label>
          <div className="flex bg-gray-100 p-1 rounded-lg">
            {floorPreferences.map(floor => (
              <button
                key={floor}
                onClick={() => updateNestedState('roomPreferences', 'floor', floor)}
                className={`flex-1 py-2 px-2 text-sm font-medium rounded-md transition-all ${
                  formData.preferences.roomPreferences.floor === floor
                    ? 'bg-white shadow text-indigo-700'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {floor}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-semibold text-gray-700 uppercase tracking-wider flex justify-between">
            <span>Smoking Room</span>
            <button 
              onClick={() => updateNestedState('roomPreferences', 'smoking', !formData.preferences.roomPreferences.smoking)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                formData.preferences.roomPreferences.smoking ? 'bg-indigo-600' : 'bg-gray-300'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                formData.preferences.roomPreferences.smoking ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </label>
          <p className="text-xs text-gray-500">Subject to hotel availability and policies.</p>
        </div>
      </div>
    </div>
  );

  const renderFood = () => (
    <div className="space-y-8 animate-fade-in-up w-full max-w-xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 text-center mb-4">Food & Beverage</h2>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Favorite Morning Drink</label>
          <input
            type="text"
            placeholder="e.g. Black Coffee, English Breakfast Tea, Orange Juice"
            value={formData.preferences.foodAndBeverage.morningDrink}
            onChange={(e) => updateNestedState('foodAndBeverage', 'morningDrink', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Dietary Preferences / Breakfast Style</label>
          <input
            type="text"
            placeholder="e.g. Vegetarian, Gluten-Free, Continental"
            value={formData.preferences.foodAndBeverage.breakfastStyle}
            onChange={(e) => updateNestedState('foodAndBeverage', 'breakfastStyle', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
          />
        </div>
      </div>
    </div>
  );

  const renderExtra = () => (
    <div className="space-y-6 animate-fade-in-up w-full max-w-xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 text-center mb-4">Extra Personalization</h2>
      <p className="text-center text-gray-600 mb-6">Anything else we can do to make your stay perfect?</p>
      
      <textarea
        rows="4"
        placeholder="Anniversary celebration, extra towels, early check-in request..."
        value={formData.preferences.extraPersonalization}
        onChange={(e) => setFormData(p => ({ ...p, preferences: { ...p.preferences, extraPersonalization: e.target.value } }))}
        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none shadow-sm"
      ></textarea>
    </div>
  );

  const renderCurrentStep = () => {
    switch(currentStep) {
      case 0: return renderWelcome();
      case 1: return renderPersonalInfo();
      case 2: return renderPurpose();
      case 3: return renderRoomComfort();
      case 4: return renderFood();
      case 5: return renderExtra();
      default: return renderWelcome();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -right-[10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-indigo-200/40 to-purple-200/40 blur-3xl" />
        <div className="absolute -bottom-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-gradient-to-tr from-blue-200/40 to-indigo-200/40 blur-3xl" />
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-3xl relative z-10">
        <div className="bg-white/80 backdrop-blur-xl py-10 px-6 shadow-2xl sm:rounded-3xl sm:px-12 border border-white/50">
          
          {/* Progress Bar */}
          <div className="mb-12">
            <div className="flex items-center justify-between relative">
              {steps.map((step, index) => (
                <div key={step.id} className="flex flex-col items-center relative z-10">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 ${
                    index <= currentStep 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-300' 
                      : 'bg-gray-200 text-gray-400'
                  }`}>
                    {index < currentStep ? <HiCheck className="w-5 h-5" /> : index + 1}
                  </div>
                  <span className={`absolute -bottom-6 text-xs whitespace-nowrap font-medium transition-opacity duration-300 ${
                    index <= currentStep ? 'text-indigo-800' : 'text-gray-400'
                  } ${index === currentStep ? 'opacity-100' : 'hidden sm:block opacity-100 sm:opacity-100'}`}>
                    {step.title}
                  </span>
                </div>
              ))}
              {/* Connecting Line */}
              <div className="absolute top-4 left-0 w-full h-0.5 bg-gray-200 -z-0">
                <div 
                  className="h-full bg-indigo-600 transition-all duration-500 ease-in-out" 
                  style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="min-h-[300px] flex items-center justify-center">
            {renderCurrentStep()}
          </div>

          {/* Actions */}
          <div className="mt-12 flex justify-between items-center border-t border-gray-100 pt-6">
            <button
              onClick={handlePrev}
              disabled={currentStep === 0 || isSubmitting}
              className={`flex items-center px-6 py-2.5 rounded-full text-sm font-medium transition-all ${
                currentStep === 0 
                  ? 'text-gray-300 cursor-not-allowed opacity-0' 
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <HiArrowLeft className="mr-2 w-4 h-4" /> Back
            </button>
            <button
              onClick={handleNext}
              disabled={isSubmitting}
              className="flex items-center px-8 py-3 bg-indigo-600 text-white rounded-full text-sm font-semibold shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:shadow-indigo-300 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </span>
              ) : currentStep === steps.length - 1 ? (
                <>Complete Profile <HiCheck className="ml-2 w-5 h-5" /></>
              ) : (
                <>Next Step <HiArrowRight className="ml-2 w-4 h-4" /></>
              )}
            </button>
          </div>
        </div>
      </div>
      
      <style>{`
        .animate-fade-in-up {
          animation: fadeInUp 0.5s ease-out forwards;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default GuestOnboardingWizard;
