import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, CameraOff } from 'lucide-react';
import Button from './ui/Button';

const ELEMENT_ID = 'qr-scanner-viewport';

export default function QrScanner({ onScan }) {
  const scannerRef = useRef(null);
  const [active, setActive] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const start = async () => {
    setError('');
    try {
      const scanner = new Html5Qrcode(ELEMENT_ID);
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: 250 },
        (decodedText) => {
          onScan(decodedText);
        },
        () => {}
      );
      setActive(true);
    } catch (err) {
      setError(err?.message || 'Unable to access camera');
    }
  };

  const stop = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch {
        // ignore
      }
    }
    setActive(false);
  };

  return (
    <div className="flex flex-col gap-3">
      <div
        id={ELEMENT_ID}
        className={`overflow-hidden rounded-lg bg-slate-100 ${active ? 'min-h-[250px]' : ''}`}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="button" variant="secondary" onClick={active ? stop : start}>
        {active ? (
          <>
            <CameraOff className="h-4 w-4" /> Stop camera
          </>
        ) : (
          <>
            <Camera className="h-4 w-4" /> Start camera scanner
          </>
        )}
      </Button>
    </div>
  );
}
