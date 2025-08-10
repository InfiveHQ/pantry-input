import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";

import Navigation from "../components/Navigation";
import FloatingAddButton from "../components/FloatingAddButton";

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
  shopping_list_id?: number;
  added_by?: string;
  added_at?: string;
}

export default function ShoppingList() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [shoppingList, setShoppingList] = useState<PantryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    
    if (user) {
      fetchShoppingList();
    }
  }, [user, authLoading, router]);

  // Check if mobile for responsive layout
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  const fetchShoppingList = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('No session found');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/shopping-list', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setShoppingList(data);
      } else {
        console.error('Failed to fetch shopping list');
      }
    } catch (error) {
      console.error('Error fetching shopping list:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const removeFromShoppingList = async (shoppingListId: number) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Please log in to remove items from shopping list');
        return;
      }

      const response = await fetch('/api/shopping-list', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ shoppingListId })
      });

      if (response.ok) {
        setShoppingList(shoppingList.filter(item => item.shopping_list_id !== shoppingListId));
      } else {
        alert('Failed to remove item from shopping list');
      }
    } catch (error) {
      console.error('Error removing item from shopping list:', error);
      alert('Error removing item from shopping list');
    }
  };

  const clearShoppingList = async () => {
    if (shoppingList.length === 0) return;
    if (confirm('Are you sure you want to clear your shopping list?')) {
              try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            alert('Please log in to clear shopping list');
            return;
          }

          // Remove all items one by one
          const deletePromises = shoppingList.map(item => 
            fetch('/api/shopping-list', {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
              },
              body: JSON.stringify({ shoppingListId: item.shopping_list_id })
            })
          );

          await Promise.all(deletePromises);
          setShoppingList([]);
        } catch (error) {
          console.error('Error clearing shopping list:', error);
          alert('Error clearing shopping list');
        }
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
        <div style={{
      padding: 20,
      maxWidth: '100%',
      margin: '0 auto',
      background: 'var(--background)',
      color: 'var(--foreground)',
      minHeight: '100vh',
      position: 'relative',
      paddingTop: isMobile ? '15px' : '50px', // Responsive padding for compact desktop nav
      paddingBottom: isMobile ? '70px' : '15px' // Reduced bottom padding for compact mobile nav
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 20,
        position: 'relative'
      }}>
        {/* Left side - Title */}
        <h1 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '24px' }}>Shopping List</h1>
        
        {/* Right side - Clear All */}
        {shoppingList.length > 0 && (
          <button
            onClick={clearShoppingList}
            style={{
              padding: '6px 12px',
              background: 'transparent',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              fontWeight: '500',
              cursor: 'pointer',
              fontSize: '12px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--danger)';
              e.currentTarget.style.color = 'white';
              e.currentTarget.style.borderColor = 'var(--danger)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text-secondary)';
              e.currentTarget.style.borderColor = 'var(--border)';
            }}
          >
            Clear All
          </button>
        )}
      </div>

      {/* Compact Stats */}
      {shoppingList.length > 0 && (
        <div style={{ 
          marginBottom: 20,
          padding: '12px 16px',
          background: 'var(--card-bg)',
          borderRadius: 8,
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <span style={{ fontSize: 18, fontWeight: 'bold', color: 'var(--primary)' }}>{shoppingList.length}</span>
          <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            item{shoppingList.length !== 1 ? 's' : ''} in your list
          </span>
        </div>
      )}

      {/* Shopping List Content */}
      {shoppingList.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: 40, 
          color: 'var(--text-secondary)',
          background: 'var(--card-bg)',
          borderRadius: 8,
          border: '1px solid var(--border)',
          marginTop: 20
        }}>
          <h3 style={{ margin: '0 0 16px 0', color: 'var(--text-primary)' }}>Your shopping list is empty</h3>
          <p style={{ margin: '0 0 20px 0', fontSize: 14 }}>
            Click &quot;Shop&quot; on any item in your inventory to add it here!
          </p>
          <Link href="/inventory" style={{
            padding: '10px 20px',
            background: 'var(--primary)',
            color: 'white',
            textDecoration: 'none',
            borderRadius: 6,
            fontWeight: '500',
            display: 'inline-block',
            fontSize: '14px',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
          >
            Go to Inventory
          </Link>
        </div>
      ) : (
        <>
          {/* Items Grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, 320px)', 
            gap: 16,
            maxWidth: '100%',
            justifyContent: 'center'
          }}>
            {shoppingList.map(item => (
              <div key={item.id} style={{
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: 16,
                background: 'var(--card-bg)',
                position: 'relative',
                width: '100%',
                height: '400px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
              }}
              >
                {/* Image */}
                {item.image && (
                  <div style={{ 
                    textAlign: 'center', 
                    marginBottom: 12,
                    height: 160,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={200}
                      height={160}
                      style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        borderRadius: 6,
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
                <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)', fontSize: '16px' }}>{item.name}</h3>
                
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12, flex: 1 }}>
                  {item.brand && <div><strong>Brand:</strong> {item.brand}</div>}
                  {item.category && <div><strong>Category:</strong> {item.category}</div>}
                  <div><strong>Quantity:</strong> {item.quantity}</div>
                  {item.location && <div><strong>Location:</strong> {item.location}</div>}
                </div>

                {/* Action Button */}
                <button
                  onClick={() => removeFromShoppingList(item.shopping_list_id!)}
                  style={{
                    padding: '8px 12px',
                    background: 'transparent',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: 12,
                    width: '100%',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--danger)';
                    e.currentTarget.style.color = 'white';
                    e.currentTarget.style.borderColor = 'var(--danger)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                    e.currentTarget.style.borderColor = 'var(--border)';
                  }}
                >
                  Remove from List
                </button>
              </div>
            ))}
          </div>
        </>
      )}
      
      {/* Navigation and Floating Add Button */}
      <Navigation />
      <FloatingAddButton />
    </div>
  );
} 