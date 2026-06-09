'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import api from '@/shared/lib/api';
import { cn } from '@/shared/lib/utils';

interface ScanResult {
  message: string;
  purchase: {
    _id: string;
    status: string;
  };
}

interface Props {
  eventId: string;
}

export function QRScanner({ eventId: _eventId }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setScanning(false);
  }, []);

  const scanQRCode = useCallback(async (qrCode: string) => {
    stopCamera();
    setError(null);
    try {
      const res = await api.post<ScanResult>('/tickets/scan', { qrCode });
      setResult(res.data);
    } catch {
      setError('Code QR invalide ou erreur de validation.');
    }
  }, [stopCamera]);

  const captureAndDecode = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    if (!('BarcodeDetector' in window)) return;

    try {
      type BarcodeDetectorType = {
        detect: (source: HTMLCanvasElement) => Promise<Array<{ rawValue: string }>>;
      };
      const detector = new (window as unknown as { BarcodeDetector: new (opts: { formats: string[] }) => BarcodeDetectorType }).BarcodeDetector({ formats: ['qr_code'] });
      const codes = await detector.detect(canvas);
      if (codes.length > 0 && codes[0].rawValue) {
        await scanQRCode(codes[0].rawValue);
      }
    } catch {
      // BarcodeDetector error — skip silently
    }
  }, [scanQRCode]);

  const startCamera = useCallback(async () => {
    setError(null);
    setResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setScanning(true);
      }
    } catch {
      setError('Impossible d\'accéder à la caméra. Vérifiez les permissions.');
    }
  }, []);

  useEffect(() => {
    if (scanning) {
      intervalRef.current = setInterval(captureAndDecode, 500);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [scanning, captureAndDecode]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  return (
    <div className="max-w-sm mx-auto">
      {!scanning && !result && (
        <button
          onClick={startCamera}
          className="w-full bg-teal text-white py-3 rounded-xl font-medium hover:bg-teal/90 transition-colors"
        >
          Activer la caméra
        </button>
      )}

      {scanning && (
        <div className="relative">
          <video ref={videoRef} className="w-full rounded-xl" muted playsInline />
          <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
          <div className="absolute inset-0 border-4 border-teal/50 rounded-xl pointer-events-none" aria-hidden="true" />
          <button
            onClick={stopCamera}
            aria-label="Arrêter le scanner"
            className="absolute top-2 right-2 bg-black/50 text-white px-3 py-1 rounded-lg text-sm"
          >
            Arrêter
          </button>
        </div>
      )}

      {result && (
        <div className={cn(
          'p-4 rounded-xl mt-4 border',
          result.purchase.status === 'used'
            ? 'bg-amber/10 border-amber'
            : 'bg-teal/10 border-teal'
        )}>
          <p className="font-semibold text-lg text-white">
            {result.purchase.status === 'valid' ? 'Valide' : result.purchase.status === 'used' ? 'Déjà utilisé' : result.purchase.status}
          </p>
          <p className="text-sm text-white/80 mt-1">{result.message}</p>
          <button
            onClick={startCamera}
            className="mt-3 w-full bg-teal text-white py-2 rounded-lg text-sm hover:bg-teal/90 transition-colors font-medium"
          >
            Scanner un autre billet
          </button>
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-900/30 border border-red-500 rounded-xl">
          <p className="text-red-300 text-sm">{error}</p>
          <button onClick={startCamera} className="mt-2 text-sm text-teal hover:underline">Réessayer</button>
        </div>
      )}
    </div>
  );
}
