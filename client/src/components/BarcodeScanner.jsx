import { useState, useRef, useEffect } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';

export default function BarcodeScanner({ isOpen, onClose, onScan }) {
    const videoRef = useRef(null);
    const [scanning, setScanning] = useState(false);
    const [error, setError] = useState('');
    const [stream, setStream] = useState(null);
    const readerRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            startScanning();
        } else {
            stopScanning();
        }

        return () => {
            stopScanning();
        };
    }, [isOpen]);

    const startScanning = async () => {
        try {
            setError('');
            setScanning(true);

            // Initialize barcode reader
            readerRef.current = new BrowserMultiFormatReader();

            // Get video devices
            const videoDevices = await navigator.mediaDevices.enumerateDevices();
            const videoInputDevices = videoDevices.filter(device => device.kind === 'videoinput');

            if (videoInputDevices.length === 0) {
                throw new Error('No camera found');
            }

            // Use back camera if available, otherwise use first available
            const backCamera = videoInputDevices.find(device =>
                device.label.toLowerCase().includes('back') ||
                device.label.toLowerCase().includes('rear')
            );
            const deviceId = backCamera ? backCamera.deviceId : videoInputDevices[0].deviceId;

            // Start scanning
            const result = await readerRef.current.decodeFromVideoDevice(
                deviceId,
                videoRef.current,
                (result, err) => {
                    if (result) {
                        handleScanSuccess(result.getText());
                    }
                    if (err && err.name !== 'NotFoundException') {
                        console.error('Scanning error:', err);
                    }
                }
            );

        } catch (err) {
            console.error('Camera error:', err);
            setError(err.message || 'Failed to access camera');
            setScanning(false);
        }
    };

    const stopScanning = () => {
        if (readerRef.current) {
            readerRef.current.reset();
        }
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        setScanning(false);
    };

    const handleScanSuccess = (result) => {
        // Check if result looks like a QR code with JSON data
        try {
            const data = JSON.parse(result);
            if (data.id || data.partNumber) {
                onScan(data);
                onClose();
                return;
            }
        } catch (e) {
            // Not JSON, treat as regular barcode/part number
        }

        // Treat as part number or barcode
        onScan({ partNumber: result, barcode: result });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-6 border w-full max-w-md shadow-lg rounded-md bg-white">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Scan Barcode/QR Code</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="space-y-4">
                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                            {error}
                        </div>
                    )}

                    <div className="bg-gray-100 rounded-lg overflow-hidden">
                        <video
                            ref={videoRef}
                            className="w-full h-64 object-cover"
                            autoPlay
                            playsInline
                        />

                        {/* Scanning overlay */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-48 h-48 border-2 border-blue-500 rounded-lg relative">
                                <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-blue-500"></div>
                                <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-blue-500"></div>
                                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-blue-500"></div>
                                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-blue-500"></div>

                                {scanning && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-full h-0.5 bg-red-500 animate-pulse"></div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="text-center text-sm text-gray-600">
                        {scanning ? (
                            <>
                                <div className="animate-pulse">🔍 Scanning for barcodes...</div>
                                <div className="mt-2">Point your camera at a barcode or QR code</div>
                            </>
                        ) : (
                            <div>Camera not available</div>
                        )}
                    </div>

                    <div className="flex justify-end space-x-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        {!scanning && (
                            <button
                                onClick={startScanning}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Retry
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
