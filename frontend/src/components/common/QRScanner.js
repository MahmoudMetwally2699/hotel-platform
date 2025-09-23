/**
 * QR Code Scanner Component
 *
 * Mobile-responsive QR code scanner for guest registration
 * Uses qr-scanner library for better reliability and compatibility
 */

import React, { useState, useEffect, useRef } from 'react';
import QrScanner from 'qr-scanner';
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
  const videoRef = useRef(null);

  /**
   * Initialize QR code scanner with qr-scanner library
   */
  const initializeScanner = async () => {
    try {
      // Check if video element exists
      if (!videoRef.current) {
        throw new Error('Video element not found');
      }

      // Check if scanner already exists - avoid duplicate initialization
      if (scanner) {
        console.log('Scanner already exists, skipping initialization');
        return;
      }

      console.log('Initializing QR Scanner...');

      // Create new QrScanner instance
      const qrScanner = new QrScanner(
        videoRef.current,
        (result) => {
          console.log('QR Code scanned - Raw data:', result.data);

          // Stop scanning
          qrScanner.stop();
          setIsScanning(false);

          // Extract QR token from URL or use directly
          let qrToken = result.data;
          if (result.data.includes('qr=')) {
            const urlParams = new URLSearchParams(result.data.split('?')[1]);
            qrToken = urlParams.get('qr');
            console.log('Extracted QR token from URL parameter:', qrToken);
          } else {
            console.log('Using raw QR data as token:', qrToken);
          }

          // Add additional validation to check if it looks like a refresh token
          if (qrToken && qrToken.includes('refreshToken')) {
            console.error('WARNING: QR code contains refreshToken instead of qrToken!', qrToken);
            setError('Invalid QR code: This appears to be a refresh token instead of a hotel QR code.');
            onScanError?.('Invalid QR code format - contains refresh token');
            return;
          }

          if (qrToken) {
            console.log('Calling onScanSuccess with qrToken:', qrToken);
            onScanSuccess(qrToken);
          } else {
            setError('Invalid QR code format. Please scan a valid hotel registration QR code.');
            onScanError?.('Invalid QR code format');
          }
        },
        {
          returnDetailedScanResult: true,
          highlightScanRegion: true,
          highlightCodeOutline: true,
          preferredCamera: 'environment', // Use back camera
        }
      );

      // Start scanning
      await qrScanner.start();

      setScanner(qrScanner);
      setIsScanning(true);
      setError(null);
      setPermissions('granted');

      console.log('QR Scanner started successfully');

    } catch (error) {
      console.error('Error initializing QR scanner:', error);

      let errorMessage = 'Failed to initialize camera. ';

      if (error.name === 'AbortError') {
        errorMessage += 'Camera initialization was interrupted. Please try again.';
        console.log('AbortError detected, will retry initialization...');
        // Small delay before allowing retry
        setTimeout(() => {
          setError(null);
        }, 1000);
        return;
      } else if (error.name === 'NotAllowedError') {
        errorMessage += 'Please allow camera access and try again.';
        setPermissions('denied');
      } else if (error.name === 'NotFoundError') {
        errorMessage += 'No camera found on this device.';
        setPermissions('denied');
      } else if (error.name === 'NotSupportedError') {
        errorMessage += 'Camera access is not supported by this browser.';
        setPermissions('denied');
      } else {
        errorMessage += 'Please check camera permissions and try again.';
        setPermissions('denied');
      }

      setError(errorMessage);
      onScanError?.('Failed to initialize scanner');
    }
  };  /**
   * Stop scanning and cleanup
   */
  const stopScanning = React.useCallback(() => {
    if (scanner) {
      try {
        console.log('Stopping scanner...');
        scanner.stop();
        scanner.destroy();
        console.log('Scanner stopped and destroyed');
      } catch (error) {
        console.error('Error stopping scanner:', error);
      }
      setScanner(null);
    }
    setIsScanning(false);
  }, [scanner]);

  /**
   * Handle file upload for QR scanning
   */
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      console.log('Scanning QR code from uploaded file...');
      const result = await QrScanner.scanImage(file);
      console.log('QR Code from file:', result);

      // Extract QR token from URL or use directly
      let qrToken = result;
      if (result.includes('qr=')) {
        const urlParams = new URLSearchParams(result.split('?')[1]);
        qrToken = urlParams.get('qr');
      }

      if (qrToken) {
        onScanSuccess(qrToken);
      } else {
        setError('Invalid QR code format in uploaded image.');
        onScanError?.('Invalid QR code format');
      }
    } catch (error) {
      console.error('Error scanning file:', error);
      setError('Could not read QR code from uploaded image. Please try a clearer image.');
      onScanError?.('File scan failed');
    }
  };

  /**
   * Request camera permissions with better error handling
   */
  const requestPermissions = async () => {
    try {
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by this browser');
      }

      // Check if we're on HTTPS (required for camera access in many browsers)
      if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        throw new Error('Camera access requires HTTPS connection');
      }

      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment' // Prefer rear camera for QR scanning
        }
      });

      // Stop the stream immediately as we just needed permission
      stream.getTracks().forEach(track => track.stop());

      setPermissions('granted');
      setError(null);

      // Don't initialize scanner here - wait for component to render
      console.log('Camera permission granted');

    } catch (error) {
      console.error('Camera permission denied:', error);
      setPermissions('denied');

      let errorMessage = 'Camera access is required to scan QR codes. ';

      if (error.name === 'NotAllowedError') {
        errorMessage += 'Please allow camera access when prompted or enable it in your browser settings.';
      } else if (error.name === 'NotFoundError') {
        errorMessage += 'No camera found on this device.';
      } else if (error.name === 'NotSupportedError') {
        errorMessage += 'Camera access is not supported by this browser.';
      } else if (error.message.includes('HTTPS')) {
        errorMessage += 'Camera access requires a secure connection (HTTPS).';
      } else {
        errorMessage += 'Please check your camera permissions and try again.';
      }

      setError(errorMessage);
    }
  };

  // Check permissions on component mount
  useEffect(() => {
    if (permissions === 'unknown') {
      requestPermissions();
    }
  }, [permissions]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, [stopScanning]);

  // Initialize scanner when video element is ready
  useEffect(() => {
    let isMounted = true;

    if (permissions === 'granted' && videoRef.current && !isScanning && !scanner) {
      console.log('Video element ready, initializing scanner...');
      // Small delay to ensure DOM is fully ready
      const timer = setTimeout(() => {
        if (isMounted && !scanner) { // Double-check before initializing
          initializeScanner();
        }
      }, 100);

      return () => {
        isMounted = false;
        clearTimeout(timer);
      };
    }
  }, [permissions, isScanning, scanner]); // eslint-disable-line react-hooks/exhaustive-deps

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
              <p className="text-xs text-gray-500 mt-2">
                Make sure to allow camera access when prompted
              </p>
            </div>
          )}

          {/* Camera Access Denied */}
          {permissions === 'denied' && (
            <div className="text-center py-8">
              <ExclamationTriangleIcon className="h-16 w-16 text-red-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">
                Camera access is required to scan QR codes
              </p>
              <div className="space-y-2 text-sm text-gray-500">
                <p>To enable camera access:</p>
                <ul className="text-left list-disc list-inside space-y-1">
                  <li>Click the camera icon in your browser's address bar</li>
                  <li>Select "Always allow" for camera access</li>
                  <li>Refresh the page and try again</li>
                </ul>
              </div>
              <button
                onClick={requestPermissions}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {/* QR Scanner */}
          {permissions === 'granted' && (
            <div className="space-y-4">
              <div className="relative w-full min-h-[300px] bg-gray-100 rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover rounded-lg"
                  style={{ minHeight: '300px' }}
                />
              </div>

              {isScanning && (
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-2 text-green-600">
                    <CheckCircleIcon className="h-5 w-5" />
                    <span className="text-sm">Camera active - Point at QR code</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    QR code will be highlighted when detected
                  </p>
                </div>
              )}

              {!isScanning && permissions === 'granted' && (
                <div className="text-center">
                  <button
                    onClick={initializeScanner}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Start Camera
                  </button>
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
