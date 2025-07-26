import { useState } from "react";
import ProductForm from "../components/ProductForm";
import BarcodeScanner from "../components/BarcodeScanner";

export default function Home() {
  const [showScanner, setShowScanner] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState<string>("");
  const [productData, setProductData] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleBarcodeScanned = (barcode: string) => {
    console.log('[MAIN] Barcode scanned:', barcode);
    setScannedBarcode(barcode);
    setShowScanner(false);
  };

  const handleManualEntry = () => {
    setShowScanner(false);
  };

  const fetchProduct = async (barcode: string) => {
    console.log('[MAIN] Fetching product for barcode:', barcode);
    try {
      const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      const data = await response.json();
      
      if (data.status === 1 && data.product) {
        console.log('[MAIN] Product found:', data.product.product_name);
        // Set the barcode and product data
        setScannedBarcode(barcode);
        setProductData(data.product);
        setShowScanner(false);
      } else {
        console.log('[MAIN] Product not found in database');
        alert("Product not found in database for this barcode.");
        // Still set the barcode so user can manually enter product details
        setScannedBarcode(barcode);
        setProductData(null);
        setShowScanner(false);
      }
    } catch (error) {
      console.error("Error fetching product details:", error);
      alert("Failed to fetch product details.");
      // Still set the barcode so user can manually enter product details
      setScannedBarcode(barcode);
      setProductData(null);
      setShowScanner(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      <div style={{ padding: 20 }}>
        {showScanner ? (
          <BarcodeScanner 
            onScan={fetchProduct}
            onManualEntry={handleManualEntry}
          />
        ) : (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 30 }}>
              <h1 style={{ color: '#333', marginBottom: 10 }}>Pantry Input</h1>
              <p style={{ color: '#666', marginBottom: 20 }}>
                Add items to your pantry inventory
              </p>
              <button
                onClick={() => setShowScanner(true)}
                style={{
                  padding: '12px 24px',
                  background: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: 16,
                  marginBottom: 20
                }}
              >
                📷 Scan Barcode
              </button>
            </div>
            <ProductForm 
              barcode={scannedBarcode}
              productData={productData}
            />
          </div>
        )}
      </div>
    </div>
  );
}
