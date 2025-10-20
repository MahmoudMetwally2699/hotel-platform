/**
 * Operational Efficiency Page
 *
 * Comprehensive dashboard for monitoring service operational efficiency
 * including response times, completion times, SLA compliance, and delays
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FiRefreshCw } from 'react-icons/fi';
import toast from 'react-hot-toast';

// Redux actions
import {
  fetchOperationalSummary,
  fetchCompletionByService,
  fetchSLAByService,
  fetchSLADistribution,
  fetchServiceDetails,
  clearOperationalErrors
} from '../../redux/slices/hotelOperationalSlice';

// Components
import OperationalSummaryCards from '../../components/hotel/operational/OperationalSummaryCards';
import CompletionTimeChart from '../../components/hotel/operational/CompletionTimeChart';
import SLAByServiceTable from '../../components/hotel/operational/SLAByServiceTable';
import SLADistributionChart from '../../components/hotel/operational/SLADistributionChart';
import ServiceDetailsTable from '../../components/hotel/operational/ServiceDetailsTable';
import ServicePerformanceSummary from '../../components/hotel/operational/ServicePerformanceSummary';

const OperationalEfficiencyPage = () => {
  const dispatch = useDispatch();

  // Redux state
  const {
    summary,
    completionByService,
    slaByService,
    slaDistribution,
    serviceDetails
  } = useSelector((state) => state.hotelOperational);

  // Local state
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('thisMonth');
  const [customDates, setCustomDates] = useState({ start: '', end: '' });
  const [selectedService, setSelectedService] = useState('all');

  // Service types for filter dropdown
  const serviceTypes = [
    { value: 'all', label: 'All Services' },
    { value: 'laundry', label: 'Laundry' },
    { value: 'housekeeping', label: 'Housekeeping (All)' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'cleaning', label: 'Cleaning' },
    { value: 'amenities', label: 'Amenities' },
    { value: 'transportation', label: 'Transportation' },
    { value: 'dining', label: 'Dining' }
  ];

  // Date range presets
  const datePresets = [
    { value: 'today', label: 'Today' },
    { value: 'thisWeek', label: 'This Week' },
    { value: 'thisMonth', label: 'This Month' },
    { value: 'last7Days', label: 'Last 7 Days' },
    { value: 'last30Days', label: 'Last 30 Days' },
    { value: 'allTime', label: 'All Time' },
    { value: 'custom', label: 'Custom Range' }
  ];

  // Calculate date range
  const getDateRange = useCallback(() => {
    const now = new Date();
    let startDate, endDate;

    switch (dateRange) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        endDate = new Date(now.setHours(23, 59, 59, 999));
        break;
      case 'thisWeek':
        const dayOfWeek = now.getDay();
        const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        startDate = new Date(now.setDate(diff));
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date();
        break;
      case 'thisMonth':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date();
        break;
      case 'last7Days':
        startDate = new Date(now.setDate(now.getDate() - 7));
        endDate = new Date();
        break;
      case 'last30Days':
        startDate = new Date(now.setDate(now.getDate() - 30));
        endDate = new Date();
        break;
      case 'allTime':
        // Last 2 years
        startDate = new Date(now.setFullYear(now.getFullYear() - 2));
        endDate = new Date();
        break;
      case 'custom':
        if (customDates.start && customDates.end) {
          startDate = new Date(customDates.start);
          endDate = new Date(customDates.end);
        } else {
          return null;
        }
        break;
      default:
        startDate = new Date(now.setDate(now.getDate() - 30));
        endDate = new Date();
    }

    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    };
  }, [dateRange, customDates]);

  // Fetch all data
  const fetchAllData = useCallback(() => {
    const dates = getDateRange();
    if (!dates) {
      toast.error('Please select valid custom dates');
      return;
    }

    const params = {
      startDate: dates.startDate,
      endDate: dates.endDate,
      serviceType: selectedService
    };

    dispatch(fetchOperationalSummary(params));
    dispatch(fetchCompletionByService(params));
    dispatch(fetchSLAByService(params));
    dispatch(fetchSLADistribution(params));

    if (activeTab === 'details') {
      dispatch(fetchServiceDetails(params));
    }
  }, [dispatch, getDateRange, selectedService, activeTab]);

  // Initial load and refetch on filter changes
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'details' && !serviceDetails.data) {
      const dates = getDateRange();
      if (dates) {
        dispatch(fetchServiceDetails({
          ...dates,
          serviceType: selectedService
        }));
      }
    }
  };

  // Handle date range change
  const handleDateRangeChange = (value) => {
    setDateRange(value);
    if (value !== 'custom') {
      setCustomDates({ start: '', end: '' });
    }
  };

  // Handle service filter change
  const handleServiceFilterChange = (value) => {
    setSelectedService(value);
  };

  // Handle custom date change
  const handleCustomDateChange = (field, value) => {
    setCustomDates(prev => ({ ...prev, [field]: value }));
  };

  // Handle refresh
  const handleRefresh = () => {
    dispatch(clearOperationalErrors());
    fetchAllData();
    toast.success('Data refreshed successfully');
  };

  // Check for errors
  useEffect(() => {
    if (summary.error) toast.error(summary.error);
    if (completionByService.error) toast.error(completionByService.error);
    if (slaByService.error) toast.error(slaByService.error);
    if (slaDistribution.error) toast.error(slaDistribution.error);
    if (serviceDetails.error) toast.error(serviceDetails.error);
  }, [
    summary.error,
    completionByService.error,
    slaByService.error,
    slaDistribution.error,
    serviceDetails.error
  ]);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'performance', label: 'Performance Analysis' },
    { id: 'details', label: 'Detailed View' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Operational Efficiency Dashboard
          </h1>
          <p className="text-gray-600">
            Monitor service response times, completion metrics, and SLA compliance
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Date Range Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Range
              </label>
              <select
                value={dateRange}
                onChange={(e) => handleDateRangeChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {datePresets.map(preset => (
                  <option key={preset.value} value={preset.value}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Service Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service Type
              </label>
              <select
                value={selectedService}
                onChange={(e) => handleServiceFilterChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {serviceTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Refresh Button */}
            <div className="flex items-end">
              <button
                onClick={handleRefresh}
                className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FiRefreshCw className="w-4 h-4 mr-2" />
                Refresh Data
              </button>
            </div>
          </div>

          {/* Custom Date Range */}
          {dateRange === 'custom' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={customDates.start}
                  onChange={(e) => handleCustomDateChange('start', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={customDates.end}
                  onChange={(e) => handleCustomDateChange('end', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content based on active tab */}
        <div>
          {activeTab === 'overview' && (
            <>
              <OperationalSummaryCards data={summary.data} loading={summary.loading} />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <CompletionTimeChart data={completionByService.data} loading={completionByService.loading} />
                <SLADistributionChart data={slaDistribution.data} loading={slaDistribution.loading} />
              </div>
            </>
          )}

          {activeTab === 'performance' && (
            <>
              <ServicePerformanceSummary
                completionData={completionByService.data}
                slaData={slaByService.data}
                loading={completionByService.loading || slaByService.loading}
              />

              <div className="mt-6">
                <SLAByServiceTable data={slaByService.data} loading={slaByService.loading} />
              </div>
            </>
          )}

          {activeTab === 'details' && (
            <>
              <ServiceDetailsTable data={serviceDetails.data} loading={serviceDetails.loading} />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OperationalEfficiencyPage;
