import React from 'react';
import PaymentAnalytics from '../../components/superadmin/PaymentAnalytics';

const PaymentManagementPage = () => {
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Management</h1>
        <p className="text-gray-600">
          Manage hotel payments, track outstanding amounts, and generate invoices
        </p>
      </div>

      {/* Payment Analytics Component */}
      <PaymentAnalytics />
    </div>
  );
};

export default PaymentManagementPage;
