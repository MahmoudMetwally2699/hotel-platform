/**
 * Currency Utility
 * Handles currency formatting for Saudi Riyal (SAR)
 */

/**
 * Format price with Saudi Riyal currency
 * @param {number} price - The price to format
 * @param {string} locale - The locale to use for formatting (default: 'ar-SA' for Arabic Saudi Arabia)
 * @returns {string} - Formatted price string
 */
export const formatPrice = (price, locale = 'ar-SA') => {
  if (price === null || price === undefined || isNaN(price)) {
    return 'غير محدد'; // "Not specified" in Arabic
  }

  const numericPrice = parseFloat(price);

  try {
    // Format with Saudi Riyal currency
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numericPrice);
  } catch (error) {
    // Fallback formatting if Intl is not supported
    return `${numericPrice.toFixed(2)} ر.س`;
  }
};

/**
 * Format price with Saudi Riyal currency for English locale
 * @param {number} price - The price to format
 * @returns {string} - Formatted price string
 */
export const formatPriceEn = (price) => {
  if (price === null || price === undefined || isNaN(price)) {
    return 'Not specified';
  }

  const numericPrice = parseFloat(price);

  try {
    // Format with Saudi Riyal currency for English
    return new Intl.NumberFormat('en-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numericPrice);
  } catch (error) {
    // Fallback formatting
    return `SAR ${numericPrice.toFixed(2)}`;
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
    return formatPrice(price, 'ar-SA');
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
  return language === 'ar' ? 'ر.س' : 'SAR';
};

/**
 * Convert USD to SAR (approximate conversion)
 * This should ideally be replaced with real-time exchange rates
 * @param {number} usdAmount - Amount in USD
 * @param {number} exchangeRate - USD to SAR exchange rate (default: 3.75)
 * @returns {number} - Amount in SAR
 */
export const convertUsdToSar = (usdAmount, exchangeRate = 3.75) => {
  if (!usdAmount || isNaN(usdAmount)) return 0;
  return parseFloat(usdAmount) * exchangeRate;
};

const currencyUtils = {
  formatPrice,
  formatPriceEn,
  formatPriceByLanguage,
  getCurrencySymbol,
  convertUsdToSar
};

export default currencyUtils;
