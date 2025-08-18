import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../contexts/AuthContext";
import ProductForm from "../components/ProductForm";
import BarcodeScanner from "../components/BarcodeScanner";

import Navigation from "../components/Navigation";
import FloatingAddButton from "../components/FloatingAddButton";

export default function AddItem() {
  const [showScanner, setShowScanner] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState<string>("");
  const [productData, setProductData] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  
  // Get default room from URL parameter
  const defaultRoom = router.query.room as string || 'Kitchen'; // Default to Kitchen if no room specified

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Check if mobile for responsive layout
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Show loading while checking authentication
  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'var(--background)'
      }}>
        <div style={{ color: 'var(--text-primary)' }}>Loading...</div>
      </div>
    );
  }

  // Don't render anything if not authenticated (will redirect)
  if (!user) {
    return null;
  }

  const handleManualEntry = () => {
    setShowScanner(false);
  };

  const fetchProduct = async (barcode: string) => {
    console.log('[ADD-ITEM] Fetching product for barcode:', barcode);
    try {
      const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      const data = await response.json();
      
      if (data.status === 1 && data.product) {
        console.log('[ADD-ITEM] Product found:', data.product.product_name);
        // Set the barcode and product data
        setScannedBarcode(barcode);
        setProductData(data.product);
        setShowScanner(false);
      } else {
        console.log('[ADD-ITEM] Product not found in database');
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
        <div style={{
      minHeight: '100vh',
      background: 'var(--background)',
      position: 'relative',
      paddingTop: isMobile ? '15px' : '50px', // Responsive padding for compact desktop nav
      paddingBottom: isMobile ? '70px' : '15px' // Reduced bottom padding for compact mobile nav
    }}>
      {/* Header with Theme Toggle and Sign Out */}
      <div style={{ padding: 20 }}>


        {showScanner ? (
          <BarcodeScanner 
            onScan={fetchProduct}
            onManualEntry={handleManualEntry}
          />
        ) : (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 30 }}>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
                Add items to your pantry inventory
              </p>
              <button
                onClick={() => setShowScanner(true)}
                style={{
                  padding: '12px 24px',
                  background: 'var(--primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: 16,
                  marginBottom: 20,
                  fontWeight: '600',
                  transition: 'opacity 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >
                📷 Scan Barcode
              </button>
            </div>
            <ProductForm 
              barcode={scannedBarcode}
              productData={productData}
              defaultRoom={defaultRoom}
            />
          </div>
        )}
      </div>
      
      {/* Navigation and Floating Add Button */}
      <Navigation />
      <FloatingAddButton />
    </div>
  );
} 