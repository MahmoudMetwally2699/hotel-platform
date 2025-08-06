import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Custom hook for RTL (Right-to-Left) language support
 * Automatically handles direction changes for Arabic language
 */
const useRTL = () => {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  useEffect(() => {
    // Update document direction
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;

    // Add/remove RTL class to body for additional styling control
    if (isRTL) {
      document.body.classList.add('rtl');
    } else {
      document.body.classList.remove('rtl');
    }

    // Update Tailwind's direction classes
    const htmlElement = document.documentElement;
    if (isRTL) {
      htmlElement.classList.add('rtl');
    } else {
      htmlElement.classList.remove('rtl');
    }
  }, [isRTL, i18n.language]);

  return {
    isRTL,
    direction: isRTL ? 'rtl' : 'ltr',
    textAlign: isRTL ? 'text-right' : 'text-left',
    marginLeft: isRTL ? 'mr' : 'ml',
    marginRight: isRTL ? 'ml' : 'mr',
    paddingLeft: isRTL ? 'pr' : 'pl',
    paddingRight: isRTL ? 'pl' : 'pr',
    left: isRTL ? 'right' : 'left',
    right: isRTL ? 'left' : 'right'
  };
};

export default useRTL;
