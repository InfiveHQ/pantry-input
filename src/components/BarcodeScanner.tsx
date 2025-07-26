import { useEffect, useRef } from "react";

export default function BarcodeScanner({ onManualEntry }: { 
  onManualEntry: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'environment', // Use back camera on mobile
            width: { ideal: 1280 },
            height: { ideal: 720 }
          } 
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Camera access failed:', error);
        alert('Camera access denied. Please allow camera permissions and try again.');
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const captureAndScan = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // For now, we'll just show a message that scanning is in progress
    // In a real implementation, you'd use a barcode detection library here
    alert('Barcode scanning is in progress. For now, please use manual entry.');
  };

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
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button
          onClick={captureAndScan}
          style={{
            padding: '12px 24px',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: 16
          }}
        >
          Scan Barcode
        </button>
        
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
        <p>Point the camera at a barcode and tap &quot;Scan Barcode&quot;</p>
        <p>Or use &quot;Manual Entry&quot; to type the barcode number</p>
      </div>
    </div>
  );
}
