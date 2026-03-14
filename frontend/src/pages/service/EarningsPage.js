/**
 * Sales Page (المبيعات)
 * Shows service provider's sales data: totals, paid/unpaid order lists
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import serviceProviderService from '../../services/service-provider.service';

const EarningsPage = () => {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const isRTL = i18n.language === 'ar';

  const [salesData, setSalesData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchPaid, setSearchPaid] = useState('');
  const [searchUnpaid, setSearchUnpaid] = useState('');

  const fetchSalesData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await serviceProviderService.getSalesData();
      setSalesData(response.data || response);
    } catch (err) {
      console.error('Failed to fetch sales data:', err);
      setError(err.message || 'Failed to load sales data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSalesData();
  }, [fetchSalesData]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat(isRTL ? 'ar-SA' : 'en-US', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filterOrders = (orders, search) => {
    if (!search) return orders || [];
    const s = search.toLowerCase();
    return (orders || []).filter(order => {
      const bookingNum = order.bookingNumber?.toLowerCase() || '';
      const guestName = `${order.guestId?.firstName || ''} ${order.guestId?.lastName || ''}`.toLowerCase();
      const serviceName = order.serviceId?.name?.toLowerCase() || '';
      const category = order.serviceDetails?.category?.toLowerCase() || '';
      return bookingNum.includes(s) || guestName.includes(s) || serviceName.includes(s) || category.includes(s);
    });
  };

  // SVG Icon Components
  const WalletIcon = ({ className = "w-6 h-6", color = "white" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 110-6h5.25A2.25 2.25 0 0121 6v6zm0 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18V6a2.25 2.25 0 012.25-2.25h13.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
    </svg>
  );

  const CalendarIcon = ({ className = "w-6 h-6", color = "white" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  );

  const CurrencyIcon = ({ className = "w-6 h-6", color = "white" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  const BoxIcon = ({ className = "w-6 h-6", color = "white" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  );

  const CheckCircleIcon = ({ className = "w-4 h-4" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  const ClockIcon = ({ className = "w-4 h-4" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  const SearchIcon = ({ className = "w-4 h-4" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );

  const InboxIcon = ({ className = "w-10 h-10" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859m-17.5 0V19.5a2.25 2.25 0 002.25 2.25h15a2.25 2.25 0 002.25-2.25V13.5m-17.5 0V6.75A2.25 2.25 0 014.5 4.5h15a2.25 2.25 0 012.25 2.25v6.75" />
    </svg>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 rounded-full animate-spin" style={{ borderColor: `${theme.primaryColor}30`, borderTopColor: theme.primaryColor }}></div>
          <p className="text-gray-500 font-medium">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="text-center bg-red-50 border border-red-200 rounded-2xl p-8 max-w-md">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 mx-auto text-red-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <h3 className="text-lg font-bold text-red-700 mb-2">{t('common.error')}</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchSalesData}
            className="px-6 py-2.5 text-white rounded-xl hover:opacity-90 transition-all font-medium"
            style={{ backgroundColor: theme.primaryColor }}
          >
            {isRTL ? 'إعادة المحاولة' : 'Retry'}
          </button>
        </div>
      </div>
    );
  }

  const stats = [
    {
      label: isRTL ? 'المبالغ المتبقي تحصيلها' : 'Remaining to Collect',
      value: formatCurrency(salesData?.remainingAmount),
      icon: <WalletIcon />,
    },
    {
      label: isRTL ? 'المبيعات الشهرية' : 'Monthly Sales',
      value: formatCurrency(salesData?.monthlySales),
      icon: <CalendarIcon />,
    },
    {
      label: isRTL ? 'إجمالي المبيعات' : 'Total Sales',
      value: formatCurrency(salesData?.totalSales),
      icon: <CurrencyIcon />,
    },
    {
      label: isRTL ? 'إجمالي الطلبات' : 'Total Orders',
      value: salesData?.totalOrders || 0,
      icon: <BoxIcon />,
    }
  ];

  const filteredPaid = filterOrders(salesData?.paidOrders, searchPaid);
  const filteredUnpaid = filterOrders(salesData?.unpaidOrders, searchUnpaid);

  const OrderCard = ({ order, isPaid }) => {
    const amount = order.pricing?.providerEarnings || order.pricing?.totalBeforeMarkup || 0;
    return (
      <div className={`bg-white rounded-xl border p-4 hover:shadow-md transition-all duration-200`}
        style={{ borderColor: isPaid ? '#bbf7d0' : '#fecaca' }}
      >
        <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-gray-800 text-sm">#{order.bookingNumber || order._id?.slice(-6)}</span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold`}
                style={{
                  backgroundColor: isPaid ? '#dcfce7' : '#fee2e2',
                  color: isPaid ? '#15803d' : '#b91c1c'
                }}
              >
                {isPaid ? <CheckCircleIcon className="w-3 h-3" /> : <ClockIcon className="w-3 h-3" />}
                {isPaid ? (isRTL ? 'تم التحصيل' : 'Collected') : (isRTL ? 'لم يتم التحصيل' : 'Pending')}
              </span>
            </div>
            <p className="text-gray-500 text-xs mt-1">
              {order.guestId?.firstName} {order.guestId?.lastName} • {order.serviceId?.name || order.serviceDetails?.category}
            </p>
            <p className="text-gray-400 text-xs mt-0.5">
              {formatDate(order.createdAt)}
              {isPaid && order.providerPaid?.paidAt && (
                <span style={{ color: theme.primaryColor }}> • {isRTL ? 'تم الدفع' : 'Paid'}: {formatDate(order.providerPaid.paidAt)}</span>
              )}
            </p>
          </div>
          <div className={`${isRTL ? 'text-left' : 'text-right'} flex-shrink-0`}>
            <p className="text-lg font-bold" style={{ color: isPaid ? '#16a34a' : theme.primaryColor }}>
              {formatCurrency(amount)}
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8" dir={isRTL ? 'rtl' : 'ltr'} style={{ backgroundColor: theme.backgroundColor || '#f9fafb' }}>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold" style={{ color: theme.primaryColor }}>
          {isRTL ? 'المبيعات' : 'Sales'}
        </h1>
        <p className="text-gray-500 mt-1">
          {isRTL ? 'متابعة المبيعات والتحصيلات' : 'Track your sales and collections'}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
          >
            <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
                style={{ backgroundColor: theme.primaryColor }}
              >
                {stat.icon}
              </div>
              <div className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                <p className="text-xs font-medium text-gray-500 mb-1">{stat.label}</p>
                <p className="text-xl font-bold" style={{ color: theme.primaryColor }}>{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Two Lists Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Unpaid Orders */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100" style={{ backgroundColor: `${theme.primaryColor}08` }}>
            <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#fef2f2' }}>
                  <ClockIcon className="w-4 h-4 text-red-500" />
                </div>
                <h2 className="text-base font-bold text-gray-800">
                  {isRTL ? 'العمليات التي لم يتم تحصيلها' : 'Uncollected Operations'}
                </h2>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: '#fee2e2', color: '#b91c1c' }}>
                {salesData?.unpaidOrders?.length || 0}
              </span>
            </div>
            <div className="mt-3">
              <div className="relative">
                <input
                  type="text"
                  value={searchUnpaid}
                  onChange={(e) => setSearchUnpaid(e.target.value)}
                  placeholder={isRTL ? 'بحث...' : 'Search...'}
                  className={`w-full px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:border-transparent ${isRTL ? 'text-right pr-10' : 'pl-10'}`}
                  style={{ '--tw-ring-color': `${theme.primaryColor}40` }}
                />
                <div className={`absolute top-2.5 ${isRTL ? 'right-3' : 'left-3'}`}>
                  <SearchIcon className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            </div>
          </div>
          <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
            {filteredUnpaid.length > 0 ? (
              filteredUnpaid.map((order) => (
                <OrderCard key={order._id} order={order} isPaid={false} />
              ))
            ) : (
              <div className="text-center py-10 text-gray-400">
                <CheckCircleIcon className="w-10 h-10 mx-auto mb-2 text-green-300" />
                <p className="font-medium">{isRTL ? 'لا توجد عمليات معلقة' : 'No pending operations'}</p>
              </div>
            )}
          </div>
        </div>

        {/* Paid Orders */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100" style={{ backgroundColor: `${theme.primaryColor}08` }}>
            <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#dcfce7' }}>
                  <CheckCircleIcon className="w-4 h-4 text-green-600" />
                </div>
                <h2 className="text-base font-bold text-gray-800">
                  {isRTL ? 'العمليات التي تم تحصيلها' : 'Collected Operations'}
                </h2>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: '#dcfce7', color: '#15803d' }}>
                {salesData?.paidOrders?.length || 0}
              </span>
            </div>
            <div className="mt-3">
              <div className="relative">
                <input
                  type="text"
                  value={searchPaid}
                  onChange={(e) => setSearchPaid(e.target.value)}
                  placeholder={isRTL ? 'بحث...' : 'Search...'}
                  className={`w-full px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:border-transparent ${isRTL ? 'text-right pr-10' : 'pl-10'}`}
                  style={{ '--tw-ring-color': `${theme.primaryColor}40` }}
                />
                <div className={`absolute top-2.5 ${isRTL ? 'right-3' : 'left-3'}`}>
                  <SearchIcon className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            </div>
          </div>
          <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
            {filteredPaid.length > 0 ? (
              filteredPaid.map((order) => (
                <OrderCard key={order._id} order={order} isPaid={true} />
              ))
            ) : (
              <div className="text-center py-10 text-gray-400">
                <InboxIcon className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p className="font-medium">{isRTL ? 'لا توجد عمليات محصلة' : 'No collected operations yet'}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EarningsPage;
