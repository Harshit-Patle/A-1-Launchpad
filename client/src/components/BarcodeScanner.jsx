import { useState, useRef, useEffect } from 'react';
import { BrowserMultiFormatReader, BarcodeFormat } from '@zxing/library';

export default function BarcodeScanner({ isOpen, onClose, onScan }) {
    const videoRef = useRef(null);
    const [scanning, setScanning] = useState(false);
    const [error, setError] = useState('');
    const [stream, setStream] = useState(null);
    const readerRef = useRef(null);
    const [selectedDevice, setSelectedDevice] = useState('');
    const [availableDevices, setAvailableDevices] = useState([]);
    const [scanHistory, setScanHistory] = useState([]);
    const [manualEntry, setManualEntry] = useState('');
    const [showManualEntry, setShowManualEntry] = useState(false);
    const [formats, setFormats] = useState({
        qrCode: true,
        code128: true,
        code39: true,
        ean8: true,
        ean13: true,
        upcA: true,
        upcE: true,
        dataMatrix: true
    });

    useEffect(() => {
        if (isOpen) {
            getVideoDevices();
        } else {
            stopScanning();
        }

        return () => {
            stopScanning();
        };
    }, [isOpen]);

    const getVideoDevices = async () => {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');

            setAvailableDevices(videoDevices);

            if (videoDevices.length > 0) {
                // Use back camera if available, otherwise use first available
                const backCamera = videoDevices.find(device =>
                    device.label.toLowerCase().includes('back') ||
                    device.label.toLowerCase().includes('rear')
                );

                setSelectedDevice(backCamera ? backCamera.deviceId : videoDevices[0].deviceId);
                startScanning(backCamera ? backCamera.deviceId : videoDevices[0].deviceId);
            } else {
                setError('No camera found');
            }
        } catch (error) {
            console.error('Error getting video devices:', error);
            setError('Failed to access camera devices');
        }
    };

    const startScanning = async (deviceId = selectedDevice) => {
        try {
            setError('');
            setScanning(true);

            // Initialize barcode reader with selected formats
            readerRef.current = new BrowserMultiFormatReader();

            // Set formats to scan
            const hints = new Map();
            const formatsToUse = [];

            if (formats.qrCode) formatsToUse.push(BarcodeFormat.QR_CODE);
            if (formats.code128) formatsToUse.push(BarcodeFormat.CODE_128);
            if (formats.code39) formatsToUse.push(BarcodeFormat.CODE_39);
            if (formats.ean8) formatsToUse.push(BarcodeFormat.EAN_8);
            if (formats.ean13) formatsToUse.push(BarcodeFormat.EAN_13);
            if (formats.upcA) formatsToUse.push(BarcodeFormat.UPC_A);
            if (formats.upcE) formatsToUse.push(BarcodeFormat.UPC_E);
            if (formats.dataMatrix) formatsToUse.push(BarcodeFormat.DATA_MATRIX);

            // If no specific format is selected, use all formats
            if (formatsToUse.length === 0) {
                hints.set(BarcodeFormat.POSSIBLE_FORMATS, null); // All formats
            } else {
                hints.set(BarcodeFormat.POSSIBLE_FORMATS, formatsToUse);
            }

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

            // Store stream reference for cleanup
            const tracks = videoRef.current.srcObject?.getTracks() || [];
            if (tracks.length > 0) {
                setStream(videoRef.current.srcObject);
            }

        } catch (err) {
            console.error('Camera error:', err);
            setError(err.message || 'Failed to access camera');
            setScanning(false);
        }
    };

    const handleDeviceChange = (e) => {
        const deviceId = e.target.value;
        setSelectedDevice(deviceId);
        stopScanning();
        startScanning(deviceId);
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
                // Add to scan history
                addToScanHistory(result, 'QR Code (JSON)');
                onScan(data);
                return;
            }
        } catch (e) {
            // Not JSON, treat as regular barcode/part number
        }

        // Treat as part number or barcode
        addToScanHistory(result, 'Barcode');
        onScan({ partNumber: result, barcode: result });
    };

    const addToScanHistory = (code, type) => {
        setScanHistory(prev => {
            // Limit history to most recent 10 scans
            const newHistory = [{ code, type, timestamp: new Date() }, ...prev].slice(0, 10);
            return newHistory;
        });
    };

    const handleFormatChange = (format) => {
        setFormats(prev => ({
            ...prev,
            [format]: !prev[format]
        }));
    };

    const handleManualSubmit = (e) => {
        e.preventDefault();
        if (manualEntry.trim()) {
            addToScanHistory(manualEntry, 'Manual Entry');
            onScan({ partNumber: manualEntry, barcode: manualEntry });
            setManualEntry('');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-6 border w-full max-w-lg shadow-lg rounded-md bg-white">
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
                    <div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0">
                        <div className="flex-1">
                            {error && (
                                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
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

                            <div className="text-center text-sm text-gray-600 mt-2">
                                {scanning ? (
                                    <>
                                        <div className="animate-pulse">🔍 Scanning for barcodes...</div>
                                        <div className="mt-1">Point your camera at a barcode or QR code</div>
                                    </>
                                ) : (
                                    <div>Camera not available</div>
                                )}
                            </div>

                            <div className="mt-3">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Select Camera</label>
                                <select
                                    value={selectedDevice}
                                    onChange={handleDeviceChange}
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                >
                                    {availableDevices.map(device => (
                                        <option key={device.deviceId} value={device.deviceId}>
                                            {device.label || `Camera ${availableDevices.indexOf(device) + 1}`}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="md:w-64 space-y-4">
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-sm font-medium text-gray-700">Barcode Formats</h4>
                                    <button
                                        onClick={() => setShowManualEntry(!showManualEntry)}
                                        className="text-xs text-blue-600 hover:text-blue-800"
                                    >
                                        {showManualEntry ? 'Hide Manual Entry' : 'Manual Entry'}
                                    </button>
                                </div>

                                <div className="space-y-1">
                                    <label className="flex items-center text-xs">
                                        <input
                                            type="checkbox"
                                            className="rounded border-gray-300 text-blue-600 mr-1"
                                            checked={formats.qrCode}
                                            onChange={() => handleFormatChange('qrCode')}
                                        />
                                        QR Code
                                    </label>
                                    <label className="flex items-center text-xs">
                                        <input
                                            type="checkbox"
                                            className="rounded border-gray-300 text-blue-600 mr-1"
                                            checked={formats.code128}
                                            onChange={() => handleFormatChange('code128')}
                                        />
                                        Code 128
                                    </label>
                                    <label className="flex items-center text-xs">
                                        <input
                                            type="checkbox"
                                            className="rounded border-gray-300 text-blue-600 mr-1"
                                            checked={formats.code39}
                                            onChange={() => handleFormatChange('code39')}
                                        />
                                        Code 39
                                    </label>
                                    <label className="flex items-center text-xs">
                                        <input
                                            type="checkbox"
                                            className="rounded border-gray-300 text-blue-600 mr-1"
                                            checked={formats.ean13}
                                            onChange={() => handleFormatChange('ean13')}
                                        />
                                        EAN-13
                                    </label>
                                    <label className="flex items-center text-xs">
                                        <input
                                            type="checkbox"
                                            className="rounded border-gray-300 text-blue-600 mr-1"
                                            checked={formats.upcA}
                                            onChange={() => handleFormatChange('upcA')}
                                        />
                                        UPC-A
                                    </label>
                                </div>
                            </div>

                            {showManualEntry && (
                                <div className="border-t pt-3">
                                    <h4 className="text-sm font-medium text-gray-700 mb-2">Manual Entry</h4>
                                    <form onSubmit={handleManualSubmit} className="flex space-x-2">
                                        <input
                                            type="text"
                                            value={manualEntry}
                                            onChange={(e) => setManualEntry(e.target.value)}
                                            placeholder="Enter code manually"
                                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                                        />
                                        <button
                                            type="submit"
                                            className="inline-flex items-center px-3 py-1 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                        >
                                            Add
                                        </button>
                                    </form>
                                </div>
                            )}

                            <div className="border-t pt-3">
                                <h4 className="text-sm font-medium text-gray-700 mb-2">Scan History</h4>
                                <div className="max-h-40 overflow-y-auto">
                                    {scanHistory.length > 0 ? (
                                        <ul className="space-y-1">
                                            {scanHistory.map((item, index) => (
                                                <li key={index} className="text-xs border-b pb-1">
                                                    <div className="font-medium truncate">{item.code}</div>
                                                    <div className="text-gray-500 flex justify-between">
                                                        <span>{item.type}</span>
                                                        <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-xs text-gray-500">No scans yet</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-2 pt-2 border-t">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Close
                        </button>
                        {!scanning ? (
                            <button
                                onClick={() => startScanning(selectedDevice)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Start Scanning
                            </button>
                        ) : (
                            <button
                                onClick={stopScanning}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                                Stop Scanning
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
