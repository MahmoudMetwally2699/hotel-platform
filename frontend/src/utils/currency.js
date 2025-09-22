/**
 * Currency Utility
 * Handles currency formatting for US Dollar (USD)
 */

/**
 * Format price with US Dollar currency
 * @param {number} price - The price to format
 * @param {string} locale - The locale to use for formatting (default: 'en-US' for English US)
 * @returns {string} - Formatted price string
 */
export const formatPrice = (price, locale = 'en-US') => {
  if (price === null || price === undefined || isNaN(price)) {
    return 'غير محدد'; // "Not specified" in Arabic
  }

  const numericPrice = parseFloat(price);

  try {
    // Format with US Dollar currency
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numericPrice);
  } catch (error) {
    // Fallback formatting if Intl is not supported
    return `$${numericPrice.toFixed(2)}`;
  }
};

/**
 * Format price with US Dollar currency for English locale
 * @param {number} price - The price to format
 * @returns {string} - Formatted price string
 */
export const formatPriceEn = (price) => {
  if (price === null || price === undefined || isNaN(price)) {
    return 'Not specified';
  }

  const numericPrice = parseFloat(price);

  try {
    // Format with US Dollar currency for English
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numericPrice);
  } catch (error) {
    // Fallback formatting
    return `$${numericPrice.toFixed(2)}`;
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
    return formatPrice(price, 'ar-SA'); // Use Saudi Arabia locale for Arabic
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
  return '$';
};

/**
 * Convert USD to SAR (Saudi Riyal)
 * @param {number} usdAmount - Amount in USD
 * @param {number} exchangeRate - USD to SAR exchange rate (default: 3.751)
 * @returns {number} - Amount in SAR
 */
export const convertUsdToSar = (usdAmount, exchangeRate = 3.751) => {
  if (!usdAmount || isNaN(usdAmount)) return 0;
  return parseFloat(usdAmount) * exchangeRate;
};

/**
 * Format total price with USD and SAR equivalent in brackets
 * @param {number} price - The price in USD to format
 * @param {string} language - Current language ('ar' or 'en')
 * @returns {string} - Formatted price string with SAR equivalent
 */
export const formatTotalWithSar = (price, language = 'ar') => {
  if (price === null || price === undefined || isNaN(price)) {
    return 'غير محدد'; // "Not specified" in Arabic
  }

  const numericPrice = parseFloat(price);
  const usdFormatted = formatPriceByLanguage(numericPrice, language);
  const sarAmount = convertUsdToSar(numericPrice);
  const sarFormatted = new Intl.NumberFormat(language === 'ar' ? 'ar-SA' : 'en-SA', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(sarAmount);

  return `${usdFormatted} (${sarFormatted})`;
};

const currencyUtils = {
  formatPrice,
  formatPriceEn,
  formatPriceByLanguage,
  formatTotalWithSar,
  getCurrencySymbol,
  convertUsdToSar
};

export default currencyUtils;
