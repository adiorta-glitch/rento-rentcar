
import React, { useEffect, useRef } from 'react';
// Menggunakan direct import dari CDN untuk menghindari error resolusi bundler lokal
// @ts-ignore
import { Html5QrcodeScanner } from 'https://esm.sh/html5-qrcode@2.3.8';
import { X } from 'lucide-react';

interface Props {
  onScan: (data: string) => void;
  onClose: () => void;
}

export const QRScannerComponent: React.FC<Props> = ({ onScan, onClose }) => {
  const scannerRef = useRef<any>(null);

  useEffect(() => {
    // Inisialisasi scanner
    scannerRef.current = new Html5QrcodeScanner(
      "qr-reader",
      { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      },
      /* verbose= */ false
    );

    scannerRef.current.render((decodedText: string) => {
      onScan(decodedText);
      if (scannerRef.current) {
        scannerRef.current.clear().catch((e: any) => console.error("Error clearing scanner", e));
      }
    }, (error: any) => {
      // Callback untuk kegagalan scan (diabaikan agar tidak spam console)
    });

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch((e: any) => console.error("Error cleaning up scanner", e));
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-3xl overflow-hidden relative shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="p-4 bg-slate-800 text-white flex justify-between items-center">
          <span className="font-bold text-sm uppercase tracking-widest">Scanner Unit</span>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-2">
            <div id="qr-reader" className="w-full rounded-2xl overflow-hidden border-0"></div>
        </div>
        
        <div className="p-6 text-center">
          <p className="text-slate-500 dark:text-slate-400 text-xs font-medium leading-relaxed px-4">
            Arahkan kamera ke kode QR yang tertempel pada unit armada untuk memilih Kendaraan secara otomatis.
          </p>
        </div>
      </div>
    </div>
  );
};
