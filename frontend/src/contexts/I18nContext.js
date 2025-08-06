import React, { createContext, useContext, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * i18n Context for managing localization across the application
 * Provides additional utilities and RTL support beyond react-i18next
 */
const I18nContext = createContext();

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};

export const I18nProvider = ({ children }) => {
  const { i18n, t } = useTranslation();
  const isRTL = i18n.language === 'ar';

  // Set document direction and language
  useEffect(() => {
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;

    // Add/remove RTL class to body
    if (isRTL) {
      document.body.classList.add('rtl');
    } else {
      document.body.classList.remove('rtl');
    }
  }, [isRTL, i18n.language]);

  // Helper functions for common RTL adaptations
  const rtlClasses = {
    textAlign: isRTL ? 'text-right' : 'text-left',
    marginLeft: (value = '') => isRTL ? `mr-${value}` : `ml-${value}`,
    marginRight: (value = '') => isRTL ? `ml-${value}` : `mr-${value}`,
    paddingLeft: (value = '') => isRTL ? `pr-${value}` : `pl-${value}`,
    paddingRight: (value = '') => isRTL ? `pl-${value}` : `pr-${value}`,
    left: isRTL ? 'right' : 'left',
    right: isRTL ? 'left' : 'right',
    borderLeft: isRTL ? 'border-r' : 'border-l',
    borderRight: isRTL ? 'border-l' : 'border-r',
    roundedLeft: isRTL ? 'rounded-r' : 'rounded-l',
    roundedRight: isRTL ? 'rounded-l' : 'rounded-r'
  };

  // Format numbers based on locale
  const formatNumber = (number, options = {}) => {
    const locale = i18n.language === 'ar' ? 'ar-SA' : 'en-US';
    return new Intl.NumberFormat(locale, options).format(number);
  };

  // Format currency based on locale
  const formatCurrency = (amount, currency = 'USD') => {
    const locale = i18n.language === 'ar' ? 'ar-SA' : 'en-US';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  // Format date based on locale
  const formatDate = (date, options = {}) => {
    const locale = i18n.language === 'ar' ? 'ar-SA' : 'en-US';
    return new Intl.DateTimeFormat(locale, options).format(new Date(date));
  };

  // Get localized text direction
  const getTextDirection = () => isRTL ? 'rtl' : 'ltr';

  // Get opposite direction (useful for icons that should not flip)
  const getOppositeDirection = () => isRTL ? 'ltr' : 'rtl';

  const value = {
    // React-i18next functions
    t,
    i18n,

    // RTL/Language info
    isRTL,
    currentLanguage: i18n.language,
    direction: getTextDirection(),
    oppositeDirection: getOppositeDirection(),

    // Helper classes for RTL
    rtlClasses,

    // Formatting functions
    formatNumber,
    formatCurrency,
    formatDate,

    // Language switching
    changeLanguage: i18n.changeLanguage,

    // Available languages
    languages: [
      { code: 'en', name: t('common.english'), nativeName: 'English' },
      { code: 'ar', name: t('common.arabic'), nativeName: 'العربية' }
    ]
  };

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
};

export default I18nProvider;
