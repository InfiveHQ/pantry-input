import { useState, useRef } from "react";
import { BrowserMultiFormatReader } from "@zxing/library";

const LOCATIONS = [
  "Shelf Top Large",
  "Shelf Bottom",
  "Shelf Top Small",
  "Countertop",
  "Fridge",
  "Freezer",
];

export default function ProductForm({ product }: { product: any }) { // eslint-disable-line @typescript-eslint/no-explicit-any
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    ...product,
    quantity: 1,
    completion: 100,
    expiry: "",
    purchase_date: "",
    scanned_at: new Date().toISOString().split("T")[0],
    location: "",
    tags: "",
    notes: "",
    image: product?.image || "",
  });

  const handleChange = (e: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    // TEMP: Log env variables to debug
    console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('SUPABASE_KEY:', process.env.NEXT_PUBLIC_SUPABASE_KEY);

    // Convert empty string dates to null
    const dataToSend = { ...formData };
    if (dataToSend.purchase_date === "") dataToSend.purchase_date = null;
    if (dataToSend.expiry === "") dataToSend.expiry = null;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/pantry_items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: process.env.NEXT_PUBLIC_SUPABASE_KEY!,
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_KEY}`,
          Prefer: "return=representation",
        },
        body: JSON.stringify(dataToSend),
      });

      const data = await response.json().catch(() => ({}));
      console.log('Supabase response:', response, data);

      if (!response.ok) {
        alert(`Error adding to Supabase: ${data.message || response.statusText} (status: ${response.status})\nResponse: ${JSON.stringify(data)}`);
        return;
      }

      // Sync to Notion
      try {
        console.log('Syncing to Notion...');
        const notionResponse = await fetch('/api/add-to-notion', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(dataToSend),
        });

        const notionData = await notionResponse.json();
        
        if (notionResponse.ok && notionData.success) {
          console.log('Notion sync successful:', notionData);
          alert("Added to Supabase and synced to Notion!");
        } else {
          console.error('Notion sync failed:', notionData);
          alert("Added to Supabase but failed to sync to Notion. Check console for details.");
        }
      } catch (notionError) {
        console.error('Notion sync error:', notionError);
        alert("Added to Supabase but failed to sync to Notion.");
      }

      window.location.reload();
    } catch (error) {
      console.error('Supabase fetch error:', error);
      alert(`Network or JS error: ${error}`);
    }
  };

  // Handler for barcode image upload
  const handleBarcodeImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      console.log('No file selected');
      return;
    }
    
    console.log('File uploaded:', file.name, file.type, file.size);
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      const imgDataUrl = event.target?.result as string;
      console.log('Image loaded, attempting to scan...');
      
      try {
        // Create an image element from the file
        const img = new Image();
        
        img.onload = async () => {
          try {
            console.log('Image fully loaded, starting barcode scan with ZXing...');
            const codeReader = new BrowserMultiFormatReader();
            
            // Use the image element directly
            const result = await codeReader.decodeFromImage(img);
            console.log('Scan result:', result);
            
                         if (result && result.getText()) {
               const barcodeValue = result.getText();
               console.log('Barcode found, updating form...');
               setFormData((prev: any) => ({ ...prev, barcode: barcodeValue })); // eslint-disable-line @typescript-eslint/no-explicit-any
              alert(`Barcode found: ${barcodeValue}`);
              
              // Fetch product details from OpenFoodFacts API
              try {
                console.log('Fetching product details for barcode:', barcodeValue);
                const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcodeValue}.json`);
                const data = await res.json();
                console.log('API response:', data);
                
                if (data.status === 1) {
                  console.log('Product found, updating form with:', {
                    name: data.product.product_name,
                    brand: data.product.brands,
                    category: data.product.categories,
                    image: data.product.image_url
                  });
                  setFormData((prev: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
                    ...prev,
                    name: data.product.product_name || prev.name,
                    brand: data.product.brands || prev.brand,
                    category: data.product.categories || prev.category,
                    image: data.product.image_url || prev.image,
                  }));
                  alert("Product details loaded successfully!");
                } else {
                  console.log('Product not found in database');
                  alert("Product not found in database, but barcode was scanned.");
                }
              } catch (apiError) {
                console.error('API error:', apiError);
                alert("Barcode scanned but failed to fetch product details.");
              }
            } else {
              console.log('No barcode found in image');
              alert("No barcode found in image. Make sure the barcode is clearly visible and not blurry.");
            }
                           } catch (err) {
                   console.error('Scanning error:', err);
                   const errorMsg = (err && (err as any).message) ? (err as any).message : String(err); // eslint-disable-line @typescript-eslint/no-explicit-any
            alert(`Failed to scan barcode from image: ${errorMsg}\n\nYou can manually enter the barcode number in the field above.`);
          }
        };
        
        img.onerror = () => {
          alert('Failed to load image for scanning.');
        };
        
        img.src = imgDataUrl;
      } catch (err) {
        console.error('Image processing error:', err);
        alert(`Failed to process image: ${err}`);
      }
      
      // Clear the file input so user can re-upload the same file
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    
    reader.onerror = (error) => {
      console.error('FileReader error:', error);
    };
    
    reader.readAsDataURL(file);
  };

  // Handler for manual barcode lookup
  const handleManualBarcodeLookup = async () => {
    const barcodeValue = formData.barcode;
    if (!barcodeValue) {
      alert("Please enter a barcode number first.");
      return;
    }

    try {
      console.log('Fetching product details for barcode:', barcodeValue);
      const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcodeValue}.json`);
      const data = await res.json();
      console.log('API response:', data);
      
      if (data.status === 1) {
        console.log('Product found, updating form with:', {
          name: data.product.product_name,
          brand: data.product.brands,
          category: data.product.categories,
          image: data.product.image_url
        });
        setFormData((prev: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
          ...prev,
          name: data.product.product_name || prev.name,
          brand: data.product.brands || prev.brand,
          category: data.product.categories || prev.category,
          image: data.product.image_url || prev.image,
        }));
        alert("Product details loaded successfully!");
      } else {
        console.log('Product not found in database');
        alert("Product not found in database for this barcode.");
      }
    } catch (apiError) {
      console.error('API error:', apiError);
      alert("Failed to fetch product details.");
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '40px auto', padding: 24, border: '1px solid #eee', borderRadius: 10, background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
      <div style={{ color: '#1aaf5d', fontWeight: 600, marginBottom: 8 }}>Form loaded. File input handler attached.</div>
      {formData.image && (
        <img src={formData.image} alt="product" style={{ width: 100, margin: '0 auto 16px', display: 'block', borderRadius: 8 }} />
      )}
      <form onSubmit={e => { e.preventDefault(); handleSubmit(); }}>
        <div style={{ marginBottom: 16 }}>
          <label htmlFor="name" style={{ display: 'block', marginBottom: 4 }}>Product Name</label>
          <input id="name" name="name" value={formData.name || ""} onChange={handleChange} style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4 }} required />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label htmlFor="brand" style={{ display: 'block', marginBottom: 4 }}>Brand</label>
          <input id="brand" name="brand" value={formData.brand || ""} onChange={handleChange} style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4 }} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label htmlFor="category" style={{ display: 'block', marginBottom: 4 }}>Category</label>
          <input id="category" name="category" value={formData.category || ""} onChange={handleChange} style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4 }} />
        </div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <label htmlFor="quantity" style={{ display: 'block', marginBottom: 4 }}>Quantity</label>
            <input id="quantity" name="quantity" type="number" min="0" value={formData.quantity || ""} onChange={handleChange} style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4 }} />
          </div>
          <div style={{ flex: 1 }}>
            <label htmlFor="completion" style={{ display: 'block', marginBottom: 4 }}>Completion (%)</label>
            <input id="completion" name="completion" type="number" min="0" max="100" value={formData.completion || ""} onChange={handleChange} style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4 }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <label htmlFor="purchase_date" style={{ display: 'block', marginBottom: 4 }}>Purchase Date <span style={{ color: '#888', fontWeight: 400 }}>(optional)</span></label>
            <input id="purchase_date" name="purchase_date" type="date" value={formData.purchase_date || ""} onChange={handleChange} style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4 }} placeholder="YYYY-MM-DD" />
          </div>
          <div style={{ flex: 1 }}>
            <label htmlFor="expiry" style={{ display: 'block', marginBottom: 4 }}>Expiry Date <span style={{ color: '#888', fontWeight: 400 }}>(optional)</span></label>
            <input id="expiry" name="expiry" type="date" value={formData.expiry || ""} onChange={handleChange} style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4 }} placeholder="YYYY-MM-DD" />
          </div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label htmlFor="scanned_at" style={{ display: 'block', marginBottom: 4 }}>Scanned At</label>
          <input id="scanned_at" name="scanned_at" type="date" value={formData.scanned_at || ""} onChange={handleChange} style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4 }} required />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label htmlFor="barcode" style={{ display: 'block', marginBottom: 4 }}>Barcode</label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <input 
              id="barcode" 
              name="barcode" 
              value={formData.barcode || ""} 
              onChange={handleChange} 
              style={{ flex: 1, padding: 8, border: '1px solid #ccc', borderRadius: 4 }} 
            />
            <button 
              type="button"
              onClick={handleManualBarcodeLookup}
              style={{ 
                padding: '8px 12px', 
                background: '#007bff', 
                color: '#fff', 
                border: 'none', 
                borderRadius: 4, 
                cursor: 'pointer',
                fontSize: 12
              }}
            >
              Lookup Product
            </button>
          </div>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={e => {
              console.log('File input changed');
              handleBarcodeImageUpload(e);
            }}
            style={{ marginTop: 8 }}
          />
          <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                         Upload a barcode image to auto-fill, or enter barcode manually and click &quot;Lookup Product&quot;
          </div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label htmlFor="location" style={{ display: 'block', marginBottom: 4 }}>Location</label>
          <select id="location" name="location" onChange={handleChange} value={formData.location} style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4 }}>
            <option value="">Select</option>
            {LOCATIONS.map((loc) => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label htmlFor="tags" style={{ display: 'block', marginBottom: 4 }}>Tags</label>
          <input id="tags" name="tags" value={formData.tags || ""} onChange={handleChange} style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4 }} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label htmlFor="notes" style={{ display: 'block', marginBottom: 4 }}>Notes</label>
          <input id="notes" name="notes" value={formData.notes || ""} onChange={handleChange} style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4 }} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label htmlFor="image" style={{ display: 'block', marginBottom: 4 }}>Image URL</label>
          <input id="image" name="image" value={formData.image || ""} onChange={handleChange} style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4 }} />
        </div>
        <button type="submit" style={{ width: '100%', padding: 12, background: '#1aaf5d', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 600, fontSize: 16, cursor: 'pointer', transition: 'background 0.2s' }}
          onMouseOver={e => (e.currentTarget.style.background = '#178c4a')}
          onMouseOut={e => (e.currentTarget.style.background = '#1aaf5d')}
        >
          Add to Supabase
        </button>
      </form>
    </div>
  );
}
