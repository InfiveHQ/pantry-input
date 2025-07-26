import { useState } from "react";
import BarcodeScanner from "@/components/BarcodeScanner";
import ProductForm from "@/components/ProductForm";

export default function Home() {
  const [product, setProduct] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [showScanner, setShowScanner] = useState(false);

  async function fetchProduct(code: string) {
    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${code}.json`);
      const data = await res.json();
      if (data.status === 1) {
        setProduct({ 
          name: data.product.product_name || "", 
          brand: data.product.brands || "", 
          category: data.product.categories || "", 
          barcode: code,
          image: data.product.image_url || ""
        });
      } else {
        setProduct({ name: "", brand: "", category: "", barcode: code });
      }
      setShowScanner(false);
    } catch (error) {
      console.error('Error fetching product:', error);
      setProduct({ name: "", brand: "", category: "", barcode: code });
      setShowScanner(false);
    }
  }

  if (showScanner) {
    return (
      <BarcodeScanner
        onScan={(code) => {
          fetchProduct(code);
        }}
        onManualEntry={() => setShowScanner(false)}
      />
    );
  }

  return (
    <div>
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
          margin: '20px'
        }}
      >
        Scan Barcode
      </button>
      <ProductForm product={product} />
    </div>
  );
}
