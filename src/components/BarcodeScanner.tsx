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
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string | undefined>(undefined);
  
  const codeReader = useRef<BrowserMultiFormatReader | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanningRef = useRef(false);

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
      try {
        setError(null);
        setScanning(false);
        setSuccess(false);
        scanningRef.current = false;
        
        // Clean up any existing stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        
        // Initialize ZXing reader
        codeReader.current = new BrowserMultiFormatReader();
        
        // Try different camera constraints with fallbacks
        const constraints = [
          // Primary: environment-facing camera with specific settings
          {
            video: selectedCamera
              ? { deviceId: { exact: selectedCamera } }
              : { 
                  facingMode: 'environment',
                  width: { ideal: 1280, min: 320, max: 1920 },
                  height: { ideal: 720, min: 240, max: 1080 },
                  aspectRatio: { ideal: 16/9 },
                  frameRate: { ideal: 30, min: 10 }
                }
          },
          // Fallback 1: simpler environment-facing
          {
            video: { facingMode: 'environment' }
          },
          // Fallback 2: any camera
          {
            video: true
          }
        ];
        
        let stream: MediaStream | null = null;
        let lastError: Error | null = null;
        
        // Try each constraint until one works
        for (let i = 0; i < constraints.length; i++) {
          try {
            console.log(`[CAMERA] Trying constraint ${i + 1}:`, constraints[i]);
            stream = await navigator.mediaDevices.getUserMedia(constraints[i]);
            console.log(`[CAMERA] Success with constraint ${i + 1}`);
            break;
          } catch (err) {
            lastError = err as Error;
            console.log(`[CAMERA] Failed with constraint ${i + 1}:`, err);
            if (i === constraints.length - 1) {
              throw lastError;
            }
          }
        }
        
        if (!stream) {
          throw new Error('Failed to get camera stream with all constraints');
        }
        
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
        let errorMsg = `Camera error: ${err instanceof Error ? err.message : String(err)}`;
        
        if (err instanceof Error) {
          switch (err.name) {
            case 'NotAllowedError':
              errorMsg = "Camera access denied. Please allow camera access and try again.";
              break;
            case 'NotFoundError':
              errorMsg = "No camera found. Please check your device has a camera.";
              break;
            case 'NotSupportedError':
              errorMsg = "Camera not supported on this device. Try using manual entry instead.";
              break;
            case 'NotReadableError':
              errorMsg = "Camera is in use by another application. Please close other camera apps and try again.";
              break;
            case 'OverconstrainedError':
              errorMsg = "Camera constraints not supported. Trying with simpler settings...";
              // Try again with simpler constraints
              setTimeout(() => {
                if (mounted) {
                  initScanner();
                }
              }, 1000);
              return;
            default:
              if (err.message.includes('could not start video source')) {
                errorMsg = "Camera failed to start. This might be due to browser restrictions. Try refreshing the page or using manual entry.";
              }
          }
        }
        
        setError(errorMsg);
      }
    };

    const startScanning = async () => {
      if (!videoRef.current || !codeReader.current || !scanningRef.current) {
        return;
      }
      
      try {
        console.log('[SCAN] Starting scan...');
        
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
          console.log('[SCAN] No barcode found');
          // Continue scanning if still active
          if (scanningRef.current) {
            setTimeout(() => startScanning(), 100);
          }
        } else {
          console.error('[SCAN] Error:', err);
          // Continue scanning if still active
          if (scanningRef.current) {
            setTimeout(() => startScanning(), 100);
          }
        }
      }
    };

    initScanner();

    return () => {
      mounted = false;
      stopCamera();
    };
  }, [selectedCamera, onScan]);

  const stopCamera = () => {
    scanningRef.current = false;
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
          muted
          style={{
            width: '100%',
            maxWidth: 500,
            border: '2px solid #ccc',
            borderRadius: 8,
            objectFit: 'cover'
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
