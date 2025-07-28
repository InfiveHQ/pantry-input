import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "../contexts/AuthContext";

interface PantryItem {
  id: number;
  name: string;
  brand: string;
  category: string;
  quantity: number;
  completion: number;
  expiry: string;
  purchase_date: string;
  location: string;
  tags: string;
  notes: string;
  barcode: string;
  image: string;
  scanned_at: string;
}

export default function ShoppingList() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [shoppingList, setShoppingList] = useState<PantryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    
    if (user) {
      // For now, we'll load from localStorage. In the future, this could be from a database
      const savedList = localStorage.getItem('shoppingList');
      if (savedList) {
        setShoppingList(JSON.parse(savedList));
      }
      setLoading(false);
    }
  }, [user, authLoading, router]);

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#f8f9fa'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2>Loading...</h2>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!user) {
    return null;
  }

  const removeFromShoppingList = (itemId: number) => {
    const updatedList = shoppingList.filter(item => item.id !== itemId);
    setShoppingList(updatedList);
    localStorage.setItem('shoppingList', JSON.stringify(updatedList));
  };

  const clearShoppingList = () => {
    if (shoppingList.length === 0) return;
    if (confirm('Are you sure you want to clear your shopping list?')) {
      setShoppingList([]);
      localStorage.removeItem('shoppingList');
    }
  };



  if (loading) {
    return (
      <div style={{ padding: 20, textAlign: 'center' }}>
        <h2>Loading shopping list...</h2>
      </div>
    );
  }

  return (
    <div style={{ padding: 20, maxWidth: '100%', margin: '0 auto' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
         <h1 style={{ color: '#333', margin: 0 }}>🛒 Shopping List</h1>
         <div style={{ display: 'flex', gap: 10 }}>
           <Link href="/" style={{
             padding: '10px 20px',
             background: '#28a745',
             color: 'white',
             textDecoration: 'none',
             borderRadius: 4,
             fontWeight: 'bold'
           }}>
             ➕ Add Item
           </Link>
           <Link href="/inventory" style={{
             padding: '10px 20px',
             background: '#007bff',
             color: 'white',
             textDecoration: 'none',
             borderRadius: 4,
             fontWeight: 'bold'
           }}>
             ← Back to Inventory
           </Link>
         </div>
       </div>

      {/* Stats Card */}
      <div style={{ 
        display: 'flex', 
        gap: 10, 
        marginBottom: 30,
        flexWrap: 'wrap'
      }}>
        <div style={{ 
          background: '#f8fff8',
          padding: '15px 20px', 
          borderRadius: 8, 
          border: '2px solid #28a745',
          display: 'flex',
          alignItems: 'center',
          gap: 10
        }}>
          <span style={{ fontSize: 24, fontWeight: 'bold', color: '#28a745' }}>{shoppingList.length}</span>
          <span style={{ fontSize: 16, color: '#666' }}>Items to Purchase</span>
        </div>
      </div>

      {/* Shopping List Content */}
      {shoppingList.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: 60, 
          color: '#666',
          background: '#f8f9fa',
          borderRadius: 8,
          border: '2px dashed #dee2e6'
        }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#333' }}>Your shopping list is empty</h3>
          <p style={{ margin: '0 0 20px 0', fontSize: 16 }}>
            Click &quot;Shop&quot; on any item in your inventory to add it here!
          </p>
          <Link href="/inventory" style={{
            padding: '12px 24px',
            background: '#28a745',
            color: 'white',
            textDecoration: 'none',
            borderRadius: 6,
            fontWeight: 'bold',
            display: 'inline-block'
          }}>
            Go to Inventory
          </Link>
        </div>
      ) : (
        <>
          {/* Actions Bar */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: 30,
            padding: '15px 20px',
            background: '#f8fff8',
            borderRadius: 8,
            border: '1px solid #28a745'
          }}>
            <div>
              <h3 style={{ margin: 0, color: '#28a745' }}>Ready to shop?</h3>
              <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: 14 }}>
                {shoppingList.length} item{shoppingList.length !== 1 ? 's' : ''} in your list
              </p>
            </div>
            <button
              onClick={clearShoppingList}
              style={{
                padding: '10px 20px',
                background: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 'bold'
              }}
            >
              Clear All
            </button>
          </div>

          {/* Items Grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: 20,
            maxWidth: '100%'
          }}>
            {shoppingList.map(item => (
              <div key={item.id} style={{
                border: '2px solid #28a745',
                borderRadius: 8,
                padding: 20,
                background: 'white',
                position: 'relative',
                maxWidth: '400px',
                justifySelf: 'center',
                boxShadow: '0 2px 8px rgba(40, 167, 69, 0.1)'
              }}>
                {/* Image */}
                {item.image && (
                  <div style={{ 
                    textAlign: 'center', 
                    marginBottom: 15,
                    height: 200,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={250}
                      height={200}
                      style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        borderRadius: 8,
                        objectFit: 'contain'
                      }}
                      onError={(e) => {
                        console.error('Image failed to load:', item.image);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}

                {/* Item Details */}
                <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>{item.name}</h3>
                
                <div style={{ fontSize: 14, color: '#666', marginBottom: 15 }}>
                  {item.brand && <div><strong>Brand:</strong> {item.brand}</div>}
                  {item.category && <div><strong>Category:</strong> {item.category}</div>}
                  <div><strong>Quantity:</strong> {item.quantity}</div>
                  {item.location && <div><strong>Location:</strong> {item.location}</div>}
                </div>

                                 {/* Action Buttons */}
                 <div style={{ display: 'flex', gap: 10, marginTop: 15 }}>
                   <button
                     onClick={() => removeFromShoppingList(item.id)}
                     style={{
                       padding: '8px 16px',
                       background: '#dc3545',
                       color: 'white',
                       border: 'none',
                       borderRadius: 4,
                       cursor: 'pointer',
                       fontSize: 13,
                       width: '100%'
                     }}
                   >
                     Remove from List
                   </button>
                 </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
} 