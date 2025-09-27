import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '../../config/api.config';

const PaymentAnalytics = () => {
  const [paymentData, setPaymentData] = useState(null);
  const [availableHotels, setAvailableHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedHotel, setSelectedHotel] = useState('all');
  const [timeRange, setTimeRange] = useState('30');
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [showMarkPaymentModal, setShowMarkPaymentModal] = useState(false);

  // Form state for recording payment
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMethod: 'bank_transfer',
    transactionReference: '',
    notes: '',
    hotelId: ''
  });

  // Function to get online payment total for a specific hotel
  const getHotelOnlineTotal = (hotelId) => {
    if (!paymentData || !hotelId) return 0;

    // Find the hotel in analytics data
    const hotelAnalytics = paymentData.analytics?.find(hotel => hotel.hotelId === hotelId);
    if (!hotelAnalytics) return 0;

    // Find online payment method
    const onlinePayment = hotelAnalytics.payments?.find(payment => payment.paymentMethod === 'online');
    return onlinePayment?.totalAmount || 0;
  };

  // Handle hotel selection change
  const handleHotelSelectionChange = (hotelId) => {
    const onlineTotal = getHotelOnlineTotal(hotelId);
    setPaymentForm({
      ...paymentForm,
      hotelId: hotelId,
      amount: onlineTotal.toString()
    });
  };

  // Fetch available hotels for dropdown
  const fetchAvailableHotels = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json'
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/superadmin/hotels`, {
        method: 'GET',
        headers,
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        const hotels = data.data?.hotels || [];
        setAvailableHotels(hotels);
      }
    } catch (error) {
      console.error('Error fetching hotels:', error);
    }
  }, []);

  // Fetch payment analytics data
  const fetchPaymentAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json'
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const params = new URLSearchParams({
        timeRange,
        ...(selectedHotel !== 'all' && { hotelId: selectedHotel })
      });

      const response = await fetch(`${API_BASE_URL}/superadmin/payment-analytics?${params}`, {
        method: 'GET',
        headers,
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Payment Analytics API Response:', data.data);
        setPaymentData(data.data);
      } else {
        toast.error('Failed to fetch payment analytics');
      }
    } catch (error) {
      console.error('Error fetching payment analytics:', error);
      toast.error('Error loading payment analytics');
    } finally {
      setLoading(false);
    }
  }, [selectedHotel, timeRange]);

  // Fetch payment history
  const fetchPaymentHistory = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json'
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const params = new URLSearchParams({
        limit: '10',
        ...(selectedHotel !== 'all' && { hotelId: selectedHotel })
      });

      const response = await fetch(`${API_BASE_URL}/superadmin/payment-history?${params}`, {
        method: 'GET',
        headers,
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setPaymentHistory(data.data.payments || []);
      }
    } catch (error) {
      console.error('Error fetching payment history:', error);
    }
  }, [selectedHotel]);

  // Record payment
  const recordPayment = async (e) => {
    e.preventDefault();

    if (!paymentForm.amount || !paymentForm.hotelId) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json'
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Use the same time range as the analytics (not monthly dates)
      const days = parseInt(timeRange);
      const endDate = new Date();
      const startDate = new Date(Date.now() - (days * 24 * 60 * 60 * 1000));

      const requestBody = {
        hotelId: paymentForm.hotelId,
        amount: parseFloat(paymentForm.amount),
        paymentMethod: paymentForm.paymentMethod,
        transactionReference: paymentForm.transactionReference,
        notes: paymentForm.notes,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        isManualEntry: true
      };

      const response = await fetch(`${API_BASE_URL}/superadmin/mark-hotel-payment`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        toast.success('Payment recorded successfully');
        setShowMarkPaymentModal(false);
        setPaymentForm({
          amount: '',
          paymentMethod: 'bank_transfer',
          transactionReference: '',
          notes: '',
          hotelId: ''
        });
        fetchPaymentAnalytics();
        fetchPaymentHistory();
      } else {
        toast.error('Failed to record payment');
      }
    } catch (error) {
      console.error('Error recording payment:', error);
      toast.error('Error processing payment');
    }
  };

  // Generate and download invoice
  const downloadInvoice = async (paymentId, format = 'pdf') => {
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json'
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/superadmin/generate-invoice`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          paymentId,
          format
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `invoice-${paymentId}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success(`${format.toUpperCase()} invoice downloaded`);
      } else {
        toast.error(`Failed to generate ${format.toUpperCase()} invoice`);
      }
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast.error('Error generating invoice');
    }
  };

  useEffect(() => {
    fetchAvailableHotels();
    fetchPaymentAnalytics();
    fetchPaymentHistory();
  }, [fetchAvailableHotels, fetchPaymentAnalytics, fetchPaymentHistory]);

  if (loading && !paymentData) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const totals = paymentData?.totals || {};
  const onlineTotal = totals.online || { totalAmount: 0, hotelEarnings: 0, count: 0 };
  const cashTotal = totals.cash || { totalAmount: 0, hotelEarnings: 0, count: 0 };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time Range</label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
              <option value="365">Last Year</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hotel Filter</label>
            <select
              value={selectedHotel}
              onChange={(e) => setSelectedHotel(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Hotels</option>
              {availableHotels.map(hotel => (
                <option key={hotel._id} value={hotel._id}>
                  {hotel.name}
                </option>
              ))}
            </select>
          </div>

          <div className="ml-auto">
            <button
              onClick={() => {
                fetchPaymentAnalytics();
                fetchPaymentHistory();
              }}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      {/* Record Payment Button */}
      <div className="flex justify-end">
        <button
          onClick={() => {
            setPaymentForm({
              amount: '',
              paymentMethod: 'bank_transfer',
              transactionReference: '',
              notes: '',
              hotelId: ''
            });
            setShowMarkPaymentModal(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md text-sm font-medium flex items-center"
        >
          💰 Record Payment
        </button>
      </div>

      {/* Payment Method Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Online Payments Card */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Online Payments</h3>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">💳</span>
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 mb-1">
              ${onlineTotal.totalAmount.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">Total Amount</div>
          </div>
        </div>

        {/* Cash Payments Card */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Cash Payments</h3>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">💵</span>
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 mb-1">
              ${cashTotal.totalAmount.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">Total Amount</div>
          </div>
        </div>
      </div>

      {/* Payment History - Always show */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Payment History</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hotel
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paymentHistory.length > 0 ? (
                paymentHistory.map((payment) => (
                  <tr key={payment._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {payment.hotelId.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        ${payment.paymentDetails?.paidAmount?.toLocaleString() || payment.totalEarnings?.toLocaleString() || '0'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {payment.paymentDetails?.paymentDate ? new Date(payment.paymentDetails.paymentDate).toDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {payment.paymentDetails?.paymentMethod?.replace('_', ' ') || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        payment.paymentStatus === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {payment.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => downloadInvoice(payment._id, 'csv')}
                        className="text-green-600 hover:text-green-900"
                        title="Download CSV"
                      >
                        📊 CSV
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <div className="text-4xl mb-2">📋</div>
                      <p className="text-lg font-medium">No Payment History</p>
                      <p className="text-sm">Payment history will appear here once payments are processed</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      {showMarkPaymentModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 text-center mb-4">
                Record New Payment
              </h3>
              <form onSubmit={recordPayment} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Hotel</label>
                  <select
                    value={paymentForm.hotelId || ''}
                    onChange={(e) => handleHotelSelectionChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select a hotel...</option>
                    {availableHotels.map((hotel) => (
                      <option key={hotel._id} value={hotel._id}>
                        {hotel.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount Paid
                    <span className="text-xs text-blue-600 ml-1">(Auto-populated from Online Payments)</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={paymentForm.amount}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 cursor-not-allowed focus:outline-none"
                    required
                  />
                  {paymentForm.amount && (
                    <p className="text-xs text-gray-500 mt-1">
                      ${parseFloat(paymentForm.amount).toFixed(2)} will be recorded as paid
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                  <select
                    value={paymentForm.paymentMethod}
                    onChange={(e) => setPaymentForm({...paymentForm, paymentMethod: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="check">Check</option>
                    <option value="cash">Cash</option>
                    <option value="digital_wallet">Digital Wallet</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Reference</label>
                  <input
                    type="text"
                    value={paymentForm.transactionReference}
                    onChange={(e) => setPaymentForm({...paymentForm, transactionReference: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Transaction ID or Reference"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={paymentForm.notes}
                    onChange={(e) => setPaymentForm({...paymentForm, notes: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Additional notes..."
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    Record Payment
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowMarkPaymentModal(false);
                      setPaymentForm({
                        amount: '',
                        paymentMethod: 'bank_transfer',
                        transactionReference: '',
                        notes: '',
                        hotelId: ''
                      });
                    }}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentAnalytics;
