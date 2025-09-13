/**
 * QR Code Management Component
 *
 * Allows hotel admins to generate, display, and manage QR codes for guest registration
 * Includes download/print functionality and security features
 */

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  QrCodeIcon,
  ArrowDownTrayIcon,
  PrinterIcon,
  ArrowPathIcon,
  InformationCircleIcon,
  ShieldCheckIcon,
  ClockIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline';
import hotelService from '../../services/hotel.service';

const QRCodeManager = () => {
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  /**
   * Generate QR code for the hotel
   */
  const generateQRCode = async () => {
    setLoading(true);
    try {
      const response = await hotelService.generateQRCode();
      setQrData(response.data);
      toast.success('QR code generated successfully!');
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast.error(error.response?.data?.message || 'Failed to generate QR code');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Regenerate QR code with new token
   */
  const regenerateQRCode = async () => {
    setRegenerating(true);
    try {
      const response = await hotelService.regenerateQRCode();
      setQrData(response.data);
      toast.success('QR code regenerated successfully!');
    } catch (error) {
      console.error('Error regenerating QR code:', error);
      toast.error(error.response?.data?.message || 'Failed to regenerate QR code');
    } finally {
      setRegenerating(false);
    }
  };

  /**
   * Download QR code as PNG file
   */
  const downloadQRCode = async (size = 600) => {
    setDownloading(true);
    try {
      const response = await hotelService.downloadQRCode({ size });

      // Create blob and download
      const blob = new Blob([response.data], { type: 'image/png' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${qrData?.hotelInfo?.name?.replace(/[^a-zA-Z0-9]/g, '_')}_QR_Code.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('QR code downloaded successfully!');
    } catch (error) {
      console.error('Error downloading QR code:', error);
      toast.error(error.response?.data?.message || 'Failed to download QR code');
    } finally {
      setDownloading(false);
    }
  };

  /**
   * Print QR code
   */
  const printQRCode = () => {
    if (!qrData?.qrCodeImage) {
      toast.error('No QR code to print');
      return;
    }

    const printWindow = window.open('', '_blank');
    const hotelName = qrData.hotelInfo?.name || 'Hotel';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${hotelName} - Guest Registration QR Code</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              text-align: center;
              padding: 20px;
              margin: 0;
            }
            .qr-container {
              display: inline-block;
              border: 2px solid #ddd;
              padding: 30px;
              border-radius: 10px;
              background: white;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            .hotel-title {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 10px;
              color: #333;
            }
            .subtitle {
              font-size: 16px;
              color: #666;
              margin-bottom: 20px;
            }
            .qr-image {
              margin: 20px 0;
            }
            .instructions {
              font-size: 14px;
              color: #555;
              margin-top: 20px;
              line-height: 1.5;
            }
            .footer {
              font-size: 12px;
              color: #888;
              margin-top: 30px;
            }
            @media print {
              body { padding: 10px; }
              .qr-container { box-shadow: none; }
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <div class="hotel-title">${hotelName}</div>
            <div class="subtitle">Guest Registration QR Code</div>
            <div class="qr-image">
              <img src="${qrData.qrCodeImage}" alt="QR Code" style="max-width: 300px; height: auto;" />
            </div>
            <div class="instructions">
              <strong>How to use:</strong><br>
              1. Guests scan this QR code with their mobile device<br>
              2. Registration form opens with hotel pre-selected<br>
              3. Guest completes registration with their details<br>
              4. Guest can immediately access hotel services
            </div>
            <div class="footer">
              Generated: ${new Date().toLocaleDateString()}<br>
              Expires: ${new Date(qrData.expiresAt).toLocaleDateString()}
            </div>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  /**
   * Copy QR URL to clipboard
   */
  const copyQRUrl = async () => {
    if (!qrData?.qrUrl) {
      toast.error('No QR URL to copy');
      return;
    }

    try {
      await navigator.clipboard.writeText(qrData.qrUrl);
      toast.success('QR URL copied to clipboard!');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast.error('Failed to copy URL to clipboard');
    }
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Load initial QR code on component mount
  useEffect(() => {
    generateQRCode();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <QrCodeIcon className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">QR Code Management</h1>
              <p className="text-gray-600">Generate QR codes for guest registration</p>
            </div>
          </div>

          <button
            onClick={() => setShowInfo(!showInfo)}
            className="flex items-center space-x-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <InformationCircleIcon className="h-5 w-5" />
            <span>Info</span>
          </button>
        </div>
      </div>

      {/* Information Panel */}
      {showInfo && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">How QR Code Registration Works</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-blue-800 mb-2">For Hotel Staff:</h4>
              <ul className="text-blue-700 space-y-1 text-sm">
                <li>• Display QR code at reception desk</li>
                <li>• Print multiple copies for different locations</li>
                <li>• Regenerate periodically for security</li>
                <li>• Monitor guest registrations</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-blue-800 mb-2">For Guests:</h4>
              <ul className="text-blue-700 space-y-1 text-sm">
                <li>• Scan QR code with mobile device</li>
                <li>• Registration form opens automatically</li>
                <li>• Hotel information is pre-filled</li>
                <li>• Complete registration with personal details</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* QR Code Display */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Current QR Code</h2>

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : qrData ? (
              <div className="space-y-4">
                {/* QR Code Image */}
                <div className="bg-white p-4 rounded-lg border border-gray-200 inline-block">
                  <img
                    src={qrData.qrCodeImage}
                    alt="Hotel Registration QR Code"
                    className="w-64 h-64 mx-auto"
                  />
                </div>

                {/* Hotel Information */}
                <div className="text-sm text-gray-600">
                  <p className="font-medium text-gray-900">{qrData.hotelInfo?.name}</p>
                  {qrData.hotelInfo?.address && (
                    <p>{qrData.hotelInfo.address.street}, {qrData.hotelInfo.address.city}</p>
                  )}
                </div>

                {/* QR Code Details */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-center space-x-2 text-green-600">
                    <ShieldCheckIcon className="h-4 w-4" />
                    <span>Secure JWT Token</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2 text-blue-600">
                    <ClockIcon className="h-4 w-4" />
                    <span>Expires: {formatDate(qrData.expiresAt)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-gray-500 py-8">
                <QrCodeIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p>No QR code generated yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Actions Panel */}
        <div className="space-y-6">
          {/* Primary Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
            <div className="space-y-3">
              <button
                onClick={generateQRCode}
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <QrCodeIcon className="h-5 w-5" />
                <span>{loading ? 'Generating...' : 'Generate New QR Code'}</span>
              </button>

              <button
                onClick={regenerateQRCode}
                disabled={!qrData || regenerating}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ArrowPathIcon className="h-5 w-5" />
                <span>{regenerating ? 'Regenerating...' : 'Regenerate QR Code'}</span>
              </button>
            </div>
          </div>

          {/* Download & Print Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Download & Print</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => downloadQRCode(600)}
                  disabled={!qrData || downloading}
                  className="flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ArrowDownTrayIcon className="h-4 w-4" />
                  <span>Download</span>
                </button>

                <button
                  onClick={printQRCode}
                  disabled={!qrData}
                  className="flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <PrinterIcon className="h-4 w-4" />
                  <span>Print</span>
                </button>
              </div>

              <div className="text-sm text-gray-600">
                <p className="mb-2">Download sizes:</p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => downloadQRCode(300)}
                    disabled={!qrData || downloading}
                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-xs transition-colors"
                  >
                    Small (300px)
                  </button>
                  <button
                    onClick={() => downloadQRCode(600)}
                    disabled={!qrData || downloading}
                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-xs transition-colors"
                  >
                    Medium (600px)
                  </button>
                  <button
                    onClick={() => downloadQRCode(1200)}
                    disabled={!qrData || downloading}
                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-xs transition-colors"
                  >
                    Large (1200px)
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Share & Copy */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Share</h3>
            <button
              onClick={copyQRUrl}
              disabled={!qrData}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <DocumentDuplicateIcon className="h-5 w-5" />
              <span>Copy Registration URL</span>
            </button>
            {qrData?.qrUrl && (
              <div className="mt-3 p-3 bg-gray-50 rounded text-xs text-gray-600 break-all">
                {qrData.qrUrl}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Security Information */}
      {qrData?.metadata && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Features</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-800 mb-2">Security Features:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                {qrData.metadata.securityFeatures?.map((feature, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <ShieldCheckIcon className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-800 mb-2">Usage Instructions:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                {qrData.metadata.usageInstructions?.map((instruction, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="text-blue-500 font-bold mt-0.5">{index + 1}.</span>
                    <span>{instruction}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRCodeManager;
