/**
 * Payment Method Selection Component
 * Provides a professional UI for users to choose between online and cash payment
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FaCreditCard,
  FaMoneyBillWave,
  FaLock,
  FaHotel,
  FaCheck
} from 'react-icons/fa';

const PaymentMethodSelection = ({
  selectedMethod,
  onMethodChange,
  totalAmount,
  currency = 'EGP',
  className = '',
  showPricing = true,
  hotelPaymentSettings = null
}) => {
  const { t } = useTranslation();
  const [hoveredMethod, setHoveredMethod] = useState(null);

  // Filter payment methods based on hotel settings
  const paymentMethods = React.useMemo(() => {
    const allMethods = [
      {
        id: 'online',
        title: t('payment.methods.online.title', 'Pay Online'),
        subtitle: t('payment.methods.online.subtitle', 'Visa/MasterCard/Credit Card'),
        description: t('payment.methods.online.description', 'Secure online payment with instant confirmation'),
        icon: FaCreditCard,
        iconColor: 'text-blue-600',
        borderColor: 'border-blue-200',
        bgColor: 'bg-blue-50',
        hoverBg: 'hover:bg-blue-100',
        selectedBg: 'bg-blue-100',
        selectedBorder: 'border-blue-500',
        features: [
          t('payment.methods.online.feature1', 'Instant confirmation'),
          t('payment.methods.online.feature2', 'Secure encryption')
        ]
      },
      {
        id: 'cash',
        title: t('payment.methods.cash.title', 'Pay at Hotel'),
        subtitle: t('payment.methods.cash.subtitle', 'Cash Payment'),
        description: t('payment.methods.cash.description', 'Pay with cash when service is provided'),
        icon: FaMoneyBillWave,
        iconColor: 'text-green-600',
        borderColor: 'border-green-200',
        bgColor: 'bg-green-50',
        hoverBg: 'hover:bg-green-100',
        selectedBg: 'bg-green-100',
        selectedBorder: 'border-green-500',
        features: [
          t('payment.methods.cash.feature1', 'Pay on service delivery'),
          t('payment.methods.cash.feature2', 'No card required')
        ]
      }
    ];

    if (!hotelPaymentSettings) {
      // If no hotel payment settings, show all methods (backward compatibility)
      return allMethods;
    }

    const availableMethods = [];

    // Always show cash payment
    availableMethods.push(allMethods.find(method => method.id === 'cash'));

    // Show online payment only if enabled by hotel
    if (hotelPaymentSettings.enableOnlinePayment) {
      availableMethods.push(allMethods.find(method => method.id === 'online'));
    }

    return availableMethods.filter(Boolean);
  }, [hotelPaymentSettings, t]);

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className={`payment-method-selection ${className}`}>
      {/* Header - Only show on larger screens if showPricing is false */}
      {showPricing && (
        <div className="mb-4 sm:mb-6">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
            {t('payment.selectMethod', 'Select Payment Method')}
          </h3>
          <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg border">
            <span className="text-gray-600 font-medium text-sm sm:text-base">
              {t('payment.totalAmount', 'Total Amount:')}
            </span>
            <span className="text-xl sm:text-2xl font-bold text-gray-900">
              {formatAmount(totalAmount)}
            </span>
          </div>
        </div>
      )}

      {!showPricing && (
        <div className="mb-4 sm:mb-6">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
            {t('payment.selectMethod', 'Select Payment Method')}
          </h3>
          <p className="text-sm text-gray-600 mt-1 sm:hidden">
            {t('payment.selectPreferredMethod', 'Choose your preferred payment method')}
          </p>
        </div>
      )}

      {/* Payment Methods - Horizontal layout on mobile, vertical on desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3 sm:gap-4">
        {paymentMethods.map((method) => {
          const isSelected = selectedMethod === method.id;
          const isHovered = hoveredMethod === method.id;
          const IconComponent = method.icon;

          return (
            <div
              key={method.id}
              className={`
                relative border-2 rounded-lg cursor-pointer transition-all duration-200
                ${isSelected
                  ? `${method.selectedBorder} ${method.selectedBg}`
                  : `${method.borderColor} ${method.bgColor} ${method.hoverBg}`
                }
                ${isHovered ? 'sm:transform sm:scale-[1.02] shadow-lg' : 'shadow-sm'}
                p-3 sm:p-4 lg:p-6
              `}
              onClick={() => onMethodChange(method.id)}
              onMouseEnter={() => setHoveredMethod(method.id)}
              onMouseLeave={() => setHoveredMethod(null)}
            >
              {/* Selection indicator - Top right */}
              <div className={`
                absolute top-2 sm:top-3 right-2 sm:right-3 w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center
                ${isSelected
                  ? `${method.selectedBorder.replace('border-', 'border-')} bg-white`
                  : 'border-gray-300 bg-white'
                }
              `}>
                {isSelected && (
                  <FaCheck className={`w-2 h-2 sm:w-2.5 sm:h-2.5 ${method.iconColor}`} />
                )}
              </div>

              {/* Main content - Compact layout */}
              <div className="flex flex-col items-center text-center sm:text-left sm:flex-row sm:items-start space-y-2 sm:space-y-0 sm:space-x-3">
                {/* Icon */}
                <div className={`
                  flex-shrink-0 w-12 h-12 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-lg bg-white border flex items-center justify-center
                  ${isSelected ? method.selectedBorder : method.borderColor}
                `}>
                  <IconComponent className={`w-6 h-6 sm:w-5 sm:h-5 lg:w-6 lg:h-6 ${method.iconColor}`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-1 sm:space-y-0 sm:space-x-2 mb-1">
                    <h4 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900">
                      {method.title}
                    </h4>
                    <div className="flex items-center space-x-1">
                      {method.id === 'online' && (
                        <FaLock className="w-3 h-3 sm:w-3 sm:h-3 text-green-600" title={t('payment.secure', 'Secure')} />
                      )}
                      {method.id === 'cash' && (
                        <FaHotel className="w-3 h-3 sm:w-3 sm:h-3 text-green-600" title={t('payment.atHotel', 'At Hotel')} />
                      )}
                    </div>
                  </div>

                  <p className="text-xs sm:text-xs lg:text-sm font-medium text-gray-600 mb-2 hidden sm:block">
                    {method.subtitle}
                  </p>

                  {/* Features - Compact display */}
                  <div className="space-y-1 hidden sm:block lg:block">
                    {method.features.map((feature, index) => (
                      <div key={index} className="flex items-center justify-center sm:justify-start space-x-1 sm:space-x-2">
                        <FaCheck className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-green-500 flex-shrink-0" />
                        <span className="text-xs text-gray-600">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Mobile: Show just the key benefit */}
                  <div className="sm:hidden">
                    <span className="text-xs text-gray-600">{method.features[0]}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Notice when online payments are disabled */}
      {hotelPaymentSettings && !hotelPaymentSettings.enableOnlinePayment && (
        <div className="mt-3 sm:mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start">
            <FaHotel className="w-4 h-4 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-800">
                {t('payment.cashOnlyNotice.title', 'Cash Payment Only')}
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                {t('payment.cashOnlyNotice.message', 'This hotel currently accepts cash payments only. Online payment options are not available at this time.')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Security notice - More compact */}
      <div className="mt-3 sm:mt-4 lg:mt-6 p-3 sm:p-3 lg:p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center space-x-2">
          <FaLock className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 flex-shrink-0" />
          <div>
            <span className="font-medium text-blue-900 text-xs sm:text-sm">
              {t('payment.security.title', 'Secure Payment')} -
            </span>
            <span className="text-xs sm:text-sm text-blue-700 ml-1">
              SSL encrypted & protected
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethodSelection;
