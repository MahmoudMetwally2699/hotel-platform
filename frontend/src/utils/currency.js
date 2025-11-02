/**
 * Currency Utility
 * Handles currency formatting for multiple currencies
 */

/**
 * Format price with specified currency
 * @param {number} price - The price to format
 * @param {string} locale - The locale to use for formatting (default: 'en-US' for English US)
 * @param {string} currency - The currency code (default: 'USD')
 * @returns {string} - Formatted price string
 */
export const formatPrice = (price, locale = 'en-US', currency = 'USD') => {
  if (price === null || price === undefined || isNaN(price)) {
    return 'غير محدد'; // "Not specified" in Arabic
  }

  const numericPrice = parseFloat(price);

  try {
    // Format with specified currency
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numericPrice);
  } catch (error) {
    // Fallback formatting if Intl is not supported
    const currencySymbols = {
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'CAD': 'CA$',
      'AUD': 'A$',
      'SAR': 'ر.س',
      'EGP': 'E£'
    };
    const symbol = currencySymbols[currency] || currency + ' ';
    return `${symbol}${numericPrice.toFixed(2)}`;
  }
};

/**
 * Format price with specified currency for English locale
 * @param {number} price - The price to format
 * @param {string} currency - The currency code (default: 'USD')
 * @returns {string} - Formatted price string
 */
export const formatPriceEn = (price, currency = 'USD') => {
  if (price === null || price === undefined || isNaN(price)) {
    return 'Not specified';
  }

  const numericPrice = parseFloat(price);

  try {
    // Format with specified currency for English
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numericPrice);
  } catch (error) {
    // Fallback formatting
    const currencySymbols = {
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'CAD': 'CA$',
      'AUD': 'A$',
      'SAR': 'ر.س',
      'EGP': 'E£'
    };
    const symbol = currencySymbols[currency] || currency + ' ';
    return `${symbol}${numericPrice.toFixed(2)}`;
  }
};

/**
 * Format price based on current language
 * @param {number} price - The price to format
 * @param {string} language - Current language ('ar' or 'en')
 * @param {string} currency - The currency code (default: 'USD')
 * @returns {string} - Formatted price string
 */
export const formatPriceByLanguage = (price, language = 'ar', currency = 'USD') => {
  if (language === 'ar') {
    return formatPrice(price, 'ar-SA', currency); // Use Saudi Arabia locale for Arabic
  } else {
    return formatPriceEn(price, currency);
  }
};

/**
 * Get currency symbol based on currency code
 * @param {string} currency - Currency code (default: 'USD')
 * @returns {string} - Currency symbol
 */
export const getCurrencySymbol = (currency = 'USD') => {
  const currencySymbols = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'CAD': 'CA$',
    'AUD': 'A$',
    'SAR': 'ر.س',
    'EGP': 'E£'
  };
  return currencySymbols[currency] || currency;
};

/**
 * Convert from one currency to another (simplified - in production use real exchange rates API)
 * @param {number} amount - Amount to convert
 * @param {string} fromCurrency - Source currency code
 * @param {string} toCurrency - Target currency code
 * @param {object} exchangeRates - Exchange rates object (optional)
 * @returns {number} - Converted amount
 */
export const convertCurrency = (amount, fromCurrency = 'USD', toCurrency = 'SAR', exchangeRates = null) => {
  if (!amount || isNaN(amount)) return 0;
  if (fromCurrency === toCurrency) return parseFloat(amount);

  // Default exchange rates (simplified - use API in production)
  const defaultRates = {
    'USD_SAR': 3.751,
    'USD_EUR': 0.85,
    'USD_GBP': 0.73,
    'USD_CAD': 1.25,
    'USD_AUD': 1.35,
    'USD_EGP': 30.90,
  };

  const rates = exchangeRates || defaultRates;
  const rateKey = `${fromCurrency}_${toCurrency}`;
  const reverseRateKey = `${toCurrency}_${fromCurrency}`;

  if (rates[rateKey]) {
    return parseFloat(amount) * rates[rateKey];
  } else if (rates[reverseRateKey]) {
    return parseFloat(amount) / rates[reverseRateKey];
  }

  // If no direct rate found, return original amount
  return parseFloat(amount);
};

/**
 * Convert USD to SAR (Saudi Riyal) - kept for backward compatibility
 * @param {number} usdAmount - Amount in USD
 * @param {number} exchangeRate - USD to SAR exchange rate (default: 3.751)
 * @returns {number} - Amount in SAR
 */
export const convertUsdToSar = (usdAmount, exchangeRate = 3.751) => {
  return convertCurrency(usdAmount, 'USD', 'SAR', { 'USD_SAR': exchangeRate });
};

/**
 * Format total price with primary currency and optional secondary currency in brackets
 * @param {number} price - The price to format
 * @param {string} language - Current language ('ar' or 'en')
 * @param {string} primaryCurrency - Primary currency code (default: 'USD')
 * @param {string} secondaryCurrency - Secondary currency code for conversion (optional, default: 'SAR')
 * @returns {string} - Formatted price string with optional secondary currency
 */
export const formatTotalWithSar = (price, language = 'ar', primaryCurrency = 'USD', secondaryCurrency = 'SAR') => {
  if (price === null || price === undefined || isNaN(price)) {
    return 'غير محدد'; // "Not specified" in Arabic
  }

  const numericPrice = parseFloat(price);
  const primaryFormatted = formatPriceByLanguage(numericPrice, language, primaryCurrency);

  // Only show secondary currency if it's different from primary
  if (secondaryCurrency && secondaryCurrency !== primaryCurrency) {
    const convertedAmount = convertCurrency(numericPrice, primaryCurrency, secondaryCurrency);
    const secondaryFormatted = new Intl.NumberFormat(language === 'ar' ? 'ar-SA' : 'en-SA', {
      style: 'currency',
      currency: secondaryCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(convertedAmount);

    return `${primaryFormatted} (${secondaryFormatted})`;
  }

  return primaryFormatted;
};

const currencyUtils = {
  formatPrice,
  formatPriceEn,
  formatPriceByLanguage,
  formatTotalWithSar,
  getCurrencySymbol,
  convertCurrency,
  convertUsdToSar
};

export default currencyUtils;
