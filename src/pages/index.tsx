import { useState } from "react";
import ProductForm from "../components/ProductForm";
import BarcodeScanner from "../components/BarcodeScanner";

export default function Home() {
  const [showScanner, setShowScanner] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState<string>("");

  const handleBarcodeScanned = (barcode: string) => {
    setScannedBarcode(barcode);
    setShowScanner(false);
  };

  const handleManualEntry = () => {
    setShowScanner(false);
  };

  const fetchProduct = async (barcode: string) => {
    try {
      const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      const data = await response.json();
      
      if (data.status === 1 && data.product) {
        const product = data.product;
        // Product details will be handled by ProductForm
        setScannedBarcode(barcode);
        setShowScanner(false);
      } else {
        alert("Product not found in database for this barcode.");
      }
    } catch (error) {
      console.error("Error fetching product details:", error);
      alert("Failed to fetch product details.");
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
              onBarcodeScanned={handleBarcodeScanned}
            />
          </div>
        )}
      </div>
    </div>
  );
}
