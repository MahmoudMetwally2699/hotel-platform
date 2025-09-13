/**
 * QR Code Management Page
 *
 * Hotel admin page for managing QR codes for guest registration
 * Provides full QR code lifecycle management
 */

import React from 'react';
import { Helmet } from 'react-helmet-async';
import QRCodeManager from '../../components/hotel/QRCodeManager';

const QRCodePage = () => {
  return (
    <>
      <Helmet>
        <title>QR Code Management - Hotel Admin</title>
        <meta name="description" content="Generate and manage QR codes for guest registration" />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        <QRCodeManager />
      </div>
    </>
  );
};

export default QRCodePage;
