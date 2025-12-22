/**
 * QR Code Management Component
 *
 * Allows hotel admins to generate, display, and manage QR codes for guest registration
 * Includes download/print functionality and security features
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
import { useTheme } from '../../context/ThemeContext';

const QRCodeManager = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
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
      toast.success(t('hotelAdmin.qrCode.toastMessages.generateSuccess'));
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast.error(error.response?.data?.message || t('hotelAdmin.qrCode.toastMessages.generateError'));
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
      toast.error(error.response?.data?.message || t('hotelAdmin.qrCode.toastMessages.regenerateError'));
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
      toast.error(error.response?.data?.message || t('hotelAdmin.qrCode.toastMessages.downloadError'));
    } finally {
      setDownloading(false);
    }
  };

  /**
   * Print QR code
   */
  const printQRCode = () => {
    if (!qrData?.qrCodeImage) {
      toast.error(t('hotelAdmin.qrCode.toastMessages.noPrint'));
      return;
    }

    const printWindow = window.open('', '_blank');
    const hotelName = qrData.hotelInfo?.name || 'Hotel';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${hotelName} - ${t('hotelAdmin.qrCode.printTemplate.title')}</title>
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
            <div class="subtitle">${t('hotelAdmin.qrCode.printTemplate.subtitle')}</div>
            <div class="qr-image">
              <img src="${qrData.qrCodeImage}" alt="QR Code" style="max-width: 300px; height: auto;" />
            </div>
            <div class="instructions">
              <strong>${t('hotelAdmin.qrCode.printTemplate.howToUse')}:</strong><br>
              ${t('hotelAdmin.qrCode.printTemplate.step1')}<br>
              ${t('hotelAdmin.qrCode.printTemplate.step2')}<br>
              ${t('hotelAdmin.qrCode.printTemplate.step3')}<br>
              ${t('hotelAdmin.qrCode.printTemplate.step4')}
            </div>
            <div class="footer">
              ${t('hotelAdmin.qrCode.printTemplate.generated')}: ${new Date().toLocaleDateString()}<br>
              ${t('hotelAdmin.qrCode.printTemplate.expires')}: ${new Date(qrData.expiresAt).toLocaleDateString()}
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
      toast.error(t('hotelAdmin.qrCode.toastMessages.noUrl'));
      return;
    }

    try {
      await navigator.clipboard.writeText(qrData.qrUrl);
      toast.success(t('hotelAdmin.qrCode.toastMessages.copySuccess'));
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast.error(t('hotelAdmin.qrCode.toastMessages.copyError'));
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
    <div className="w-full p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-300 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <QrCodeIcon className="h-8 w-8" style={{ color: theme.primaryColor }} />
            <div>
              <h1 className="text-2xl font-bold text-black">{t('hotelAdmin.qrCode.title')}</h1>
              <p className="text-black">{t('hotelAdmin.qrCode.subtitle')}</p>
            </div>
          </div>

          <button
            onClick={() => setShowInfo(!showInfo)}
            className="flex items-center space-x-2 px-4 py-2 text-white rounded-lg transition-colors"
            style={{ backgroundColor: theme.secondaryColor }}
            onMouseEnter={(e) => e.target.style.backgroundColor = theme.primaryColor}
            onMouseLeave={(e) => e.target.style.backgroundColor = theme.secondaryColor}
          >
            <InformationCircleIcon className="h-5 w-5" />
            <span>{t('hotelAdmin.qrCode.info')}</span>
          </button>
        </div>
      </div>

      {/* Information Panel */}
      {showInfo && (
        <div className="bg-white border rounded-lg p-6" style={{ borderColor: theme.secondaryColor }}>
          <h3 className="text-lg font-semibold text-black mb-4">{t('hotelAdmin.qrCode.infoPanel.title')}</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-black mb-2">{t('hotelAdmin.qrCode.infoPanel.forHotelStaff')}</h4>
              <ul className="text-black space-y-1 text-sm">
                <li>• {t('hotelAdmin.qrCode.infoPanel.hotelStaffInstructions.0')}</li>
                <li>• {t('hotelAdmin.qrCode.infoPanel.hotelStaffInstructions.1')}</li>
                <li>• {t('hotelAdmin.qrCode.infoPanel.hotelStaffInstructions.2')}</li>
                <li>• {t('hotelAdmin.qrCode.infoPanel.hotelStaffInstructions.3')}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-black mb-2">{t('hotelAdmin.qrCode.infoPanel.forGuests')}</h4>
              <ul className="text-black space-y-1 text-sm">
                <li>• {t('hotelAdmin.qrCode.infoPanel.guestInstructions.0')}</li>
                <li>• {t('hotelAdmin.qrCode.infoPanel.guestInstructions.1')}</li>
                <li>• {t('hotelAdmin.qrCode.infoPanel.guestInstructions.2')}</li>
                <li>• {t('hotelAdmin.qrCode.infoPanel.guestInstructions.3')}</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* QR Code Display */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-300 p-6">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-black mb-4">{t('hotelAdmin.qrCode.currentQRCode')}</h2>

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: theme.primaryColor }}></div>
              </div>
            ) : qrData ? (
              <div className="space-y-4">
                {/* QR Code Image */}
                <div className="bg-white p-4 rounded-lg border border-gray-300 inline-block">
                  <img
                    src={qrData.qrCodeImage}
                    alt={t('hotelAdmin.qrCode.hotelRegistrationQR')}
                    className="w-64 h-64 mx-auto"
                  />
                </div>

                {/* Hotel Information */}
                <div className="text-sm text-black">
                  <p className="font-medium text-black">{qrData.hotelInfo?.name}</p>
                  {qrData.hotelInfo?.address && (
                    <p>{qrData.hotelInfo.address.street}, {qrData.hotelInfo.address.city}</p>
                  )}
                </div>

                {/* QR Code Details */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-center space-x-2" style={{ color: theme.primaryColor }}>
                    <ShieldCheckIcon className="h-4 w-4" />
                    <span>{t('hotelAdmin.qrCode.secureToken')}</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2" style={{ color: theme.secondaryColor }}>
                    <ClockIcon className="h-4 w-4" />
                    <span>{t('hotelAdmin.qrCode.expires')} {formatDate(qrData.expiresAt)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-black py-8">
                <QrCodeIcon className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <p>{t('hotelAdmin.qrCode.noQRGenerated')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Actions Panel */}
        <div className="space-y-6">
          {/* Primary Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-300 p-6">
            <h3 className="text-lg font-semibold text-black mb-4">{t('hotelAdmin.qrCode.actions.title')}</h3>
            <div className="space-y-3">
              <button
                onClick={generateQRCode}
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                style={{ backgroundColor: loading ? '#gray' : theme.primaryColor }}
                onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = theme.secondaryColor)}
                onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = theme.primaryColor)}
              >
                <QrCodeIcon className="h-5 w-5" />
                <span>{loading ? t('hotelAdmin.qrCode.actions.generating') : t('hotelAdmin.qrCode.actions.generateNew')}</span>
              </button>

              <button
                onClick={regenerateQRCode}
                disabled={!qrData || regenerating}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                style={{ backgroundColor: (!qrData || regenerating) ? '#gray' : theme.secondaryColor }}
                onMouseEnter={(e) => (!qrData || regenerating) || (e.target.style.backgroundColor = theme.primaryColor)}
                onMouseLeave={(e) => (!qrData || regenerating) || (e.target.style.backgroundColor = theme.secondaryColor)}
              >
                <ArrowPathIcon className="h-5 w-5" />
                <span>{regenerating ? t('hotelAdmin.qrCode.actions.regenerating') : t('hotelAdmin.qrCode.actions.regenerate')}</span>
              </button>
            </div>
          </div>

          {/* Download & Print Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-300 p-6">
            <h3 className="text-lg font-semibold text-black mb-4">{t('hotelAdmin.qrCode.downloadPrint.title')}</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => downloadQRCode(600)}
                  disabled={!qrData || downloading}
                  className="flex items-center justify-center space-x-2 px-4 py-2 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  style={{ backgroundColor: (!qrData || downloading) ? '#gray' : theme.primaryColor }}
                  onMouseEnter={(e) => (!qrData || downloading) || (e.target.style.backgroundColor = theme.secondaryColor)}
                  onMouseLeave={(e) => (!qrData || downloading) || (e.target.style.backgroundColor = theme.primaryColor)}
                >
                  <ArrowDownTrayIcon className="h-4 w-4" />
                  <span>{t('hotelAdmin.qrCode.downloadPrint.download')}</span>
                </button>

                <button
                  onClick={printQRCode}
                  disabled={!qrData}
                  className="flex items-center justify-center space-x-2 px-4 py-2 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  style={{ backgroundColor: !qrData ? '#gray' : theme.secondaryColor }}
                  onMouseEnter={(e) => !qrData || (e.target.style.backgroundColor = theme.primaryColor)}
                  onMouseLeave={(e) => !qrData || (e.target.style.backgroundColor = theme.secondaryColor)}
                >
                  <PrinterIcon className="h-4 w-4" />
                  <span>{t('hotelAdmin.qrCode.downloadPrint.print')}</span>
                </button>
              </div>

              <div className="text-sm text-black">
                <p className="mb-2">{t('hotelAdmin.qrCode.downloadPrint.downloadSizes')}</p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => downloadQRCode(300)}
                    disabled={!qrData || downloading}
                    className="px-3 py-2 bg-white border border-gray-300 hover:border-gray-400 rounded text-xs transition-colors text-black"
                    style={{ backgroundColor: (!qrData || downloading) ? '#f5f5f5' : 'white' }}
                  >
                    {t('hotelAdmin.qrCode.downloadPrint.small')}
                  </button>
                  <button
                    onClick={() => downloadQRCode(600)}
                    disabled={!qrData || downloading}
                    className="px-3 py-2 bg-white border border-gray-300 hover:border-gray-400 rounded text-xs transition-colors text-black"
                    style={{ backgroundColor: (!qrData || downloading) ? '#f5f5f5' : 'white' }}
                  >
                    {t('hotelAdmin.qrCode.downloadPrint.medium')}
                  </button>
                  <button
                    onClick={() => downloadQRCode(1200)}
                    disabled={!qrData || downloading}
                    className="px-3 py-2 bg-white border border-gray-300 hover:border-gray-400 rounded text-xs transition-colors text-black"
                    style={{ backgroundColor: (!qrData || downloading) ? '#f5f5f5' : 'white' }}
                  >
                    {t('hotelAdmin.qrCode.downloadPrint.large')}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Share & Copy */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-300 p-6">
            <h3 className="text-lg font-semibold text-black mb-4">{t('hotelAdmin.qrCode.share.title')}</h3>
            <button
              onClick={copyQRUrl}
              disabled={!qrData}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              style={{ backgroundColor: !qrData ? '#gray' : 'black' }}
              onMouseEnter={(e) => !qrData || (e.target.style.backgroundColor = '#3B5787')}
              onMouseLeave={(e) => !qrData || (e.target.style.backgroundColor = 'black')}
            >
              <DocumentDuplicateIcon className="h-5 w-5" />
              <span>{t('hotelAdmin.qrCode.share.copyUrl')}</span>
            </button>
            {qrData?.qrUrl && (
              <div className="mt-3 p-3 bg-white border border-gray-300 rounded text-xs text-black break-all">
                {qrData.qrUrl}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Security Information */}
      {qrData && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-300 p-6">
          <h3 className="text-lg font-semibold text-black mb-4">{t('hotelAdmin.qrCode.security.title')}</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-black mb-2">{t('hotelAdmin.qrCode.security.featuresLabel')}:</h4>
              <ul className="text-sm text-black space-y-1">
                {t('hotelAdmin.qrCode.security.features', { returnObjects: true }).map((feature, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <ShieldCheckIcon className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: '#3B5787' }} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-black mb-2">{t('hotelAdmin.qrCode.security.usageLabel')}:</h4>
              <ul className="text-sm text-black space-y-1">
                {t('hotelAdmin.qrCode.security.instructions', { returnObjects: true }).map((instruction, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="font-bold mt-0.5" style={{ color: '#67BAE0' }}>{index + 1}.</span>
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
