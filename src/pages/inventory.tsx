import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

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

export default function Inventory() {
  const [items, setItems] = useState<PantryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [sortBy, setSortBy] = useState("name");

  const locations = [
    "Shelf Top Small",
    "Shelf Top Right", 
    "Shelf Top Large",
    "Shelf Bottom",
    "Countertop",
    "Fridge",
    "Freezer",
    "Unknown"
  ];

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/pantry_items?select=*&order=scanned_at.desc`, {
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_KEY!,
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_KEY}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setItems(data);
      } else {
        console.error('Failed to fetch items');
      }
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (id: number) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/pantry_items?id=eq.${id}`, {
        method: 'DELETE',
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_KEY!,
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_KEY}`
        }
      });

      if (response.ok) {
        setItems(items.filter(item => item.id !== id));
        alert('Item deleted successfully');
      } else {
        alert('Failed to delete item');
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Error deleting item');
    }
  };

  const markAsUsed = async (id: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/pantry_items?id=eq.${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_KEY!,
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_KEY}`
        },
        body: JSON.stringify({ completion: 100 })
      });

      if (response.ok) {
        setItems(items.map(item => 
          item.id === id ? { ...item, completion: 100 } : item
        ));
        alert('Item marked as used');
      } else {
        alert('Failed to update item');
      }
    } catch (error) {
      console.error('Error updating item:', error);
      alert('Error updating item');
    }
  };

  const filteredAndSortedItems = items
    .filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesLocation = !locationFilter || item.location === locationFilter;
      return matchesSearch && matchesLocation;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'expiry':
          return new Date(a.expiry || '9999-12-31').getTime() - new Date(b.expiry || '9999-12-31').getTime();
        case 'scanned_at':
          return new Date(b.scanned_at).getTime() - new Date(a.scanned_at).getTime();
        case 'location':
          return a.location.localeCompare(b.location);
        default:
          return 0;
      }
    });

  const getExpiryStatus = (expiry: string) => {
    if (!expiry) return 'no-expiry';
    const daysUntilExpiry = Math.ceil((new Date(expiry).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntilExpiry < 0) return 'expired';
    if (daysUntilExpiry <= 7) return 'expiring-soon';
    return 'ok';
  };

  if (loading) {
    return (
      <div style={{ padding: 20, textAlign: 'center' }}>
        <h2>Loading inventory...</h2>
      </div>
    );
  }

  return (
    <div style={{ padding: 20, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
        <h1 style={{ color: '#333', margin: 0 }}>Pantry Inventory</h1>
        <Link href="/" style={{
          padding: '10px 20px',
          background: '#007bff',
          color: 'white',
          textDecoration: 'none',
          borderRadius: 4,
          fontWeight: 'bold'
        }}>
          ➕ Add Item
        </Link>
      </div>

      {/* Filters */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr 1fr', 
        gap: 15, 
        marginBottom: 30,
        padding: 20,
        background: '#f8f9fa',
        borderRadius: 8
      }}>
        <div>
          <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>
            Search
          </label>
          <input
            type="text"
            placeholder="Search by name, brand, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: 4,
              fontSize: 16
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>
            Location
          </label>
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: 4,
              fontSize: 16
            }}
          >
            <option value="">All Locations</option>
            {locations.map(location => (
              <option key={location} value={location}>{location}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>
            Sort By
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: 4,
              fontSize: 16
            }}
          >
            <option value="name">Name</option>
            <option value="expiry">Expiry Date</option>
            <option value="scanned_at">Date Added</option>
            <option value="location">Location</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: 15, 
        marginBottom: 30 
      }}>
        <div style={{ background: '#e3f2fd', padding: 15, borderRadius: 8, textAlign: 'center' }}>
          <h3 style={{ margin: 0, color: '#1976d2' }}>{filteredAndSortedItems.length}</h3>
          <p style={{ margin: 0, color: '#666' }}>Total Items</p>
        </div>
        <div style={{ background: '#fff3e0', padding: 15, borderRadius: 8, textAlign: 'center' }}>
          <h3 style={{ margin: 0, color: '#f57c00' }}>
            {filteredAndSortedItems.filter(item => getExpiryStatus(item.expiry) === 'expiring-soon').length}
          </h3>
          <p style={{ margin: 0, color: '#666' }}>Expiring Soon</p>
        </div>
        <div style={{ background: '#ffebee', padding: 15, borderRadius: 8, textAlign: 'center' }}>
          <h3 style={{ margin: 0, color: '#d32f2f' }}>
            {filteredAndSortedItems.filter(item => getExpiryStatus(item.expiry) === 'expired').length}
          </h3>
          <p style={{ margin: 0, color: '#666' }}>Expired</p>
        </div>
      </div>

      {/* Items Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
        gap: 20 
      }}>
        {filteredAndSortedItems.map(item => (
          <div key={item.id} style={{
            border: '1px solid #ddd',
            borderRadius: 8,
            padding: 15,
            background: 'white',
            position: 'relative'
          }}>
            {/* Expiry Status Indicator */}
            {item.expiry && (
              <div style={{
                position: 'absolute',
                top: 10,
                right: 10,
                padding: '4px 8px',
                borderRadius: 12,
                fontSize: 12,
                fontWeight: 'bold',
                color: 'white',
                background: getExpiryStatus(item.expiry) === 'expired' ? '#d32f2f' :
                           getExpiryStatus(item.expiry) === 'expiring-soon' ? '#f57c00' : '#4caf50'
              }}>
                {getExpiryStatus(item.expiry) === 'expired' ? 'EXPIRED' :
                 getExpiryStatus(item.expiry) === 'expiring-soon' ? 'EXPIRING' : 'OK'}
              </div>
            )}

            {/* Image */}
            {item.image && (
              <div style={{ textAlign: 'center', marginBottom: 15 }}>
                <Image
                  src={item.image}
                  alt={item.name}
                  width={200}
                  height={150}
                  style={{
                    maxWidth: '100%',
                    height: 'auto',
                    borderRadius: 8,
                    objectFit: 'cover'
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
            
            <div style={{ fontSize: 14, color: '#666', marginBottom: 10 }}>
              {item.brand && <div><strong>Brand:</strong> {item.brand}</div>}
              {item.category && <div><strong>Category:</strong> {item.category}</div>}
              <div><strong>Location:</strong> {item.location || 'Unknown'}</div>
              <div><strong>Quantity:</strong> {item.quantity}</div>
              {item.completion !== null && (
                <div><strong>Used:</strong> {item.completion}%</div>
              )}
              {item.expiry && (
                <div><strong>Expires:</strong> {new Date(item.expiry).toLocaleDateString()}</div>
              )}
              {item.purchase_date && (
                <div><strong>Purchased:</strong> {new Date(item.purchase_date).toLocaleDateString()}</div>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10, marginTop: 15 }}>
              {item.completion !== 100 && (
                <button
                  onClick={() => markAsUsed(item.id)}
                  style={{
                    padding: '8px 16px',
                    background: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontSize: 14
                  }}
                >
                  ✅ Mark Used
                </button>
              )}
              <button
                onClick={() => deleteItem(item.id)}
                style={{
                  padding: '8px 16px',
                  background: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: 14
                }}
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredAndSortedItems.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
          <h3>No items found</h3>
          <p>Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
} 