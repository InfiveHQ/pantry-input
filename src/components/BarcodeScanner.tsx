import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, NotFoundException } from "@zxing/library";

export default function BarcodeScanner({ onScan, onManualEntry }: {
  onScan: (code: string) => void;
  onManualEntry: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(true);
  const [scanAttempts, setScanAttempts] = useState(0);
  const [lastError, setLastError] = useState<string | null>(null);
  const [videoDimensions, setVideoDimensions] = useState<string>("");
  const [frameStyle, setFrameStyle] = useState({ width: '80%', height: '25%' });
  const [success, setSuccess] = useState(false);
  const codeReader = useRef<BrowserMultiFormatReader | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string | undefined>(undefined);

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

  // List cameras on mount
  useEffect(() => {
    async function getCameras() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter(d => d.kind === 'videoinput');
        setCameras(videoInputs);
        if (videoInputs.length > 0 && !selectedCamera) {
          setSelectedCamera(videoInputs[0].deviceId);
        }
      } catch (e) {
        setError('Could not list cameras');
      }
    }
    getCameras();
  }, []);

  useEffect(() => {
    codeReader.current = new BrowserMultiFormatReader();
    let stopped = false;

    const startCamera = async () => {
      try {
        console.log('[CAMERA] Starting camera...');
        const constraints: MediaStreamConstraints = {
          video: selectedCamera
            ? { deviceId: { exact: selectedCamera }, width: { ideal: 1280 }, height: { ideal: 720 } }
            : { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } }
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        console.log('[CAMERA] Stream obtained:', stream);
        streamRef.current = stream;
        if (videoRef.current) {
          console.log('[CAMERA] Setting video source...');
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true');
          await videoRef.current.play();
          console.log('[CAMERA] Video playing:', videoRef.current.readyState);
          
          // Get video dimensions
          const track = stream.getVideoTracks()[0];
          const settings = track.getSettings();
          console.log('[CAMERA] Video settings:', settings);
          setVideoDimensions(`${settings.width}x${settings.height}`);
        }
        setScanning(true);
        setScanAttempts(0);
        setLastError(null);
        setSuccess(false);
        console.log('[CAMERA] Starting scan loop...');
        scanLoop();
      } catch (e) {
        console.error('[CAMERA] Error starting camera:', e);
        setError("Camera access denied or not available.");
      }
    };

    const scanLoop = async () => {
      if (!videoRef.current || !codeReader.current || stopped) return;
      try {
        setScanAttempts(prev => prev + 1);
        console.log(`[ZXING] Scan attempt #${scanAttempts + 1}`);
        console.log(`[ZXING] Video element ready:`, videoRef.current.readyState);
        console.log(`[ZXING] Video dimensions:`, videoRef.current.videoWidth, 'x', videoRef.current.videoHeight);
        
        const result = await codeReader.current.decodeFromVideoElement(videoRef.current);
        if (result && result.getText()) {
          console.log('Barcode found:', result.getText());
          setSuccess(true);
          setScanning(false);
          stopCamera();
          // Small delay to show success indicator
          setTimeout(() => {
            onScan(result.getText());
          }, 500);
          return; // Exit the loop on success
        }
      } catch (e) {
        if (e instanceof NotFoundException) {
          setLastError("No barcode found in frame");
          console.log(`[ZXING] No barcode found in attempt #${scanAttempts + 1}`);
        } else {
          const errorMsg = "Scanning error: " + (e && (e as any).message ? (e as any).message : String(e)); // eslint-disable-line @typescript-eslint/no-explicit-any
          setLastError(errorMsg);
          setError(errorMsg);
          console.error(`[ZXING] Error in attempt #${scanAttempts + 1}:`, e);
        }
      }
      
      // Continue scanning if not stopped
      if (!stopped) {
        // Use setTimeout with a small delay to prevent overwhelming
        setTimeout(() => scanLoop(), 100);
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
      stopCamera();
    };
    // eslint-disable-next-line
  }, [selectedCamera]);

  return (
    <div style={{ padding: 20, textAlign: 'center' }}>
      <h2>Barcode Scanner</h2>
      {/* Camera selection dropdown */}
      {cameras.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <label htmlFor="camera-select" style={{ marginRight: 8 }}>Camera:</label>
          <select
            id="camera-select"
            value={selectedCamera}
            onChange={e => setSelectedCamera(e.target.value)}
            style={{ fontSize: 16, padding: 4 }}
          >
            {cameras.map(cam => (
              <option key={cam.deviceId} value={cam.deviceId}>{cam.label || `Camera ${cam.deviceId}`}</option>
            ))}
          </select>
          {/* Debug: List all detected cameras */}
          <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
            <div>Detected cameras:</div>
            <ul style={{ margin: 0, paddingLeft: 16 }}>
              {cameras.map(cam => (
                <li key={cam.deviceId}>{cam.label || cam.deviceId}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
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
          border: success ? '3px solid #28a745' : '3px solid #00ff00',
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
        
        {/* Scanning Animation */}
        {scanning && !success && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            ...frameStyle,
            border: '2px solid transparent',
            borderRadius: 8,
            pointerEvents: 'none',
            zIndex: 9,
            background: 'linear-gradient(45deg, transparent 30%, rgba(0, 255, 0, 0.3) 50%, transparent 70%)',
            backgroundSize: '200% 200%',
            animation: 'scanning-pulse 2s ease-in-out infinite'
          }}></div>
        )}
        
        {/* Success indicator */}
        {success && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: '#28a745',
            color: 'white',
            padding: '10px 20px',
            borderRadius: 8,
            fontSize: 16,
            fontWeight: 'bold',
            zIndex: 20
          }}>
            ✓ Barcode Found!
          </div>
        )}
        
        <style jsx>{`
          @keyframes scanning-pulse {
            0% { background-position: 0% 0%; }
            50% { background-position: 100% 100%; }
            100% { background-position: 0% 0%; }
          }
        `}</style>
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
        <div><strong>Status:</strong> {success ? 'Success!' : scanning ? 'Scanning' : 'Stopped'}</div>
        <div><strong>Attempts:</strong> {scanAttempts}</div>
        <div><strong>Video:</strong> {videoDimensions}</div>
        {lastError && <div><strong>Last Error:</strong> {lastError}</div>}
      </div>
      
      {scanning && !success && <div style={{ color: '#007bff', marginBottom: 10 }}>Scanning for barcode...</div>}
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
