import { useState, useRef, useEffect } from "react";
import Image from "next/image";

const LOCATION_OPTIONS = [
  "Shelf Top Small",
  "Shelf Top Right",
  "Shelf Top Large",
  "Shelf Bottom",
  "Countertop",
  "Box Coffee",
  "Snack Cabinet",
  "Medicine Cabinet",
  "Alcohol Cabinet",
  "Fridge",
  "Freezer",
  "Unknown"
];

export default function ProductForm({ barcode, productData }: {
  barcode?: string;
  productData?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}) {
  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    category: "",
    quantity: "1",
    completion: "",
    expiry: "",
    purchase_date: "",
    location: "",
    tags: "",
    notes: "",
    barcode: barcode || "",
    image: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingProduct, setIsLoadingProduct] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string | undefined>(undefined);
  const [isMobile, setIsMobile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Auto-populate form when productData is provided
  useEffect(() => {
    console.log('[PRODUCTFORM] Product data received:', productData);
    if (productData && barcode) {
      console.log('[PRODUCTFORM] Populating form with product data');
      setFormData(prev => ({
        ...prev,
        barcode: barcode,
        name: productData.product_name || "",
        brand: productData.brands || "",
        category: productData.categories_tags?.[0]?.replace("en:", "") || "",
        image: productData.image_url || ""
      }));
      console.log('[PRODUCTFORM] Form populated with product details');
    } else if (barcode && !productData) {
      // If we have a barcode but no product data, just set the barcode
      console.log('[PRODUCTFORM] Setting barcode only');
      setFormData(prev => ({ ...prev, barcode }));
    }
  }, [barcode, productData]);

  // Check if mobile for responsive styling
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // List available cameras
  useEffect(() => {
    async function getCameras() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter(d => d.kind === 'videoinput');
        setCameras(videoInputs);
        if (videoInputs.length > 0 && !selectedCamera) {
          // Try to find back camera first
          const backCamera = videoInputs.find(cam => 
            cam.label.toLowerCase().includes('back') || 
            cam.label.toLowerCase().includes('environment') ||
            cam.label.toLowerCase().includes('rear')
          );
          setSelectedCamera(backCamera?.deviceId || videoInputs[0].deviceId);
        }
      } catch (err) {
        console.error('Error getting cameras:', err);
      }
    }
    getCameras();
  }, [selectedCamera]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleBarcodeImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const barcode = await scanBarcodeFromImage(file);
      if (barcode) {
        setFormData(prev => ({ ...prev, barcode }));
        await fetchProductDetails(barcode);
      }
    } catch (error) {
      alert(`Failed to scan barcode from image: ${error}`);
    }

    // Clear the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const scanBarcodeFromImage = async (file: File): Promise<string | null> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const img = new window.Image();
          img.onload = async () => {
            try {
              const { BrowserMultiFormatReader } = await import("@zxing/library");
              const codeReader = new BrowserMultiFormatReader();
              const result = await codeReader.decodeFromImage(img);
              resolve(result.getText());
            } catch (error) {
              reject(error);
            }
          };
          img.src = e.target?.result as string;
        } catch (error) {
          reject(error);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const fetchProductDetails = async (barcode: string) => {
    console.log('[PRODUCTFORM] Fetching product details for barcode:', barcode);
    setIsLoadingProduct(true);
    try {
      const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      const data = await response.json();
      
      if (data.status === 1 && data.product) {
        const product = data.product;
        console.log('[PRODUCTFORM] Product found:', product.product_name);
        setFormData(prev => ({
          ...prev,
          name: product.product_name || "",
          brand: product.brands || "",
          category: product.categories_tags?.[0]?.replace("en:", "") || "",
          image: product.image_url || ""
        }));
        console.log('[PRODUCTFORM] Form data updated with product details');
      } else {
        console.log('[PRODUCTFORM] Product not found in database');
        alert("Product not found in database for this barcode.");
      }
    } catch (error) {
      console.error("Error fetching product details:", error);
    } finally {
      setIsLoadingProduct(false);
    }
  };

  const handleManualBarcodeLookup = async () => {
    if (formData.barcode) {
      await fetchProductDetails(formData.barcode);
    }
  };

  const startCamera = async () => {
    console.log('Starting camera...');
    
    // First, clean up any existing camera streams
    if (videoRef.current && videoRef.current.srcObject) {
      const existingStream = videoRef.current.srcObject as MediaStream;
      existingStream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    
    try {
      console.log('Requesting camera access...');
      
             // Try different camera constraints with fallbacks
       const constraints = [
         // Primary: use selected camera if available
         ...(selectedCamera ? [{
           video: { 
             deviceId: { exact: selectedCamera },
             width: { ideal: 1280, min: 320, max: 1920 },
             height: { ideal: 720, min: 240, max: 1080 }
           } 
         }] : []),
         // Fallback 1: environment-facing camera (back camera) with specific settings
         {
           video: { 
             facingMode: { ideal: 'environment' },
             width: { ideal: 1280, min: 320, max: 1920 },
             height: { ideal: 720, min: 240, max: 1080 }
           } 
         },
         // Fallback 2: explicit environment-facing
         {
           video: { facingMode: 'environment' }
         },
         // Fallback 3: try to get any camera but prefer back camera
         {
           video: { 
             facingMode: { ideal: 'environment', fallback: 'user' }
           }
         },
         // Fallback 4: any camera
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
      
      console.log('Camera stream obtained:', stream);
      
      // Set showCamera to true first so the video element is rendered
      setShowCamera(true);
      
      // Wait a bit for the DOM to update and the video element to be created
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (videoRef.current) {
        console.log('Setting video source...');
        videoRef.current.srcObject = stream;
        
        // Wait for video to be ready before playing
        await new Promise((resolve, reject) => {
          if (videoRef.current) {
            const timeout = setTimeout(() => {
              reject(new Error('Video load timeout'));
            }, 10000);
            
            videoRef.current!.onloadedmetadata = () => {
              clearTimeout(timeout);
              console.log('Video metadata loaded');
              resolve(true);
            };
            
            videoRef.current!.onerror = (error) => {
              clearTimeout(timeout);
              reject(new Error(`Video error: ${error}`));
            };
          } else {
            reject(new Error('Video ref is null'));
          }
        });
        
        console.log('Attempting to play video...');
        await videoRef.current.play();
        console.log('Video should be playing now');
        console.log('Camera modal should be visible now, showCamera:', true);
      } else {
        console.error('videoRef.current is null');
        setShowCamera(false); // Hide modal if video element doesn't exist
      }
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      console.error('Camera error:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      setShowCamera(false); // Hide modal on error
      alert(`Camera access denied or not available: ${error.message}`);
    }
  };

  const captureImage = async () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        
        const imageDataUrl = canvasRef.current.toDataURL('image/jpeg');
        
        // Stop camera first
        const stream = videoRef.current.srcObject as MediaStream;
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
        setShowCamera(false);
        
        // Upload image to Supabase Storage
        try {
          const response = await fetch('/api/upload-image', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ imageData: imageDataUrl })
          });
          
          const result = await response.json();
          
          if (result.success) {
            // Use the public URL instead of base64
            setCapturedImage(result.url);
            setFormData(prev => ({ ...prev, image: result.url }));
            console.log('Image uploaded successfully:', result.url);
          } else {
            console.error('Upload failed:', result.error);
            const errorMessage = result.details ? `${result.error}: ${result.details}` : result.error;
            alert(`Failed to upload image: ${errorMessage}`);
          }
        } catch (error) {
          console.error('Upload error:', error);
          alert(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Convert empty date strings to null
      const submitData = {
        ...formData,
        purchase_date: formData.purchase_date || null,
        expiry: formData.expiry || null,
        quantity: formData.quantity ? parseFloat(formData.quantity) : null,
        completion: formData.completion ? parseFloat(formData.completion) : null,
        scanned_at: new Date().toISOString().split('T')[0]
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/pantry_items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_KEY!,
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_KEY}`
        },
        body: JSON.stringify(submitData)
      });

      if (response.ok) {
        // Only try to parse JSON if there is content
        let data = null;
        const text = await response.text();
        if (text) {
          data = JSON.parse(text);
        }
        alert(`Successfully added to Supabase!${data && data.id ? ' ID: ' + data.id : ''}`);
        
        // Sync to Notion
        try {
          const notionResponse = await fetch('/api/add-to-notion', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(submitData)
          });
          
          const notionData = await notionResponse.json();
          if (notionData.success) {
            alert('Successfully synced to Notion!');
          } else {
            alert(`Notion sync failed: ${JSON.stringify(notionData)}`);
          }
        } catch (error) {
          alert(`Notion sync failed: ${error}`);
        }
        
        // Reset form
        setFormData({
          name: "",
          brand: "",
          category: "",
          quantity: "",
          completion: "",
          expiry: "",
          purchase_date: "",
          location: "",
          tags: "",
          notes: "",
          barcode: "",
          image: ""
        });
        setCapturedImage(null);
      } else {
        const errorData = await response.json();
        alert(`Error adding to Supabase: ${JSON.stringify(errorData)}`);
      }
    } catch (error) {
      alert(`Error adding to Supabase: ${error}`);
    } finally {
      setIsSubmitting(false);
    }
  };

     return (
     <div style={{ 
       padding: 20, 
       maxWidth: 600, 
       margin: '0 auto',
       paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 20px))', // Extra bottom padding for mobile
       background: 'var(--background)',
       color: 'var(--text-primary)'
     }}>
       <h2 style={{ textAlign: 'center', marginBottom: 30, color: 'var(--text-primary)' }}>Add Pantry Item</h2>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
        {/* Image Capture Section */}
        <div style={{ 
          border: '2px dashed var(--border)', 
          padding: 20, 
          borderRadius: 8, 
          textAlign: 'center',
          marginBottom: 20
        }}>
          <h3 style={{ marginBottom: 15, color: 'var(--text-primary)' }}>Product Image</h3>
          
          {capturedImage ? (
            <div>
              <Image 
                src={capturedImage} 
                alt="Captured product" 
                width={400}
                height={200}
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: 200, 
                  borderRadius: 8,
                  marginBottom: 10,
                  objectFit: 'cover'
                }}
                onError={(e) => {
                  console.error('Image failed to load:', capturedImage);
                  e.currentTarget.style.display = 'none';
                }}
              />
              <button
                type="button"
                onClick={() => {
                  setCapturedImage(null);
                  setFormData(prev => ({ ...prev, image: prev.image }));
                }}
                style={{
                  padding: '8px 16px',
                  background: 'var(--danger)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer'
                }}
              >
                Remove Image
              </button>
            </div>
          ) : formData.image ? (
            <div>
              <Image 
                src={formData.image} 
                alt="Product from OpenFoodFacts" 
                width={400}
                height={200}
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: 200, 
                  borderRadius: 8,
                  marginBottom: 10,
                  objectFit: 'cover'
                }}
                onError={(e) => {
                  console.error('Image failed to load:', formData.image);
                  e.currentTarget.style.display = 'none';
                }}
              />
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={startCamera}
                  style={{
                    padding: '8px 16px',
                    background: 'var(--primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer'
                  }}
                >
                  📷 Take Photo
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, image: "" }));
                  }}
                  style={{
                    padding: '8px 16px',
                    background: 'var(--danger)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer'
                  }}
                >
                  Remove Image
                </button>
              </div>
            </div>
          ) : (
            <div>
              <button
                type="button"
                onClick={startCamera}
                style={{
                  padding: '12px 24px',
                  background: 'var(--primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: 16,
                  marginBottom: 10
                }}
              >
                📷 Take Photo
              </button>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                Capture a photo of the product for your records
              </div>
            </div>
          )}
        </div>

                 {/* Camera Modal */}
         {showCamera && (
           <div style={{
             position: 'fixed',
             top: 0,
             left: 0,
             right: 0,
             bottom: 0,
             background: 'var(--modal-overlay)',
             display: 'flex',
             flexDirection: 'column',
             alignItems: 'center',
             justifyContent: 'center',
             zIndex: 1000,
             paddingBottom: 'env(safe-area-inset-bottom, 20px)' // Add safe area for mobile
           }}>
             <div style={{ 
               background: 'var(--modal-bg)', 
               padding: 20, 
               borderRadius: 8, 
               maxWidth: 400,
               width: '90%',
               maxHeight: '80vh',
               overflow: 'auto'
             }}>
               <h3 style={{ marginBottom: 15, color: 'var(--text-primary)' }}>Take Product Photo</h3>
               
               {/* Camera Selection */}
               {cameras.length > 1 && (
                 <div style={{ marginBottom: 15 }}>
                   <label htmlFor="camera-select" style={{ marginRight: 8, color: 'var(--text-primary)' }}>Camera:</label>
                   <select
                     id="camera-select"
                     value={selectedCamera}
                     onChange={e => setSelectedCamera(e.target.value)}
                     style={{ 
                       fontSize: 16, 
                       padding: 4,
                       background: 'var(--input-bg)',
                       color: 'var(--text-primary)',
                       border: '1px solid var(--input-border)',
                       borderRadius: 4
                     }}
                   >
                     {cameras.map(cam => (
                       <option key={cam.deviceId} value={cam.deviceId}>
                         {cam.label || `Camera ${cam.deviceId.slice(0, 8)}...`}
                       </option>
                     ))}
                   </select>
                 </div>
               )}
               
               <video
                 ref={videoRef}
                 autoPlay
                 playsInline
                 style={{ width: '100%', borderRadius: 8, marginBottom: 15 }}
               />
               <canvas ref={canvasRef} style={{ display: 'none' }} />
               
               {/* Camera Controls */}
               <div style={{ 
                 display: 'flex', 
                 gap: 10, 
                 justifyContent: 'center',
                 marginTop: 15,
                 paddingBottom: 10 // Extra padding for mobile
               }}>
                 <button
                   type="button"
                   onClick={captureImage}
                   style={{
                     padding: '12px 24px',
                     background: 'var(--success)',
                     color: 'white',
                     border: 'none',
                     borderRadius: 8,
                     cursor: 'pointer',
                     fontSize: 16,
                     fontWeight: 'bold',
                     minWidth: 100
                   }}
                 >
                   📸 Capture
                 </button>
                 <button
                   type="button"
                   onClick={() => {
                     // Clean up camera stream
                     if (videoRef.current && videoRef.current.srcObject) {
                       const stream = videoRef.current.srcObject as MediaStream;
                       stream.getTracks().forEach(track => track.stop());
                       videoRef.current.srcObject = null;
                     }
                     setShowCamera(false);
                   }}
                   style={{
                     padding: '12px 24px',
                     background: 'var(--secondary)',
                     color: 'white',
                     border: 'none',
                     borderRadius: 8,
                     cursor: 'pointer',
                     fontSize: 16,
                     fontWeight: 'bold',
                     minWidth: 100
                   }}
                 >
                   Cancel
                 </button>
               </div>
             </div>
           </div>
         )}

                 {/* Barcode Section */}
         <div style={{ 
           border: '1px solid var(--border)', 
           padding: 15, 
           borderRadius: 8,
           marginBottom: 20
         }}>
           <h3 style={{ marginBottom: 15, color: 'var(--text-primary)' }}>Barcode</h3>
           <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
             <input
               type="text"
               name="barcode"
               value={formData.barcode}
               onChange={handleInputChange}
               placeholder="Enter barcode manually"
               style={{
                 flex: 1,
                 padding: '10px',
                 border: '1px solid var(--input-border)',
                 borderRadius: 4,
                 fontSize: 16,
                 background: 'var(--input-bg)',
                 color: 'var(--text-primary)'
               }}
             />
             <button
               type="button"
               onClick={handleManualBarcodeLookup}
               disabled={isLoadingProduct}
               style={{
                 padding: '10px 20px',
                 background: isLoadingProduct ? 'var(--secondary)' : '#17a2b8',
                 color: 'white',
                 border: 'none',
                 borderRadius: 4,
                 cursor: isLoadingProduct ? 'not-allowed' : 'pointer'
               }}
             >
               {isLoadingProduct ? 'Loading...' : 'Lookup Product'}
             </button>
           </div>
           {isLoadingProduct && (
             <div style={{ 
               background: 'var(--stats-card-active)', 
               color: 'var(--primary)', 
               padding: 10, 
               borderRadius: 4, 
               marginBottom: 10,
               textAlign: 'center'
             }}>
               🔍 Looking up product details...
             </div>
           )}
          <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 10 }}>
            Or upload a barcode image:
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={handleBarcodeImageUpload}
            ref={fileInputRef}
            style={{ fontSize: 14 }}
          />
        </div>

        {/* Product Details */}
        <div style={{ display: 'grid', gap: 15 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold', color: 'var(--text-primary)' }}>
              Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid var(--input-border)',
                borderRadius: 4,
                fontSize: 16,
                background: 'var(--input-bg)',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold', color: 'var(--text-primary)' }}>
              Brand
            </label>
            <input
              type="text"
              name="brand"
              value={formData.brand}
              onChange={handleInputChange}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid var(--input-border)',
                borderRadius: 4,
                fontSize: 16,
                background: 'var(--input-bg)',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold', color: 'var(--text-primary)' }}>
              Category
            </label>
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid var(--input-border)',
                borderRadius: 4,
                fontSize: 16,
                background: 'var(--input-bg)',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold', color: 'var(--text-primary)' }}>
              Quantity
            </label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleInputChange}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid var(--input-border)',
                borderRadius: 4,
                fontSize: 16,
                background: 'var(--input-bg)',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold', color: 'var(--text-primary)' }}>
              How much left (%) (Optional)
            </label>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <input
                type="number"
                name="completion"
                value={formData.completion}
                onChange={handleInputChange}
                min="0"
                max="100"
                placeholder="Enter percentage (0-100)"
                style={{
                  flex: 1,
                  padding: '10px',
                  border: '1px solid var(--input-border)',
                  borderRadius: 4,
                  fontSize: 16,
                  background: 'var(--input-bg)',
                  color: 'var(--text-primary)'
                }}
              />
              <span style={{ fontSize: 14, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                % remaining
              </span>
            </div>
            <div style={{ marginTop: 5, fontSize: 12, color: 'var(--text-secondary)' }}>
              <div>100% = Unopened/New</div>
              <div>0% = Used Up</div>
              <div>Leave empty for new items</div>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold', color: 'var(--text-primary)' }}>
              Location
            </label>
            <select
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid var(--input-border)',
                borderRadius: 4,
                fontSize: isMobile ? 14 : 16,
                background: 'var(--input-bg)',
                color: 'var(--text-primary)'
              }}
            >
              <option value="">-- Select Location --</option>
              {LOCATION_OPTIONS.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold', color: 'var(--text-primary)' }}>
              Purchase Date (Optional)
            </label>
            <input
              type="date"
              name="purchase_date"
              value={formData.purchase_date}
              onChange={handleInputChange}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid var(--input-border)',
                borderRadius: 4,
                fontSize: 16,
                background: 'var(--input-bg)',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold', color: 'var(--text-primary)' }}>
              Expiry Date (Optional)
            </label>
            <input
              type="date"
              name="expiry"
              value={formData.expiry}
              onChange={handleInputChange}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid var(--input-border)',
                borderRadius: 4,
                fontSize: 16,
                background: 'var(--input-bg)',
                color: 'var(--text-primary)'
              }}
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold', color: 'var(--text-primary)' }}>
            Tags (Optional)
          </label>
          <input
            type="text"
            name="tags"
            value={formData.tags}
            onChange={handleInputChange}
            placeholder="e.g., organic, gluten-free, favorite"
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid var(--input-border)',
              borderRadius: 4,
              fontSize: 16,
              background: 'var(--input-bg)',
              color: 'var(--text-primary)'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold', color: 'var(--text-primary)' }}>
            Notes (Optional)
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            rows={3}
            placeholder="Any additional notes about this item..."
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid var(--input-border)',
              borderRadius: 4,
              fontSize: 16,
              resize: 'vertical',
              background: 'var(--input-bg)',
              color: 'var(--text-primary)'
            }}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            padding: '15px 30px',
            background: isSubmitting ? 'var(--secondary)' : 'var(--success)',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            fontSize: 16,
            fontWeight: 'bold',
            marginTop: 20
          }}
        >
          {isSubmitting ? 'Adding...' : 'Add to Pantry'}
        </button>
      </form>
    </div>
  );
}
