import { useState } from "react";
import BarcodeScanner from "@/components/BarcodeScanner";
import ProductForm from "@/components/ProductForm";

export default function Home() {
  const [barcode, setBarcode] = useState<string | null>(null);
  const [product, setProduct] = useState<any>(null);
  const [showScanner, setShowScanner] = useState(false);

  async function fetchProduct(code: string) {
    const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${code}.json`);
    const data = await res.json();
    if (data.status === 1) {
      setProduct({
        name: data.product.product_name || "",
        brand: data.product.brands || "",
        category: data.product.categories || "",
        image: data.product.image_url || "",
        barcode: code,
      });
    } else {
      setProduct({ name: "", brand: "", category: "", barcode: code });
    }
    setBarcode(code);
    setShowScanner(false);
  }

  return (
    <div style={{ padding: 20 }}>
      {showScanner ? (
        <>
          <BarcodeScanner onScan={fetchProduct} />
          <button onClick={() => setShowScanner(false)} style={{ marginTop: 10 }}>
            Cancel
          </button>
        </>
      ) : (
        <>
          <ProductForm product={product} />
          <button onClick={() => setShowScanner(true)} style={{ marginTop: 10, padding: 8, background: '#007bff', color: 'white', border: 'none', borderRadius: 4 }}>
            Scan Barcode
          </button>
        </>
      )}
    </div>
  );
}
