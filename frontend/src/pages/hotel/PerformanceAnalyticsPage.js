/**
 * Performance Analytics Page
 * Comprehensive analytics dashboard for hotel customer feedback and ratings
 */

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { FiCalendar, FiDownload, FiRefreshCw } from 'react-icons/fi';
import toast from 'react-hot-toast';
import RatingSummaryCards from '../../components/hotel/analytics/RatingSummaryCards';
import RatingsBreakdownTable from '../../components/hotel/analytics/RatingsBreakdownTable';
import RatingsByTypeChart from '../../components/hotel/analytics/RatingsByTypeChart';
import RatingsTrendChart from '../../components/hotel/analytics/RatingsTrendChart';
import OperationalSummaryCards from '../../components/hotel/operational/OperationalSummaryCards';
import CompletionTimeChart from '../../components/hotel/operational/CompletionTimeChart';
import SLAByServiceTable from '../../components/hotel/operational/SLAByServiceTable';
import SLADistributionChart from '../../components/hotel/operational/SLADistributionChart';
import ServiceDetailsTable from '../../components/hotel/operational/ServiceDetailsTable';
import ServicePerformanceSummary from '../../components/hotel/operational/ServicePerformanceSummary';
import RevenueSummaryCards from '../../components/hotel/revenue/RevenueSummaryCards';
import RevenueComparisonChart from '../../components/hotel/revenue/RevenueComparisonChart';
import RevenueByCategoryChart from '../../components/hotel/revenue/RevenueByCategoryChart';
import InternalServicesTable from '../../components/hotel/revenue/InternalServicesTable';
import ExternalProvidersTable from '../../components/hotel/revenue/ExternalProvidersTable';
import CompleteSummaryTable from '../../components/hotel/revenue/CompleteSummaryTable';
import SpendingSummaryCards from '../../components/hotel/spending/SpendingSummaryCards';
import SpendingTrendChart from '../../components/hotel/spending/SpendingTrendChart';
import ServiceRequestChart from '../../components/hotel/spending/ServiceRequestChart';
import ServicePopularityTable from '../../components/hotel/spending/ServicePopularityTable';
import ComprehensivePerformanceTable from '../../components/hotel/spending/ComprehensivePerformanceTable';
import {
  fetchRatingSummary,
  fetchRatingsBreakdown,
  fetchRatingsByType,
  fetchRatingsTrend,
  setDateRange,
  selectRatingSummary,
  selectRatingsBreakdown,
  selectRatingsByType,
  selectRatingsTrend
} from '../../redux/slices/hotelAnalyticsSlice';
import {
  fetchOperationalSummary,
  fetchCompletionByService,
  fetchSLAByService,
  fetchSLADistribution,
  fetchServiceDetails
} from '../../redux/slices/hotelOperationalSlice';
import {
  fetchRevenueSummary,
  fetchRevenueComparison,
  fetchRevenueByCategory,
  fetchInternalServices,
  fetchExternalProviders,
  fetchCompleteSummary
} from '../../redux/slices/hotelRevenueSlice';
import {
  fetchSpendingSummary,
  fetchSpendingTrend,
  fetchServiceRequests,
  fetchServicePopularity,
  fetchComprehensivePerformance
} from '../../redux/slices/hotelSpendingSlice';

