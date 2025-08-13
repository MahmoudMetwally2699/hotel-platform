/**
 * Currency Utility
 * Handles currency formatting for Egyptian Pound (EGP)
 */

/**
 * Format price with Egyptian Pound currency
 * @param {number} price - The price to format
 * @param {string} locale - The locale to use for formatting (default: 'ar-EG' for Arabic Egypt)
 * @returns {string} - Formatted price string
 */
export const formatPrice = (price, locale = 'ar-EG') => {
  if (price === null || price === undefined || isNaN(price)) {
    return 'غير محدد'; // "Not specified" in Arabic
  }

  const numericPrice = parseFloat(price);

  try {
    // Format with Egyptian Pound currency
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numericPrice);
  } catch (error) {
    // Fallback formatting if Intl is not supported
    return `${numericPrice.toFixed(2)} ج.م`;
  }
};

/**
 * Format price with Egyptian Pound currency for English locale
 * @param {number} price - The price to format
 * @returns {string} - Formatted price string
 */
export const formatPriceEn = (price) => {
  if (price === null || price === undefined || isNaN(price)) {
    return 'Not specified';
  }

  const numericPrice = parseFloat(price);

  try {
    // Format with Egyptian Pound currency for English
    return new Intl.NumberFormat('en-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numericPrice);
  } catch (error) {
    // Fallback formatting
    return `EGP ${numericPrice.toFixed(2)}`;
  }
};

/**
 * Format price based on current language
 * @param {number} price - The price to format
 * @param {string} language - Current language ('ar' or 'en')
 * @returns {string} - Formatted price string
 */
export const formatPriceByLanguage = (price, language = 'ar') => {
  if (language === 'ar') {
    return formatPrice(price, 'ar-EG');
  } else {
    return formatPriceEn(price);
  }
};

/**
 * Get currency symbol based on language
 * @param {string} language - Current language ('ar' or 'en')
 * @returns {string} - Currency symbol
 */
export const getCurrencySymbol = (language = 'ar') => {
  return language === 'ar' ? 'ج.م' : 'EGP';
};

/**
 * Convert USD to EGP (approximate conversion)
 * This should ideally be replaced with real-time exchange rates
 * @param {number} usdAmount - Amount in USD
 * @param {number} exchangeRate - USD to EGP exchange rate (default: 30)
 * @returns {number} - Amount in EGP
 */
export const convertUsdToEgp = (usdAmount, exchangeRate = 30) => {
  if (!usdAmount || isNaN(usdAmount)) return 0;
  return parseFloat(usdAmount) * exchangeRate;
};

const currencyUtils = {
  formatPrice,
  formatPriceEn,
  formatPriceByLanguage,
  getCurrencySymbol,
  convertUsdToEgp
};

export default currencyUtils;
