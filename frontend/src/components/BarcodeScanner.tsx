import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera } from 'lucide-react';

interface BarcodeScannerProps {
  open: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
  title?: string;
}

export default function BarcodeScanner({ open, onClose, onScan, title = '扫描条形码' }: BarcodeScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState('');
  const [manualCode, setManualCode] = useState('');
  const containerId = 'barcode-scanner-region';

  useEffect(() => {
    if (!open) return;

    let mounted = true;
    const startScanner = async () => {
      try {
        const scanner = new Html5Qrcode(containerId);
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 150 } },
          (decodedText) => {
            onScan(decodedText);
            stopScanner();
            onClose();
          },
          () => { /* ignore scan failures */ }
        );
      } catch {
        if (mounted) setError('无法访问摄像头，请使用手动输入或检查浏览器权限');
      }
    };

    const timer = setTimeout(startScanner, 100);

    return () => {
      mounted = false;
      clearTimeout(timer);
      stopScanner();
    };
  }, [open]);

  const stopScanner = () => {
    if (scannerRef.current?.isScanning) {
      scannerRef.current.stop().catch(() => {});
      scannerRef.current = null;
    }
  };

  const handleClose = () => {
    stopScanner();
    setError('');
    setManualCode('');
    onClose();
  };

  const handleManualSubmit = () => {
    if (manualCode.trim()) {
      onScan(manualCode.trim());
      handleClose();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-surface rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-primary">{title}</h3>
          </div>
          <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-neutral">
            <X className="w-5 h-5 text-secondary" />
          </button>
        </div>

        <div className="p-5">
          <div id={containerId} className="w-full rounded-xl overflow-hidden bg-black min-h-[200px]" />

          {error && (
            <p className="text-sm text-amber-600 mt-3 p-3 bg-amber-50 rounded-xl">{error}</p>
          )}

          <div className="mt-4">
            <label className="block text-xs text-secondary mb-1.5">或手动输入条形码 / ISBN</label>
            <div className="flex gap-2">
              <input value={manualCode} onChange={(e) => setManualCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
                placeholder="输入 ISBN 或条形码"
                className="flex-1 px-3 py-2.5 border border-border rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20" />
              <button onClick={handleManualSubmit}
                className="px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-medium">确认</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
