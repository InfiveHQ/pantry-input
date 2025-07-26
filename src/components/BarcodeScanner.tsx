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
  const [scanAttempts, setScanAttempts] = useState(0);
  const [lastError, setLastError] = useState<string | null>(null);
  const [videoDimensions, setVideoDimensions] = useState<string>("");
  const [frameStyle, setFrameStyle] = useState({ width: '80%', height: '25%' });
  const codeReader = useRef<BrowserMultiFormatReader | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Responsive frame style for portrait/landscape
  useEffect(() => {
    function updateFrameStyle() {
      if (window.innerWidth < window.innerHeight) {
        // Portrait: wide, short
        setFrameStyle({ width: '80%', height: '25%' });
      } else {
        // Landscape: still wide, but a bit taller
        setFrameStyle({ width: '60%', height: '40%' });
      }
    }
    updateFrameStyle();
    window.addEventListener('resize', updateFrameStyle);
    return () => window.removeEventListener('resize', updateFrameStyle);
  }, []);

  useEffect(() => {
    codeReader.current = new BrowserMultiFormatReader();
    let stopped = false;
    let timeoutId: NodeJS.Timeout;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true');
          await videoRef.current.play();
          
          // Get video dimensions
          const track = stream.getVideoTracks()[0];
          const settings = track.getSettings();
          setVideoDimensions(`${settings.width}x${settings.height}`);
        }
        setScanning(true);
        setTimeoutReached(false);
        setScanAttempts(0);
        setLastError(null);
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
        setScanAttempts(prev => prev + 1);
        console.log(`[ZXING] Scan attempt #${scanAttempts + 1}`);
        const result = await codeReader.current.decodeFromVideoElement(videoRef.current);
        if (result && result.getText()) {
          clearTimeout(timeoutId);
          setScanning(false);
          stopCamera();
          onScan(result.getText());
        }
      } catch (e) {
        if (e instanceof NotFoundException) {
          setLastError("No barcode found in frame");
          if (!stopped && !timeoutReached) scanLoop();
        } else {
          const errorMsg = "Scanning error: " + (e && (e as any).message ? (e as any).message : String(e)); // eslint-disable-line @typescript-eslint/no-explicit-any
          setLastError(errorMsg);
          setError(errorMsg);
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
      <div style={{ marginBottom: 20, position: 'relative' }}>
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
        
        {/* Scanning Frame Overlay */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          ...frameStyle,
          border: '3px solid #00ff00',
          borderRadius: 8,
          pointerEvents: 'none',
          zIndex: 10,
          boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.3)'
        }}>
          {/* Corner indicators */}
          <div style={{
            position: 'absolute',
            top: -3,
            left: -3,
            width: 25,
            height: 25,
            borderTop: '4px solid #00ff00',
            borderLeft: '4px solid #00ff00'
          }}></div>
          <div style={{
            position: 'absolute',
            top: -3,
            right: -3,
            width: 25,
            height: 25,
            borderTop: '4px solid #00ff00',
            borderRight: '4px solid #00ff00'
          }}></div>
          <div style={{
            position: 'absolute',
            bottom: -3,
            left: -3,
            width: 25,
            height: 25,
            borderBottom: '4px solid #00ff00',
            borderLeft: '4px solid #00ff00'
          }}></div>
          <div style={{
            position: 'absolute',
            bottom: -3,
            right: -3,
            width: 25,
            height: 25,
            borderBottom: '4px solid #00ff00',
            borderRight: '4px solid #00ff00'
          }}></div>
        </div>
      </div>
      
      {/* Debug Info */}
      <div style={{ 
        background: '#f8f9fa', 
        padding: 10, 
        marginBottom: 15, 
        borderRadius: 4,
        fontSize: 12,
        textAlign: 'left'
      }}>
        <div><strong>Status:</strong> {scanning ? 'Scanning' : 'Stopped'}</div>
        <div><strong>Attempts:</strong> {scanAttempts}</div>
        <div><strong>Video:</strong> {videoDimensions}</div>
        {lastError && <div><strong>Last Error:</strong> {lastError}</div>}
      </div>
      
      {scanning && <div style={{ color: '#007bff', marginBottom: 10 }}>Scanning for barcode...</div>}
      {timeoutReached && <div style={{ color: 'orange', marginBottom: 10 }}>No barcode found after 10 seconds. Try adjusting lighting, distance, or use manual entry.</div>}
      {error && <div style={{ color: 'red', marginBottom: 10 }}>{error}</div>}
      
      {/* Tips */}
      <div style={{ 
        background: '#e7f3ff', 
        padding: 10, 
        marginBottom: 15, 
        borderRadius: 4,
        fontSize: 12
      }}>
        <div><strong>Tips:</strong></div>
        <div>• Position barcode within the green rectangle</div>
        <div>• Hold phone steady, 6-12 inches from barcode</div>
        <div>• Ensure good lighting on the barcode</div>
        <div>• Works best with EAN-13, UPC, Code 128 barcodes</div>
      </div>
      
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
        <p>Position the barcode within the green rectangle. Scanning will happen automatically.</p>
        <p>Or use &quot;Manual Entry&quot; to type the barcode number</p>
      </div>
    </div>
  );
}
