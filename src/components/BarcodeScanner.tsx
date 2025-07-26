import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, NotFoundException } from "@zxing/library";

export default function BarcodeScanner({ onScan, onManualEntry }: {
  onScan: (code: string) => void;
  onManualEntry: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(true);
  const [timeoutReached, setTimeoutReached] = useState(false);
  const codeReader = useRef<BrowserMultiFormatReader | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    codeReader.current = new BrowserMultiFormatReader();
    let stopped = false;
    let scanAttempts = 0;
    let timeoutId: NodeJS.Timeout;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" }
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true');
          await videoRef.current.play();
        }
        setScanning(true);
        setTimeoutReached(false);
        timeoutId = setTimeout(() => {
          setTimeoutReached(true);
          setScanning(false);
        }, 10000); // 10 seconds
        scanLoop();
      } catch (e) {
        setError("Camera access denied or not available.");
      }
    };

    const scanLoop = async () => {
      if (!videoRef.current || !codeReader.current || timeoutReached) return;
      try {
        scanAttempts++;
        console.log(`[ZXING] Scan attempt #${scanAttempts}`);
        const result = await codeReader.current.decodeFromVideoElement(videoRef.current);
        if (result && result.getText()) {
          clearTimeout(timeoutId);
          setScanning(false);
          stopCamera();
          onScan(result.getText());
        }
      } catch (e) {
        if (e instanceof NotFoundException) {
          if (!stopped && !timeoutReached) scanLoop();
        } else {
          setError("Scanning error: " + (e && (e as any).message ? (e as any).message : String(e))); // eslint-disable-line @typescript-eslint/no-explicit-any
        }
      }
    };

    const stopCamera = () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (codeReader.current) {
        codeReader.current.reset();
      }
      stopped = true;
    };

    startCamera();
    return () => {
      clearTimeout(timeoutId);
      stopCamera();
    };
    // eslint-disable-next-line
  }, [timeoutReached]);

  return (
    <div style={{ padding: 20, textAlign: 'center' }}>
      <h2>Barcode Scanner</h2>
      <div style={{ marginBottom: 20 }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          style={{
            width: '100%',
            maxWidth: 400,
            border: '2px solid #ccc',
            borderRadius: 8
          }}
        />
      </div>
      {scanning && <div style={{ color: '#007bff', marginBottom: 10 }}>Scanning for barcode...</div>}
      {timeoutReached && <div style={{ color: 'orange', marginBottom: 10 }}>No barcode found after 10 seconds. Try adjusting lighting, distance, or use manual entry.</div>}
      {error && <div style={{ color: 'red', marginBottom: 10 }}>{error}</div>}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button
          onClick={onManualEntry}
          style={{
            padding: '12px 24px',
            background: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: 16
          }}
        >
          Manual Entry
        </button>
      </div>
      <div style={{ marginTop: 20, fontSize: 14, color: '#666' }}>
        <p>Point the camera at a barcode. Scanning will happen automatically.</p>
        <p>Or use &quot;Manual Entry&quot; to type the barcode number</p>
      </div>
    </div>
  );
}
