import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "../contexts/AuthContext";
import ProductForm from "../components/ProductForm";
import BarcodeScanner from "../components/BarcodeScanner";

export default function Home() {
  const [showScanner, setShowScanner] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState<string>("");
  const [productData, setProductData] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Show loading while checking authentication
  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#f8f9fa'
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  // Don't render anything if not authenticated (will redirect)
  if (!user) {
    return null;
  }

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

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <div style={{ padding: 20 }}>
        {showScanner ? (
          <BarcodeScanner 
            onScan={fetchProduct}
            onManualEntry={handleManualEntry}
          />
        ) : (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 30 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h1 style={{ color: 'var(--text-primary)', margin: 0 }}>Pantry Input</h1>
                <div style={{ display: 'flex', gap: 10 }}>
                  <Link href="/inventory" style={{
                    padding: '10px 20px',
                    background: 'var(--primary)',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: 4,
                    fontWeight: 'bold'
                  }}>
                    📋 View Inventory
                  </Link>
                  <Link href="/households" style={{
                    padding: '10px 20px',
                    background: 'var(--success)',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: 4,
                    fontWeight: 'bold'
                  }}>
                    🏠 Households
                  </Link>
                  <button
                    onClick={handleSignOut}
                    style={{
                      padding: '10px 20px',
                      background: 'var(--danger)',
                      color: 'white',
                      border: 'none',
                      borderRadius: 4,
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    Sign Out
                  </button>
                </div>
              </div>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
                Welcome, {user.email}! Add items to your pantry inventory
              </p>
              <button
                onClick={() => setShowScanner(true)}
                style={{
                  padding: '12px 24px',
                  background: 'var(--primary)',
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
