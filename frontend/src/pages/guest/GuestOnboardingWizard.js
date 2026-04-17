import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { HiArrowRight, HiArrowLeft, HiCheck, HiBriefcase, HiOutlineSun, HiOutlineMoon, HiHeart, HiHome, HiOfficeBuilding } from 'react-icons/hi';
import { selectCurrentUser, updateProfile } from '../../redux/slices/authSlice';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const GuestOnboardingWizard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  const { t } = useTranslation();

  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const parseInitTemp = (val) => {
    if (!val) return 22;
    if (typeof val === 'number') return val;
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
    if (typeof val === 'string') {
      if (val.includes('Cool')) return 19;
      if (val.includes('Warm')) return 24;
    }
    return 22;
  };

  // Form State
  const [formData, setFormData] = useState({
    idType: user?.idType || 'national_id',
    idNumber: user?.idNumber || '',
    dateOfBirth: user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
    preferences: {
      tripPurpose: user?.preferences?.tripPurpose || 'Leisure',
      roomPreferences: {
        temperature: parseInitTemp(user?.preferences?.roomPreferences?.temperature),
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
    { title: t('guestOnboarding.steps.welcome'), id: 'welcome' },
    { title: t('guestOnboarding.steps.personalInfo'), id: 'personal' },
    { title: t('guestOnboarding.steps.tripPurpose'), id: 'purpose' },
    { title: t('guestOnboarding.steps.roomComfort'), id: 'room' },
    { title: t('guestOnboarding.steps.foodAndBeverage'), id: 'food' },
    { title: t('guestOnboarding.steps.extraDetails'), id: 'extra' },
  ];

  // Options
  const purposes = [
    { value: 'Business', label: t('guestOnboarding.purposes.business'), icon: <HiBriefcase className="w-6 h-6" /> },
    { value: 'Leisure', label: t('guestOnboarding.purposes.leisure'), icon: <HiOutlineSun className="w-6 h-6" /> },
    { value: 'Family Vacation', label: t('guestOnboarding.purposes.familyVacation'), icon: <HiHome className="w-6 h-6" /> },
    { value: 'Honeymoon', label: t('guestOnboarding.purposes.honeymoon'), icon: <HiHeart className="w-6 h-6" /> },
    { value: 'Event/Conference', label: t('guestOnboarding.purposes.event'), icon: <HiOfficeBuilding className="w-6 h-6" /> },
    { value: 'Transit', label: t('guestOnboarding.purposes.transit'), icon: <HiArrowRight className="w-6 h-6" /> },
  ];

  const pillowTypes = [t('guestOnboarding.pillows.soft'), t('guestOnboarding.pillows.medium'), t('guestOnboarding.pillows.firm')];
  const temperatures = ['Cool (18-20°C)', 'Standard (21-22°C)', 'Warm (23-25°C)'];
  const floorPreferences = [t('guestOnboarding.floors.lower'), t('guestOnboarding.floors.any'), t('guestOnboarding.floors.higher')];
  const views = [t('guestOnboarding.views.any'), t('guestOnboarding.views.city'), t('guestOnboarding.views.pool'), t('guestOnboarding.views.nature')];

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
    // Validation for Personal Info step
    if (currentStep === 1) {
      if (!formData.idNumber?.trim() || !formData.dateOfBirth) {
        toast.error(t('guestOnboarding.messages.validationError'));
        return;
      }
    }

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
      
      toast.success(t('guestOnboarding.messages.saveSuccess'));
      
      // Navigate to hotel categories
      const hotelId = user?.selectedHotelId?._id || user?.selectedHotelId;
      if (hotelId) {
        navigate(`/hotels/${hotelId}/categories`, { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (error) {
      toast.error(t('guestOnboarding.messages.saveError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render Steps
  const renderWelcome = () => (
    <div className="text-center space-y-6 animate-fade-in-up">
      <div className="w-24 h-24 mx-auto bg-primary-light/20 rounded-full flex items-center justify-center mb-6">
        <span className="text-4xl">👋</span>
      </div>
      <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
        {t('guestOnboarding.welcomeStep.title', { name: user?.firstName })}
      </h2>
      <p className="text-lg text-gray-600 max-w-md mx-auto">
        {t('guestOnboarding.welcomeStep.subtitle')}
      </p>
    </div>
  );

  const renderPersonalInfo = () => (
    <div className="space-y-6 animate-fade-in-up w-full max-w-xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">{t('guestOnboarding.personalStep.title')}</h2>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('guestOnboarding.personalStep.idType')}</label>
          <div className="flex bg-gray-100 p-1 rounded-lg mb-4">
            <button
              onClick={() => setFormData(p => ({ ...p, idType: 'national_id' }))}
              className={`flex-1 py-2 px-2 text-sm font-medium rounded-md transition-all ${
                formData.idType === 'national_id'
                  ? 'bg-white shadow text-primary-light'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t('guestOnboarding.personalStep.nationalId')}
            </button>
            <button
              onClick={() => setFormData(p => ({ ...p, idType: 'passport' }))}
              className={`flex-1 py-2 px-2 text-sm font-medium rounded-md transition-all ${
                formData.idType === 'passport'
                  ? 'bg-white shadow text-primary-light'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t('guestOnboarding.personalStep.passport')}
            </button>
          </div>

          <label className="block text-sm font-medium text-gray-700 mb-2">
            {formData.idType === 'national_id' ? t('guestOnboarding.personalStep.nationalIdNumber') : t('guestOnboarding.personalStep.passportNumber')} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder={formData.idType === 'national_id' ? t('guestOnboarding.personalStep.enterNationalId') : t('guestOnboarding.personalStep.enterPassport')}
            value={formData.idNumber}
            onChange={(e) => setFormData(p => ({ ...p, idNumber: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-light focus:border-primary-light transition-all"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('guestOnboarding.personalStep.dateOfBirth')} <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => setFormData(p => ({ ...p, dateOfBirth: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-light focus:border-primary-light transition-all"
            required
          />
        </div>
      </div>
    </div>
  );

  const renderPurpose = () => (
    <div className="space-y-6 animate-fade-in-up">
      <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">{t('guestOnboarding.purposeStep.title')}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {purposes.map(purpose => (
          <button
            key={purpose.value}
            onClick={() => setFormData(p => ({ ...p, preferences: { ...p.preferences, tripPurpose: purpose.value } }))}
            className={`p-4 rounded-xl border-2 transition-all duration-300 flex flex-col items-center justify-center gap-3 hover:shadow-md ${
              formData.preferences.tripPurpose === purpose.value
                ? 'border-indigo-600 bg-blue-50 text-primary-light scale-105'
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
      <h2 className="text-2xl font-bold text-gray-900 text-center mb-4">{t('guestOnboarding.roomStep.title')}</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <label className="text-sm font-semibold text-gray-700 uppercase tracking-wider">{t('guestOnboarding.roomStep.temperature')}</label>
            <span className="text-primary-light font-bold bg-blue-50 px-3 py-1 rounded-full text-sm">
              {formData.preferences.roomPreferences.temperature}°C
            </span>
          </div>
          <div className="px-2">
            <input
              type="range"
              min="16"
              max="30"
              step="1"
              value={formData.preferences.roomPreferences.temperature}
              onChange={(e) => updateNestedState('roomPreferences', 'temperature', parseInt(e.target.value, 10))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-light"
            />
            <div className="flex justify-between mt-2 text-xs font-medium text-gray-400">
              <span>{t('guestOnboarding.roomStep.cool')}</span>
              <span>{t('guestOnboarding.roomStep.ideal')}</span>
              <span>{t('guestOnboarding.roomStep.warm')}</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-semibold text-gray-700 uppercase tracking-wider">{t('guestOnboarding.roomStep.pillowType')}</label>
          <div className="flex bg-gray-100 p-1 rounded-lg">
            {pillowTypes.map(pillow => (
              <button
                key={pillow}
                onClick={() => updateNestedState('roomPreferences', 'pillow', pillow)}
                className={`flex-1 py-2 px-2 text-sm font-medium rounded-md transition-all ${
                  formData.preferences.roomPreferences.pillow === pillow
                    ? 'bg-white shadow text-primary-light'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {pillow}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-semibold text-gray-700 uppercase tracking-wider">{t('guestOnboarding.roomStep.floorPreference')}</label>
          <div className="flex bg-gray-100 p-1 rounded-lg">
            {floorPreferences.map(floor => (
              <button
                key={floor}
                onClick={() => updateNestedState('roomPreferences', 'floor', floor)}
                className={`flex-1 py-2 px-2 text-sm font-medium rounded-md transition-all ${
                  formData.preferences.roomPreferences.floor === floor
                    ? 'bg-white shadow text-primary-light'
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
            <span>{t('guestOnboarding.roomStep.smokingRoom')}</span>
            <button 
              onClick={() => updateNestedState('roomPreferences', 'smoking', !formData.preferences.roomPreferences.smoking)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                formData.preferences.roomPreferences.smoking ? 'bg-primary-light' : 'bg-gray-300'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                formData.preferences.roomPreferences.smoking ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </label>
          <p className="text-xs text-gray-500">{t('guestOnboarding.roomStep.smokingDisclaimer')}</p>
        </div>
      </div>
    </div>
  );

  const renderFood = () => (
    <div className="space-y-8 animate-fade-in-up w-full max-w-xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 text-center mb-4">{t('guestOnboarding.foodStep.title')}</h2>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('guestOnboarding.foodStep.morningDrink.title')}</label>
          <select
            value={formData.preferences.foodAndBeverage.morningDrink}
            onChange={(e) => updateNestedState('foodAndBeverage', 'morningDrink', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-light focus:border-primary-light transition-all bg-white"
          >
            <option value="">{t('guestOnboarding.foodStep.morningDrink.placeholder')}</option>
            <option value="Black Coffee">{t('guestOnboarding.foodStep.morningDrink.blackCoffee')}</option>
            <option value="Coffee with Milk">{t('guestOnboarding.foodStep.morningDrink.coffeeMilk')}</option>
            <option value="Espresso">{t('guestOnboarding.foodStep.morningDrink.espresso')}</option>
            <option value="Latte / Cappuccino">{t('guestOnboarding.foodStep.morningDrink.latte')}</option>
            <option value="English Breakfast Tea">{t('guestOnboarding.foodStep.morningDrink.englishTea')}</option>
            <option value="Green Tea">{t('guestOnboarding.foodStep.morningDrink.greenTea')}</option>
            <option value="Herbal Tea">{t('guestOnboarding.foodStep.morningDrink.herbalTea')}</option>
            <option value="Orange Juice">{t('guestOnboarding.foodStep.morningDrink.orangeJuice')}</option>
            <option value="Hot Chocolate">{t('guestOnboarding.foodStep.morningDrink.hotChocolate')}</option>
            <option value="Water">{t('guestOnboarding.foodStep.morningDrink.water')}</option>
            <option value="No Preference">{t('guestOnboarding.foodStep.morningDrink.noPreference')}</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('guestOnboarding.foodStep.breakfastStyle.title')}</label>
          <select
            value={formData.preferences.foodAndBeverage.breakfastStyle}
            onChange={(e) => updateNestedState('foodAndBeverage', 'breakfastStyle', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-light focus:border-primary-light transition-all bg-white"
          >
            <option value="">{t('guestOnboarding.foodStep.breakfastStyle.placeholder')}</option>
            <option value="Continental">{t('guestOnboarding.foodStep.breakfastStyle.continental')}</option>
            <option value="Full English / American">{t('guestOnboarding.foodStep.breakfastStyle.american')}</option>
            <option value="Vegetarian">{t('guestOnboarding.foodStep.breakfastStyle.vegetarian')}</option>
            <option value="Vegan">{t('guestOnboarding.foodStep.breakfastStyle.vegan')}</option>
            <option value="Gluten-Free">{t('guestOnboarding.foodStep.breakfastStyle.glutenFree')}</option>
            <option value="Halal">{t('guestOnboarding.foodStep.breakfastStyle.halal')}</option>
            <option value="Kosher">{t('guestOnboarding.foodStep.breakfastStyle.kosher')}</option>
            <option value="Healthy / Low Calorie">{t('guestOnboarding.foodStep.breakfastStyle.healthy')}</option>
            <option value="No Preference">{t('guestOnboarding.foodStep.breakfastStyle.noPreference')}</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderExtra = () => (
    <div className="space-y-6 animate-fade-in-up w-full max-w-xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 text-center mb-4">{t('guestOnboarding.extraStep.title')}</h2>
      <p className="text-center text-gray-600 mb-6">{t('guestOnboarding.extraStep.subtitle')}</p>
      
      <textarea
        rows="4"
        placeholder={t('guestOnboarding.extraStep.placeholder')}
        value={formData.preferences.extraPersonalization}
        onChange={(e) => setFormData(p => ({ ...p, preferences: { ...p.preferences, extraPersonalization: e.target.value } }))}
        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-light focus:border-primary-light transition-all resize-none shadow-sm"
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -right-[10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-primary-light/20 to-modern-lightBlue/20 blur-3xl" />
        <div className="absolute -bottom-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-gradient-to-tr from-blue-200/40 to-primary-light/20 blur-3xl" />
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
                      ? 'bg-primary-light text-white shadow-lg shadow-primary-light' 
                      : 'bg-gray-200 text-gray-400'
                  }`}>
                    {index < currentStep ? <HiCheck className="w-5 h-5" /> : index + 1}
                  </div>
                  <span className={`absolute -bottom-6 text-xs whitespace-nowrap font-medium transition-opacity duration-300 ${
                    index <= currentStep ? 'text-primary-light' : 'text-gray-400'
                  } ${index === currentStep ? 'opacity-100' : 'hidden sm:block opacity-100 sm:opacity-100'}`}>
                    {step.title}
                  </span>
                </div>
              ))}
              {/* Connecting Line */}
              <div className="absolute top-4 left-0 w-full h-0.5 bg-gray-200 -z-0">
                <div 
                  className="h-full bg-primary-light transition-all duration-500 ease-in-out" 
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
              <HiArrowLeft className="mr-2 w-4 h-4" /> {t('guestOnboarding.actions.back')}
            </button>
            <button
              onClick={handleNext}
              disabled={isSubmitting}
              className="flex items-center px-8 py-3 bg-primary-light text-white rounded-full text-sm font-semibold shadow-lg shadow-primary-light/50 hover:bg-primary-light hover:shadow-primary-light transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t('guestOnboarding.actions.saving')}
                </span>
              ) : currentStep === steps.length - 1 ? (
                <>{t('guestOnboarding.actions.completeProfile')} <HiCheck className="ml-2 w-5 h-5" /></>
              ) : (
                <>{t('guestOnboarding.actions.nextStep')} <HiArrowRight className="ml-2 w-4 h-4" /></>
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
