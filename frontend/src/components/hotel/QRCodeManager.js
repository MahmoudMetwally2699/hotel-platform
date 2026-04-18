/**
 * QR Code Management Component
 *
 * Allows hotel admins to generate, display, and manage QR codes for guest registration and login
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
  DocumentDuplicateIcon,
  ArrowRightOnRectangleIcon,
  UserPlusIcon
} from '@heroicons/react/24/outline';
import hotelService from '../../services/hotel.service';
import { useTheme } from '../../context/ThemeContext';

const QRCodeManager = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('registration'); // 'registration' or 'login'

  // Registration QR state
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Login QR state
  const [loginQrData, setLoginQrData] = useState(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginRegenerating, setLoginRegenerating] = useState(false);
  const [loginDownloading, setLoginDownloading] = useState(false);

  const [showInfo, setShowInfo] = useState(false);

  // ==================== Registration QR Methods ====================

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

  const downloadQRCode = async (size = 600) => {
    setDownloading(true);
    try {
      const response = await hotelService.downloadQRCode({ size });
      const blob = new Blob([response.data], { type: 'image/png' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${qrData?.hotelInfo?.name?.replace(/[^a-zA-Z0-9]/g, '_')}_Registration_QR_Code.png`;
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

  const printQRCode = () => {
    if (!qrData?.qrCodeImage) {
      toast.error(t('hotelAdmin.qrCode.toastMessages.noPrint'));
      return;
    }
    printQRHelper(qrData, t('hotelAdmin.qrCode.printTemplate.subtitle'));
  };

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

  // ==================== Login QR Methods ====================

  const generateLoginQRCode = async () => {
    setLoginLoading(true);
    try {
      const response = await hotelService.generateLoginQRCode();
      setLoginQrData(response.data);
      toast.success('Login QR code generated successfully!');
    } catch (error) {
      console.error('Error generating login QR code:', error);
      toast.error(error.response?.data?.message || 'Failed to generate login QR code');
    } finally {
      setLoginLoading(false);
    }
  };

  const regenerateLoginQRCode = async () => {
    setLoginRegenerating(true);
    try {
      const response = await hotelService.regenerateLoginQRCode();
      setLoginQrData(response.data);
      toast.success('Login QR code regenerated successfully!');
    } catch (error) {
      console.error('Error regenerating login QR code:', error);
      toast.error(error.response?.data?.message || 'Failed to regenerate login QR code');
    } finally {
      setLoginRegenerating(false);
    }
  };

  const downloadLoginQRCode = async (size = 600) => {
    setLoginDownloading(true);
    try {
      const response = await hotelService.downloadLoginQRCode({ size });
      const blob = new Blob([response.data], { type: 'image/png' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${loginQrData?.hotelInfo?.name?.replace(/[^a-zA-Z0-9]/g, '_')}_Login_QR_Code.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Login QR code downloaded successfully!');
    } catch (error) {
      console.error('Error downloading login QR code:', error);
      toast.error(error.response?.data?.message || 'Failed to download login QR code');
    } finally {
      setLoginDownloading(false);
    }
  };

  const printLoginQRCode = () => {
    if (!loginQrData?.qrCodeImage) {
      toast.error(t('hotelAdmin.qrCode.toastMessages.noPrint'));
      return;
    }
    printQRHelper(loginQrData, 'Scan to Login');
  };

  const copyLoginQRUrl = async () => {
    if (!loginQrData?.qrUrl) {
      toast.error(t('hotelAdmin.qrCode.toastMessages.noUrl'));
      return;
    }
    try {
      await navigator.clipboard.writeText(loginQrData.qrUrl);
      toast.success('Login URL copied to clipboard!');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast.error(t('hotelAdmin.qrCode.toastMessages.copyError'));
    }
  };

  // ==================== Shared Helpers ====================

  const printQRHelper = (data, subtitle) => {
    const printWindow = window.open('', '_blank');
    const hotelName = data.hotelInfo?.name || 'Hotel';

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
            <div class="subtitle">${subtitle}</div>
            <div class="qr-image">
              <img src="${data.qrCodeImage}" alt="QR Code" style="max-width: 300px; height: auto;" />
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
              ${t('hotelAdmin.qrCode.printTemplate.expires')}: ${new Date(data.expiresAt).toLocaleDateString()}
            </div>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Load initial QR codes on mount
  useEffect(() => {
    generateQRCode();
    generateLoginQRCode();
  }, []);

  // ==================== Render Helpers ====================

  const renderQRDisplay = (data, isLoading, label) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-300 p-6">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-black mb-4">{label}</h2>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: theme.primaryColor }}></div>
          </div>
        ) : data ? (
          <div className="space-y-4">
            {/* QR Code Image */}
            <div className="bg-white p-4 rounded-lg border border-gray-300 inline-block">
              <img
                src={data.qrCodeImage}
                alt={label}
                className="w-64 h-64 mx-auto"
              />
            </div>

            {/* Hotel Information */}
            <div className="text-sm text-black">
              <p className="font-medium text-black">{data.hotelInfo?.name}</p>
              {data.hotelInfo?.address && (
                <p>{data.hotelInfo.address.street}, {data.hotelInfo.address.city}</p>
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
                <span>{t('hotelAdmin.qrCode.expires')} {formatDate(data.expiresAt)}</span>
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
  );

  const renderActionsPanel = ({
    data,
    onGenerate,
    onRegenerate,
    onDownload,
    onPrint,
    onCopy,
    isLoading,
    isRegenerating,
    isDownloading,
    downloadPrefix
  }) => (
    <div className="space-y-6">
      {/* Primary Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-300 p-6">
        <h3 className="text-lg font-semibold text-black mb-4">{t('hotelAdmin.qrCode.actions.title')}</h3>
        <div className="space-y-3">
          <button
            onClick={onGenerate}
            disabled={isLoading}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            style={{ backgroundColor: isLoading ? '#gray' : theme.primaryColor }}
            onMouseEnter={(e) => !isLoading && (e.target.style.backgroundColor = theme.secondaryColor)}
            onMouseLeave={(e) => !isLoading && (e.target.style.backgroundColor = theme.primaryColor)}
          >
            <QrCodeIcon className="h-5 w-5" />
            <span>{isLoading ? t('hotelAdmin.qrCode.actions.generating') : t('hotelAdmin.qrCode.actions.generateNew')}</span>
          </button>

          <button
            onClick={onRegenerate}
            disabled={!data || isRegenerating}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            style={{ backgroundColor: (!data || isRegenerating) ? '#gray' : theme.secondaryColor }}
            onMouseEnter={(e) => (!data || isRegenerating) || (e.target.style.backgroundColor = theme.primaryColor)}
            onMouseLeave={(e) => (!data || isRegenerating) || (e.target.style.backgroundColor = theme.secondaryColor)}
          >
            <ArrowPathIcon className="h-5 w-5" />
            <span>{isRegenerating ? t('hotelAdmin.qrCode.actions.regenerating') : t('hotelAdmin.qrCode.actions.regenerate')}</span>
          </button>
        </div>
      </div>

      {/* Download & Print Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-300 p-6">
        <h3 className="text-lg font-semibold text-black mb-4">{t('hotelAdmin.qrCode.downloadPrint.title')}</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onDownload(600)}
              disabled={!data || isDownloading}
              className="flex items-center justify-center space-x-2 px-4 py-2 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              style={{ backgroundColor: (!data || isDownloading) ? '#gray' : theme.primaryColor }}
              onMouseEnter={(e) => (!data || isDownloading) || (e.target.style.backgroundColor = theme.secondaryColor)}
              onMouseLeave={(e) => (!data || isDownloading) || (e.target.style.backgroundColor = theme.primaryColor)}
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              <span>{t('hotelAdmin.qrCode.downloadPrint.download')}</span>
            </button>

            <button
              onClick={onPrint}
              disabled={!data}
              className="flex items-center justify-center space-x-2 px-4 py-2 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              style={{ backgroundColor: !data ? '#gray' : theme.secondaryColor }}
              onMouseEnter={(e) => !data || (e.target.style.backgroundColor = theme.primaryColor)}
              onMouseLeave={(e) => !data || (e.target.style.backgroundColor = theme.secondaryColor)}
            >
              <PrinterIcon className="h-4 w-4" />
              <span>{t('hotelAdmin.qrCode.downloadPrint.print')}</span>
            </button>
          </div>

          <div className="text-sm text-black">
            <p className="mb-2">{t('hotelAdmin.qrCode.downloadPrint.downloadSizes')}</p>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => onDownload(300)}
                disabled={!data || isDownloading}
                className="px-3 py-2 bg-white border border-gray-300 hover:border-gray-400 rounded text-xs transition-colors text-black"
                style={{ backgroundColor: (!data || isDownloading) ? '#f5f5f5' : 'white' }}
              >
                {t('hotelAdmin.qrCode.downloadPrint.small')}
              </button>
              <button
                onClick={() => onDownload(600)}
                disabled={!data || isDownloading}
                className="px-3 py-2 bg-white border border-gray-300 hover:border-gray-400 rounded text-xs transition-colors text-black"
                style={{ backgroundColor: (!data || isDownloading) ? '#f5f5f5' : 'white' }}
              >
                {t('hotelAdmin.qrCode.downloadPrint.medium')}
              </button>
              <button
                onClick={() => onDownload(1200)}
                disabled={!data || isDownloading}
                className="px-3 py-2 bg-white border border-gray-300 hover:border-gray-400 rounded text-xs transition-colors text-black"
                style={{ backgroundColor: (!data || isDownloading) ? '#f5f5f5' : 'white' }}
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
          onClick={onCopy}
          disabled={!data}
          className="w-full flex items-center justify-center space-x-2 px-4 py-3 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          style={{ backgroundColor: !data ? '#gray' : 'black' }}
          onMouseEnter={(e) => !data || (e.target.style.backgroundColor = '#3B5787')}
          onMouseLeave={(e) => !data || (e.target.style.backgroundColor = 'black')}
        >
          <DocumentDuplicateIcon className="h-5 w-5" />
          <span>{activeTab === 'registration' ? t('hotelAdmin.qrCode.share.copyUrl') : 'Copy Login URL'}</span>
        </button>
        {data?.qrUrl && (
          <div className="mt-3 p-3 bg-white border border-gray-300 rounded text-xs text-black break-all">
            {data.qrUrl}
          </div>
        )}
      </div>
    </div>
  );

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

      {/* Tab Switcher */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-300 p-2">
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('registration')}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-semibold transition-all duration-200 ${
              activeTab === 'registration' ? 'text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'
            }`}
            style={activeTab === 'registration' ? { backgroundColor: theme.primaryColor } : {}}
          >
            <UserPlusIcon className="h-5 w-5" />
            <span>Registration QR Code</span>
          </button>
          <button
            onClick={() => setActiveTab('login')}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-semibold transition-all duration-200 ${
              activeTab === 'login' ? 'text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'
            }`}
            style={activeTab === 'login' ? { backgroundColor: theme.primaryColor } : {}}
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5" />
            <span>Login QR Code</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'registration' ? (
        <>
          <div className="grid lg:grid-cols-2 gap-6">
            {renderQRDisplay(qrData, loading, t('hotelAdmin.qrCode.currentQRCode'))}
            {renderActionsPanel({
              data: qrData,
              onGenerate: generateQRCode,
              onRegenerate: regenerateQRCode,
              onDownload: downloadQRCode,
              onPrint: printQRCode,
              onCopy: copyQRUrl,
              isLoading: loading,
              isRegenerating: regenerating,
              isDownloading: downloading,
              downloadPrefix: 'Registration'
            })}
          </div>
        </>
      ) : (
        <>
          <div className="grid lg:grid-cols-2 gap-6">
            {renderQRDisplay(loginQrData, loginLoading, 'Current Login QR Code')}
            {renderActionsPanel({
              data: loginQrData,
              onGenerate: generateLoginQRCode,
              onRegenerate: regenerateLoginQRCode,
              onDownload: downloadLoginQRCode,
              onPrint: printLoginQRCode,
              onCopy: copyLoginQRUrl,
              isLoading: loginLoading,
              isRegenerating: loginRegenerating,
              isDownloading: loginDownloading,
              downloadPrefix: 'Login'
            })}
          </div>
        </>
      )}

      {/* Security Information */}
      {(qrData || loginQrData) && (
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
