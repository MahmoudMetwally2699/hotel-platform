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
  FaCheck,
  FaInfoCircle
} from 'react-icons/fa';

const PaymentMethodSelection = ({
  selectedMethod,
  onMethodChange,
  totalAmount,
  currency = 'EGP',
  className = '',
  showPricing = true
}) => {
  const { t } = useTranslation();
  const [hoveredMethod, setHoveredMethod] = useState(null);

  const paymentMethods = [
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
        t('payment.methods.online.feature2', 'Secure encryption'),
        t('payment.methods.online.feature3', 'Automatic receipt')
      ],
      badge: t('payment.methods.online.badge', 'Recommended')
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
        t('payment.methods.cash.feature2', 'No card required'),
        t('payment.methods.cash.feature3', 'Flexible payment')
      ]
    }
  ];

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className={`payment-method-selection ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {t('payment.selectMethod', 'Select Payment Method')}
        </h3>
        {showPricing && (
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
            <span className="text-gray-600 font-medium">
              {t('payment.totalAmount', 'Total Amount:')}
            </span>
            <span className="text-2xl font-bold text-gray-900">
              {formatAmount(totalAmount)}
            </span>
          </div>
        )}
      </div>

      {/* Payment Methods */}
      <div className="space-y-4">
        {paymentMethods.map((method) => {
          const isSelected = selectedMethod === method.id;
          const isHovered = hoveredMethod === method.id;
          const IconComponent = method.icon;

          return (
            <div
              key={method.id}
              className={`
                relative border-2 rounded-xl p-6 cursor-pointer transition-all duration-200
                ${isSelected
                  ? `${method.selectedBorder} ${method.selectedBg}`
                  : `${method.borderColor} ${method.bgColor} ${method.hoverBg}`
                }
                ${isHovered ? 'transform scale-[1.02] shadow-lg' : 'shadow-sm'}
              `}
              onClick={() => onMethodChange(method.id)}
              onMouseEnter={() => setHoveredMethod(method.id)}
              onMouseLeave={() => setHoveredMethod(null)}
            >
              {/* Selection indicator */}
              <div className={`
                absolute top-4 right-4 w-6 h-6 rounded-full border-2 flex items-center justify-center
                ${isSelected
                  ? `${method.selectedBorder.replace('border-', 'border-')} bg-white`
                  : 'border-gray-300 bg-white'
                }
              `}>
                {isSelected && (
                  <FaCheck className={`w-3 h-3 ${method.iconColor}`} />
                )}
              </div>

              {/* Badge for recommended option */}
              {method.badge && method.id === 'online' && (
                <div className="absolute -top-2 left-4">
                  <span className="bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    {method.badge}
                  </span>
                </div>
              )}

              {/* Main content */}
              <div className="flex items-start space-x-4">
                {/* Icon */}
                <div className={`
                  flex-shrink-0 w-12 h-12 rounded-lg bg-white border flex items-center justify-center
                  ${isSelected ? method.selectedBorder : method.borderColor}
                `}>
                  <IconComponent className={`w-6 h-6 ${method.iconColor}`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="text-lg font-semibold text-gray-900">
                      {method.title}
                    </h4>
                    {method.id === 'online' && (
                      <FaLock className="w-4 h-4 text-green-600" title={t('payment.secure', 'Secure')} />
                    )}
                    {method.id === 'cash' && (
                      <FaHotel className="w-4 h-4 text-green-600" title={t('payment.atHotel', 'At Hotel')} />
                    )}
                  </div>

                  <p className="text-sm font-medium text-gray-600 mb-2">
                    {method.subtitle}
                  </p>

                  <p className="text-sm text-gray-500 mb-3">
                    {method.description}
                  </p>

                  {/* Features */}
                  <div className="space-y-1">
                    {method.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <FaCheck className="w-3 h-3 text-green-500 flex-shrink-0" />
                        <span className="text-xs text-gray-600">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Payment timing info */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-2">
                  <FaInfoCircle className="w-4 h-4 text-gray-400" />
                  <span className="text-xs text-gray-500">
                    {method.id === 'online'
                      ? t('payment.methods.online.timing', 'Payment processed immediately')
                      : t('payment.methods.cash.timing', 'Payment collected when service is provided')
                    }
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Security notice */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start space-x-2">
          <FaLock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h5 className="font-medium text-blue-900 mb-1">
              {t('payment.security.title', 'Secure Payment')}
            </h5>
            <p className="text-sm text-blue-700">
              {t('payment.security.description', 'All online payments are processed securely using industry-standard encryption. Your payment information is protected and never stored on our servers.')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethodSelection;
