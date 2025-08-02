import { useRef } from 'react';
import QRCode from 'qrcode';

export default function QRCodeGenerator({ value, size = 200, onGenerated }) {
    const canvasRef = useRef();

    const generateQRCode = async () => {
        try {
            await QRCode.toCanvas(canvasRef.current, value, {
                width: size,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#ffffff'
                }
            });
            if (onGenerated) {
                onGenerated(canvasRef.current.toDataURL());
            }
        } catch (error) {
            console.error('Error generating QR code:', error);
        }
    };

    const downloadQRCode = () => {
        const canvas = canvasRef.current;
        const link = document.createElement('a');
        link.download = `qrcode-${value.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
        link.href = canvas.toDataURL();
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-center">
                <canvas ref={canvasRef} className="border border-gray-300 rounded-lg" />
            </div>
            <div className="flex justify-center space-x-2">
                <button
                    onClick={generateQRCode}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Generate QR Code
                </button>
                <button
                    onClick={downloadQRCode}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                    Download
                </button>
            </div>
        </div>
    );
}
