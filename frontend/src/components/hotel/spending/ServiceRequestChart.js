import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const ServiceRequestChart = ({ data, loading, error }) => {
  const { t, i18n } = useTranslation();
  const [selectedServices, setSelectedServices] = useState(['all']);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4 animate-pulse"></div>
        <div className="h-64 bg-gray-100 rounded animate-pulse"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">{t('performanceAnalyticsPage.spending.serviceRequestVolume.title')}</h3>
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <p className="text-red-600">{t('performanceAnalyticsPage.spending.errors.loadError', 'Error loading data')}: {error}</p>
        </div>
      </div>
    );
  }

  if (!data || !data.requestData || data.requestData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">{t('performanceAnalyticsPage.spending.serviceRequestVolume.title')}</h3>
        <div className="bg-gray-50 rounded p-8 text-center">
          <p className="text-gray-500">{t('performanceAnalyticsPage.spending.serviceRequestVolume.noData')}</p>
        </div>
      </div>
    );
  }

  // Transform data for chart
  const serviceTypes = [...new Set(data.requestData.map(item => item._id.serviceType))];
  const dates = [...new Set(data.requestData.map(item => item._id.date))].sort();

  const chartData = dates.map(date => {
    const dataPoint = { date };
    data.requestData
      .filter(item => item._id.date === date)
      .forEach(item => {
        dataPoint[item._id.serviceType] = item.requestCount;
      });
    return dataPoint;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(i18n.language || 'en-US', { month: 'short', day: 'numeric' });
  };

  const serviceColors = {
    housekeeping: '#3b82f6',
    laundry: '#8b5cf6',
    restaurant: '#f59e0b',
    transportation: '#10b981',
    maintenance: '#ef4444',
    cleaning: '#06b6d4',
    amenities: '#ec4899'
  };

  const toggleService = (service) => {
    if (service === 'all') {
      setSelectedServices(['all']);
    } else {
      const newSelected = selectedServices.includes('all')
        ? [service]
        : selectedServices.includes(service)
          ? selectedServices.filter(s => s !== service)
          : [...selectedServices, service];

      setSelectedServices(newSelected.length === 0 ? ['all'] : newSelected);
    }
  };

  const displayedServices = selectedServices.includes('all') ? serviceTypes : selectedServices;

  const translateService = (key) => t(`performanceAnalyticsPage.serviceTypes.${key}`, { defaultValue: key });

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-2">{t('performanceAnalyticsPage.spending.serviceRequestVolume.title')}</h3>
      <p className="text-sm text-gray-600 mb-4">{t('performanceAnalyticsPage.spending.serviceRequestVolume.subtitle')}</p>

      {/* Service Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => toggleService('all')}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            selectedServices.includes('all')
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {t('performanceAnalyticsPage.serviceTypes.all')}
        </button>
        {serviceTypes.map(service => (
          <button
            key={service}
            onClick={() => toggleService(service)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              selectedServices.includes(service) && !selectedServices.includes('all')
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {translateService(service)}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
          <Tooltip />
          <Legend />
          {displayedServices.map(service => (
            <Bar
              key={service}
              dataKey={service}
              fill={serviceColors[service] || '#6b7280'}
              name={translateService(service)}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ServiceRequestChart;