const PerformanceAnalyticsPage = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation();

  // Redux state - Ratings
  const summaryState = useSelector(selectRatingSummary);
  const breakdownState = useSelector(selectRatingsBreakdown);
  const byTypeState = useSelector(selectRatingsByType);
  const trendState = useSelector(selectRatingsTrend);

  // Redux state - Operational
  const {
    summary: operationalSummary,
    completionByService,
    slaByService,
    slaDistribution,
    serviceDetails
  } = useSelector((state) => state.hotelOperational);

  // Redux state - Revenue
  const {
    summary: revenueSummary,
    comparison: revenueComparison,
    byCategory: revenueByCategory,
    internalServices,
    externalProviders,
    completeSummary
  } = useSelector((state) => state.hotelRevenue);

  // Redux state - Customer Spending
  const {
    summary: spendingSummary,
    trend: spendingTrend,
    serviceRequests,
    servicePopularity,
    comprehensive
  } = useSelector((state) => state.hotelSpending);

  // Local state
  const [activeTab, setActiveTab] = useState('ratings');
  const [selectedRange, setSelectedRange] = useState('allTime');
  const [selectedService, setSelectedService] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [spendingPeriod, setSpendingPeriod] = useState('weekly');

  // Service type options
  const serviceTypes = [
    { value: 'all', label: t('performanceAnalyticsPage.serviceTypes.all') },
    { value: 'laundry', label: t('performanceAnalyticsPage.serviceTypes.laundry') },
    { value: 'housekeeping', label: t('performanceAnalyticsPage.serviceTypes.housekeeping') },
    { value: 'maintenance', label: t('performanceAnalyticsPage.serviceTypes.maintenance') },
    { value: 'cleaning', label: t('performanceAnalyticsPage.serviceTypes.cleaning') },
    { value: 'amenities', label: t('performanceAnalyticsPage.serviceTypes.amenities') },
    { value: 'transportation', label: t('performanceAnalyticsPage.serviceTypes.transportation') },
    { value: 'dining', label: t('performanceAnalyticsPage.serviceTypes.dining') }
  ];

  // Date range presets
  const dateRangePresets = {
    allTime: {
      label: t('performanceAnalyticsPage.dateRanges.allTime'),
      getRange: () => {
        const now = new Date();
        const start = new Date(now);
        start.setFullYear(now.getFullYear() - 2); // Last 2 years
        return { startDate: start.toISOString(), endDate: now.toISOString() };
      }
    },
    thisWeek: {
      label: t('performanceAnalyticsPage.dateRanges.thisWeek'),
      getRange: () => {
        const now = new Date();
        const start = new Date(now);
        start.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
        start.setHours(0, 0, 0, 0);
        return { startDate: start.toISOString(), endDate: now.toISOString() };
      }
    },
    thisMonth: {
      label: t('performanceAnalyticsPage.dateRanges.thisMonth'),
      getRange: () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        return { startDate: start.toISOString(), endDate: now.toISOString() };
      }
    },
    lastQuarter: {
      label: t('performanceAnalyticsPage.dateRanges.lastQuarter'),
      getRange: () => {
        const now = new Date();
        const start = new Date(now);
        start.setMonth(now.getMonth() - 3);
        return { startDate: start.toISOString(), endDate: now.toISOString() };
      }
    },
    custom: {
      label: t('performanceAnalyticsPage.dateRanges.custom'),
      getRange: () => ({
        startDate: customStartDate,
        endDate: customEndDate
      })
    }
  };

  // Fetch all analytics data
  const fetchAllData = async (range, serviceFilter = 'all') => {
    try {
      const { startDate, endDate } = range;

      // Build query params
      const params = { startDate, endDate };
      if (serviceFilter && serviceFilter !== 'all') {
        params.serviceType = serviceFilter;
      }

      // Fetch based on active tab
      if (activeTab === 'ratings') {
        await Promise.all([
          dispatch(fetchRatingSummary(params)).unwrap(),
          dispatch(fetchRatingsBreakdown(params)).unwrap(),
          dispatch(fetchRatingsByType(params)).unwrap(),
          dispatch(fetchRatingsTrend({ ...params, period: 'week' })).unwrap()
        ]);
      } else if (activeTab === 'operational') {
        await Promise.all([
          dispatch(fetchOperationalSummary(params)).unwrap(),
          dispatch(fetchCompletionByService(params)).unwrap(),
          dispatch(fetchSLAByService(params)).unwrap(),
          dispatch(fetchSLADistribution(params)).unwrap(),
          dispatch(fetchServiceDetails(params)).unwrap()
        ]);
      } else if (activeTab === 'revenue') {
        await Promise.all([
          dispatch(fetchRevenueSummary(params)).unwrap(),
          dispatch(fetchRevenueComparison(params)).unwrap(),
          dispatch(fetchRevenueByCategory(params)).unwrap(),
          dispatch(fetchInternalServices(params)).unwrap(),
          dispatch(fetchExternalProviders(params)).unwrap(),
          dispatch(fetchCompleteSummary(params)).unwrap()
        ]);
      } else if (activeTab === 'spending') {
        await Promise.all([
          dispatch(fetchSpendingSummary(params)).unwrap(),
          dispatch(fetchSpendingTrend({ ...params, period: spendingPeriod })).unwrap(),
          dispatch(fetchServiceRequests({ ...params, period: spendingPeriod })).unwrap(),
          dispatch(fetchServicePopularity(params)).unwrap(),
          dispatch(fetchComprehensivePerformance(params)).unwrap()
        ]);
      }

      dispatch(setDateRange({ startDate, endDate }));
    } catch (error) {
      toast.error(error || t('performanceAnalyticsPage.messages.fetchError'));
    }
  };

  // Initial data fetch
  useEffect(() => {
    const range = dateRangePresets[selectedRange].getRange();
    fetchAllData(range, selectedService);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch data when tab changes
  useEffect(() => {
    const range = dateRangePresets[selectedRange].getRange();
    fetchAllData(range, selectedService);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Handle date range change
  const handleDateRangeChange = async (rangeKey) => {
    setSelectedRange(rangeKey);

    if (rangeKey === 'custom') {
      // Wait for user to set custom dates
      return;
    }

    const range = dateRangePresets[rangeKey].getRange();
    await fetchAllData(range, selectedService);
  };

  // Handle service filter change
  const handleServiceFilterChange = async (serviceType) => {
    setSelectedService(serviceType);
    const range = dateRangePresets[selectedRange].getRange();
    await fetchAllData(range, serviceType);
  };

  // Handle custom date range apply
  const handleCustomRangeApply = async () => {
    if (!customStartDate || !customEndDate) {
      toast.error(t('performanceAnalyticsPage.messages.selectBothDates'));
      return;
    }

    if (new Date(customStartDate) > new Date(customEndDate)) {
      toast.error(t('performanceAnalyticsPage.messages.startBeforeEnd'));
      return;
    }

    const range = {
      startDate: new Date(customStartDate).toISOString(),
      endDate: new Date(customEndDate).toISOString()
    };

    await fetchAllData(range, selectedService);
  };

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    const range = selectedRange === 'custom'
      ? { startDate: customStartDate, endDate: customEndDate }
      : dateRangePresets[selectedRange].getRange();

    await fetchAllData(range, selectedService);
    setRefreshing(false);
    toast.success(t('performanceAnalyticsPage.messages.refreshSuccess'));
  };

  // Handle export (placeholder for future PDF generation)
  const handleExport = () => {
    toast.info(t('performanceAnalyticsPage.messages.exportSoon'));
  };

  // Handle spending period change
  const handleSpendingPeriodChange = async (period) => {
    setSpendingPeriod(period);
    const range = dateRangePresets[selectedRange].getRange();
    const { startDate, endDate } = range;
    const params = { startDate, endDate };
    if (selectedService && selectedService !== 'all') {
      params.serviceType = selectedService;
    }

    try {
      await Promise.all([
        dispatch(fetchSpendingTrend({ ...params, period })).unwrap(),
        dispatch(fetchServiceRequests({ ...params, period })).unwrap()
      ]);
    } catch (error) {
      toast.error(error || t('performanceAnalyticsPage.messages.updateError'));
    }
  };

  // Tab content
  const tabs = [
    { id: 'ratings', label: t('performanceAnalyticsPage.tabs.ratings'), active: true },
    { id: 'operational', label: t('performanceAnalyticsPage.tabs.operational'), active: true },
    { id: 'revenue', label: t('performanceAnalyticsPage.tabs.revenue'), active: true },
    { id: 'spending', label: t('performanceAnalyticsPage.tabs.spending'), active: true }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{t('performanceAnalyticsPage.title')}</h1>
          <p className="mt-2 text-sm text-gray-600">
            {t('performanceAnalyticsPage.subtitle')}
          </p>
        </div>

        {/* Controls Bar */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center flex-wrap">
              {/* Service Filter */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">{t('performanceAnalyticsPage.controls.service')}</span>
                <select
                  value={selectedService}
                  onChange={(e) => handleServiceFilterChange(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  {serviceTypes.map((service) => (
                    <option key={service.value} value={service.value}>
                      {service.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Range Selector */}
              <div className="flex items-center gap-2">
                <FiCalendar className="w-5 h-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">{t('performanceAnalyticsPage.controls.dateRange')}</span>
                <select
                  value={selectedRange}
                  onChange={(e) => handleDateRangeChange(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  {Object.entries(dateRangePresets).map(([key, preset]) => (
                    <option key={key} value={key}>
                      {preset.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom Date Inputs */}
              {selectedRange === 'custom' && (
                <div className="flex gap-2 items-center">
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <span className="text-gray-500">{t('performanceAnalyticsPage.controls.to')}</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleCustomRangeApply}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {t('performanceAnalyticsPage.controls.apply')}
                  </button>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                <FiRefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {t('performanceAnalyticsPage.controls.refresh')}
              </button>

              <button
                onClick={handleExport}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <FiDownload className="w-4 h-4 mr-2" />
                {t('performanceAnalyticsPage.controls.exportReport')}
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow mb-6 overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => tab.active && setActiveTab(tab.id)}
                  disabled={!tab.active}
                  className={`
                    flex-1 py-4 px-6 text-center font-medium text-sm transition-colors
                    ${activeTab === tab.id && tab.active
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : tab.active
                        ? 'text-gray-600 hover:text-gray-800 hover:border-b-2 hover:border-gray-300'
                        : 'text-gray-400 cursor-not-allowed'
                    }
                  `}
                >
                  {tab.label}
                  {!tab.active && (
                    <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                      {t('performanceAnalyticsPage.tabs.soon')}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'ratings' && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <RatingSummaryCards
              data={summaryState.data}
              loading={summaryState.loading}
            />

            {/* Ratings by Type Chart */}
            <RatingsByTypeChart
              data={byTypeState.data}
              loading={byTypeState.loading}
            />

            {/* Ratings Trend Chart */}
            <RatingsTrendChart
              data={trendState.data}
              loading={trendState.loading}
            />

            {/* Detailed Breakdown Table */}
            <RatingsBreakdownTable
              data={breakdownState.data}
              loading={breakdownState.loading}
            />
          </div>
        )}

        {activeTab === 'operational' && (
          <div className="space-y-6">
            {/* Operational Summary Cards */}
            <OperationalSummaryCards
              data={operationalSummary.data}
              loading={operationalSummary.loading}
            />

            {/* Completion Time and SLA Distribution Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CompletionTimeChart
                data={completionByService.data}
                loading={completionByService.loading}
              />
              <SLADistributionChart
                data={slaDistribution.data}
                loading={slaDistribution.loading}
              />
            </div>

            {/* Service Performance Summary */}
            <ServicePerformanceSummary
              completionData={completionByService.data}
              slaData={slaByService.data}
              loading={completionByService.loading || slaByService.loading}
            />

            {/* SLA By Service Table */}
            <SLAByServiceTable
              data={slaByService.data}
              loading={slaByService.loading}
            />

            {/* Service Details Table */}
            <ServiceDetailsTable
              data={serviceDetails.data}
              loading={serviceDetails.loading}
            />
          </div>
        )}

        {activeTab === 'revenue' && (
          <div className="space-y-6">
            {/* Revenue Summary Cards */}
            <RevenueSummaryCards
              data={revenueSummary.data}
              loading={revenueSummary.loading}
              error={revenueSummary.error}
            />

            {/* Revenue Comparison Chart */}
            <RevenueComparisonChart
              data={revenueComparison.data}
              loading={revenueComparison.loading}
              error={revenueComparison.error}
            />

            {/* Revenue by Category Chart */}
            <RevenueByCategoryChart
              data={revenueByCategory.data}
              loading={revenueByCategory.loading}
              error={revenueByCategory.error}
            />

            {/* Internal Services and External Providers */}
            <div className="grid grid-cols-1 gap-6">
              <InternalServicesTable
                data={internalServices.data}
                loading={internalServices.loading}
                error={internalServices.error}
              />

              <ExternalProvidersTable
                data={externalProviders.data}
                loading={externalProviders.loading}
                error={externalProviders.error}
              />
            </div>

            {/* Complete Revenue Summary */}
            <CompleteSummaryTable
              data={completeSummary.data}
              loading={completeSummary.loading}
              error={completeSummary.error}
            />
          </div>
        )}

        {activeTab === 'spending' && (
          <div className="space-y-6">
            {/* Period Selector for Spending Tab */}
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700">{t('performanceAnalyticsPage.spending.viewPeriod')}</span>
                <div className="flex gap-2">
                  {['weekly', 'monthly', 'annual'].map((period) => (
                    <button
                      key={period}
                      onClick={() => handleSpendingPeriodChange(period)}
                      className={`
                        px-4 py-2 rounded-lg text-sm font-medium transition-colors
                        ${spendingPeriod === period
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }
                      `}
                    >
                      {t(`performanceAnalyticsPage.spending.${period}`)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Spending Summary Cards */}
            <SpendingSummaryCards
              data={spendingSummary.data}
              loading={spendingSummary.loading}
              error={spendingSummary.error}
            />

            {/* Spending Trend Chart */}
            <SpendingTrendChart
              data={spendingTrend.data}
              loading={spendingTrend.loading}
              error={spendingTrend.error}
              period={spendingPeriod}
            />

            {/* Service Request Chart */}
            <ServiceRequestChart
              data={serviceRequests.data}
              loading={serviceRequests.loading}
              error={serviceRequests.error}
              period={spendingPeriod}
            />

            {/* Service Popularity Table with Pie Chart */}
            <ServicePopularityTable
              data={servicePopularity.data}
              loading={servicePopularity.loading}
              error={servicePopularity.error}
            />

            {/* Comprehensive Performance Table */}
            <ComprehensivePerformanceTable
              data={comprehensive.data}
              loading={comprehensive.loading}
              error={comprehensive.error}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceAnalyticsPage;
