/**
 * QR Code Scanner Component
 *
 * Mobile-responsive QR code scanner for guest registration
 * Uses html5-qrcode library for cross-platform compatibility
 */

import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';
import {
  QrCodeIcon,
  CameraIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const QRScanner = ({ onScanSuccess, onScanError, onClose }) => {
  const [scanner, setScanner] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const [permissions, setPermissions] = useState('unknown');
  const scannerRef = useRef(null);

  /**
   * Initialize QR code scanner
   */
  const initializeScanner = async () => {
    try {
      // Check camera permissions
      if (navigator.permissions) {
        const permission = await navigator.permissions.query({ name: 'camera' });
        setPermissions(permission.state);

        permission.addEventListener('change', () => {
          setPermissions(permission.state);
        });
      }

      // Initialize scanner with optimized settings
      const html5QrcodeScanner = new Html5QrcodeScanner(
        "qr-reader",
        {
          fps: 10,
          qrbox: {
            width: 250,
            height: 250
          },
          aspectRatio: 1.0,
          showTorchButtonIfSupported: true,
          showZoomSliderIfSupported: true,
          defaultZoomValueIfSupported: 2,
          useBarCodeDetectorIfSupported: true,
          rememberLastUsedCamera: true,
          supportedScanTypes: [
            Html5QrcodeScanner.SCAN_TYPE_CAMERA,
            Html5QrcodeScanner.SCAN_TYPE_FILE
          ]
        },
        false // verbose logging disabled
      );

      // Handle successful scan
      const onScanSuccessCallback = (decodedText, decodedResult) => {
        console.log('QR Code scanned:', decodedText);

        // Stop scanning
        html5QrcodeScanner.clear();
        setIsScanning(false);

        // Extract QR token from URL or use directly
        let qrToken = decodedText;
        if (decodedText.includes('qr=')) {
          const urlParams = new URLSearchParams(decodedText.split('?')[1]);
          qrToken = urlParams.get('qr');
        }

        if (qrToken) {
          onScanSuccess(qrToken);
        } else {
          setError('Invalid QR code format. Please scan a valid hotel registration QR code.');
          onScanError?.('Invalid QR code format');
        }
      };

      // Handle scan errors
      const onScanErrorCallback = (errorMessage) => {
        // Don't log every frame error, only significant ones
        if (errorMessage.includes('No QR code found')) {
          return; // Normal when no QR code is in view
        }
        console.warn('QR Scan error:', errorMessage);
      };

      // Start scanning
      html5QrcodeScanner.render(onScanSuccessCallback, onScanErrorCallback);
      setScanner(html5QrcodeScanner);
      setIsScanning(true);
      setError(null);

    } catch (error) {
      console.error('Error initializing QR scanner:', error);
      setError('Failed to initialize camera. Please check permissions and try again.');
      onScanError?.('Failed to initialize scanner');
    }
  };

  /**
   * Stop scanning and cleanup
   */
  const stopScanning = () => {
    if (scanner) {
      try {
        const clearResult = scanner.clear();
        if (clearResult && typeof clearResult.catch === 'function') {
          clearResult.catch(console.error);
        }
      } catch (error) {
        console.error('Error clearing scanner:', error);
      }
      setScanner(null);
    }
    setIsScanning(false);
  };

  /**
   * Handle file upload for QR scanning
   */
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Create a temporary div for file scanning
    const tempDiv = document.createElement('div');
    tempDiv.id = 'file-reader-temp';
    tempDiv.style.display = 'none';
    document.body.appendChild(tempDiv);

    const html5QrCode = new Html5Qrcode("file-reader-temp");

    html5QrCode.scanFile(file, true)
      .then(decodedText => {
        console.log('QR Code from file:', decodedText);

        // Extract QR token from URL or use directly
        let qrToken = decodedText;
        if (decodedText.includes('qr=')) {
          const urlParams = new URLSearchParams(decodedText.split('?')[1]);
          qrToken = urlParams.get('qr');
        }

        if (qrToken) {
          onScanSuccess(qrToken);
        } else {
          setError('Invalid QR code format in uploaded image.');
          onScanError?.('Invalid QR code format');
        }
      })
      .catch(error => {
        console.error('Error scanning file:', error);
        setError('Could not read QR code from uploaded image.');
        onScanError?.('File scan failed');
      })
      .finally(() => {
        // Clean up temporary div
        try {
          const clearResult = html5QrCode.clear();
          if (clearResult && typeof clearResult.catch === 'function') {
            clearResult.catch(console.error);
          }
        } catch (error) {
          console.error('Error clearing HTML5 QR Code:', error);
        }

        if (document.getElementById('file-reader-temp')) {
          document.body.removeChild(tempDiv);
        }
      });
  };

  /**
   * Request camera permissions
   */
  const requestPermissions = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true });
      setPermissions('granted');
      initializeScanner();
    } catch (error) {
      console.error('Camera permission denied:', error);
      setPermissions('denied');
      setError('Camera access is required to scan QR codes. Please enable camera permissions and refresh the page.');
    }
  };

  // Initialize scanner on component mount
  useEffect(() => {
    if (permissions === 'granted') {
      initializeScanner();
    }

    // Cleanup on unmount
    return () => {
      stopScanning();
    };
  }, [permissions]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle permission changes
  useEffect(() => {
    if (permissions === 'denied') {
      setError('Camera access denied. You can upload an image with a QR code instead.');
    } else if (permissions === 'granted' && !isScanning) {
      initializeScanner();
    }
  }, [permissions, isScanning]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <QrCodeIcon className="h-6 w-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Scan QR Code</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-4">
          {/* Instructions */}
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Scan the QR code</strong> displayed at the hotel reception desk to automatically select your hotel for registration.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-red-800">{error}</p>
                {permissions === 'denied' && (
                  <button
                    onClick={requestPermissions}
                    className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                  >
                    Try to enable camera again
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Permission Request */}
          {permissions === 'unknown' && (
            <div className="text-center py-8">
              <CameraIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">
                Camera access is needed to scan QR codes
              </p>
              <button
                onClick={requestPermissions}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Enable Camera
              </button>
            </div>
          )}

          {/* QR Scanner */}
          {permissions === 'granted' && (
            <div className="space-y-4">
              <div
                id="qr-reader"
                ref={scannerRef}
                className="w-full"
              />

              {isScanning && (
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-2 text-green-600">
                    <CheckCircleIcon className="h-5 w-5" />
                    <span className="text-sm">Camera active - Point at QR code</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* File Upload Alternative */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-3 text-center">
              Or upload an image with QR code:
            </p>
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                <QrCodeIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  Click to upload QR code image
                </p>
              </div>
            </div>
          </div>

          {/* Manual Entry Option */}
          <div className="mt-4 text-center">
            <button
              onClick={onClose}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Skip QR scan and select hotel manually
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
