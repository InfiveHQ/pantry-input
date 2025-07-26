import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, NotFoundException } from "@zxing/library";

export default function BarcodeScanner({ onScan, onManualEntry }: {
  onScan: (code: string) => void;
  onManualEntry: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [success, setSuccess] = useState(false);
  const [scanAttempts, setScanAttempts] = useState(0);
  const [lastError, setLastError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string | undefined>(undefined);
  
  const codeReader = useRef<BrowserMultiFormatReader | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanningRef = useRef(false);
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // List available cameras
  useEffect(() => {
    async function getCameras() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter(d => d.kind === 'videoinput');
        setCameras(videoInputs);
        if (videoInputs.length > 0 && !selectedCamera) {
          setSelectedCamera(videoInputs[0].deviceId);
        }
              } catch (err) {
          console.error('Error getting cameras:', err);
        }
    }
    getCameras();
  }, [selectedCamera]);

  // Initialize scanner and start camera
  useEffect(() => {
    let mounted = true;
    
    const initScanner = async () => {
      const startScanning = async () => {
        if (!videoRef.current || !codeReader.current || !scanningRef.current) {
          return;
        }
        
        try {
          setScanAttempts(prev => prev + 1);
          console.log(`[SCAN] Attempt #${scanAttempts + 1}`);
          
          // Clear any existing timeout
          if (scanTimeoutRef.current) {
            clearTimeout(scanTimeoutRef.current);
          }
          
          const result = await codeReader.current.decodeFromVideoElement(videoRef.current);
          
          if (result && result.getText()) {
            const barcodeText = result.getText();
            console.log('[SCAN] Barcode found:', barcodeText);
            setSuccess(true);
            setScanning(false);
            scanningRef.current = false;
            
            // Stop camera
            stopCamera();
            
            setTimeout(() => {
              onScan(barcodeText);
            }, 500);
            return;
          }
        } catch (err) {
          if (err instanceof NotFoundException) {
            setLastError("No barcode found");
            console.log('[SCAN] No barcode found');
          } else {
            console.error('[SCAN] Error:', err);
            const errorMsg = `Scan error: ${err instanceof Error ? err.message : String(err)}`;
            setLastError(errorMsg);
          }
        }
        
        // Continue scanning if still active
        if (scanningRef.current) {
          scanTimeoutRef.current = setTimeout(() => startScanning(), 200);
        }
      };
      try {
        setError(null);
        
        // Initialize ZXing reader
        codeReader.current = new BrowserMultiFormatReader();
        
        // Get camera stream with fallback options
        const constraints: MediaStreamConstraints = {
          video: selectedCamera
            ? { deviceId: { exact: selectedCamera } }
            : { 
                facingMode: 'environment',
                width: { ideal: 1280, min: 640 },
                height: { ideal: 720, min: 480 }
              }
        };
        
        console.log('[CAMERA] Requesting camera with constraints:', constraints);
        
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;
        
        if (!mounted) return;
        
        // Set up video element
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true');
          
          // Wait for video to be ready
          await new Promise<void>((resolve, reject) => {
            if (videoRef.current) {
              const timeout = setTimeout(() => {
                reject(new Error('Video load timeout'));
              }, 10000);
              
              videoRef.current!.onloadedmetadata = () => {
                clearTimeout(timeout);
                console.log('[CAMERA] Video ready');
                resolve();
              };
              
              videoRef.current!.onerror = (e) => {
                clearTimeout(timeout);
                reject(new Error(`Video error: ${e}`));
              };
            }
          });
          
          // Start scanning
          setScanning(true);
          scanningRef.current = true;
          startScanning();
        }
      } catch (err) {
        console.error('[CAMERA] Error:', err);
        const errorMsg = `Camera error: ${err instanceof Error ? err.message : String(err)}`;
        setError(errorMsg);
        
        // Try fallback to any available camera
        if (err instanceof Error && err.name === 'NotAllowedError') {
          setError("Camera access denied. Please allow camera access and try again.");
        } else if (err instanceof Error && err.name === 'NotFoundError') {
          setError("No camera found. Please check your device has a camera.");
        }
      }
    };

    initScanner();

    return () => {
      mounted = false;
      stopCamera();
    };
  }, [selectedCamera]);



  const stopCamera = () => {
    scanningRef.current = false;
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
      scanTimeoutRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (codeReader.current) {
      codeReader.current.reset();
    }
    setScanning(false);
  };



  return (
    <div style={{ padding: 20, textAlign: 'center' }}>
      <h2>Barcode Scanner</h2>
      
      {/* Camera Selection */}
      {cameras.length > 0 && (
        <div style={{ marginBottom: 15 }}>
          <label htmlFor="camera-select" style={{ marginRight: 8 }}>Camera:</label>
          <select
            id="camera-select"
            value={selectedCamera}
            onChange={e => setSelectedCamera(e.target.value)}
            style={{ fontSize: 16, padding: 4 }}
          >
            {cameras.map(cam => (
              <option key={cam.deviceId} value={cam.deviceId}>
                {cam.label || `Camera ${cam.deviceId.slice(0, 8)}...`}
              </option>
            ))}
          </select>
        </div>
      )}
      
      {/* Video Display */}
      <div style={{ marginBottom: 20, position: 'relative' }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          style={{
            width: '100%',
            maxWidth: 500,
            border: '2px solid #ccc',
            borderRadius: 8
          }}
        />
        
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
      </div>
      
      {/* Status Info */}
      <div style={{ 
        background: '#f8f9fa', 
        padding: 10, 
        marginBottom: 15, 
        borderRadius: 4,
        fontSize: 12,
        textAlign: 'center'
      }}>
        <div><strong>Status:</strong> {success ? 'Success!' : scanning ? 'Scanning...' : 'Ready'}</div>
        {lastError && <div><strong>Error:</strong> {lastError}</div>}
      </div>
      
      {/* Error Display */}
      {error && (
        <div style={{ 
          background: '#f8d7da', 
          color: '#721c24', 
          padding: 15, 
          marginBottom: 15, 
          borderRadius: 4,
          border: '1px solid #f5c6cb'
        }}>
          <div><strong>Camera Error:</strong> {error}</div>

        </div>
      )}
      
      {/* Action Buttons */}
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
      
      {/* Instructions */}
      <div style={{ marginTop: 20, fontSize: 14, color: '#666' }}>
        <p>Position a barcode in front of the camera. Scanning happens automatically.</p>
        <p>Make sure the barcode is well-lit and clearly visible.</p>
        <p>Or use &quot;Manual Entry&quot; to type the barcode number.</p>
      </div>
    </div>
  );
}
