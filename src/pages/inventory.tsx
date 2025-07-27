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
  const [showUsedItems, setShowUsedItems] = useState(false);
  const [expiryFilter, setExpiryFilter] = useState(""); // "expired", "expiring-soon", or ""
  const [editingItem, setEditingItem] = useState<PantryItem | null>(null);

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
        body: JSON.stringify({ completion: 0 })
      });

      if (response.ok) {
        setItems(items.map(item => 
          item.id === id ? { ...item, completion: 0 } : item
        ));
        alert('Item removed from active inventory');
      } else {
        alert('Failed to update item');
      }
    } catch (error) {
      console.error('Error updating item:', error);
      alert('Error updating item');
    }
  };

  const updateItem = async (updatedItem: PantryItem) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/pantry_items?id=eq.${updatedItem.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_KEY!,
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_KEY}`
        },
        body: JSON.stringify(updatedItem)
      });

      if (response.ok) {
        setItems(items.map(item => 
          item.id === updatedItem.id ? updatedItem : item
        ));
        setEditingItem(null);
        alert('Item updated successfully');
      } else {
        alert('Failed to update item');
      }
    } catch (error) {
      console.error('Error updating item:', error);
      alert('Error updating item');
    }
  };

  const getExpiryStatus = (expiry: string) => {
    if (!expiry) return 'no-expiry';
    const daysUntilExpiry = Math.ceil((new Date(expiry).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntilExpiry < 0) return 'expired';
    if (daysUntilExpiry <= 7) return 'expiring-soon';
    return 'ok';
  };

   const filteredAndSortedItems = items
    .filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesLocation = !locationFilter || item.location === locationFilter;
             const matchesUsedStatus = showUsedItems || (item.completion === null || item.completion > 0);
      const matchesExpiryFilter = !expiryFilter || getExpiryStatus(item.expiry) === expiryFilter;
      return matchesSearch && matchesLocation && matchesUsedStatus && matchesExpiryFilter;
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

  if (loading) {
    return (
      <div style={{ padding: 20, textAlign: 'center' }}>
        <h2>Loading inventory...</h2>
      </div>
    );
  }

  return (
    <div style={{ padding: 20, maxWidth: '100%', margin: '0 auto' }}>
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

               {/* Compact Stats Cards */}
        <div style={{ 
          display: 'flex', 
          gap: 10, 
          marginBottom: 20,
          flexWrap: 'wrap'
        }}>
          <div 
            onClick={() => setExpiryFilter("")}
            style={{ 
              background: expiryFilter === "" ? '#e3f2fd' : '#f8f9fa',
              padding: '8px 12px', 
              borderRadius: 4, 
              cursor: 'pointer',
              border: expiryFilter === "" ? '2px solid #1976d2' : '1px solid #e0e0e0',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <span style={{ fontSize: 16, fontWeight: 'bold', color: '#1976d2' }}>{filteredAndSortedItems.length}</span>
            <span style={{ fontSize: 12, color: '#666' }}>All Items</span>
          </div>
          <div 
            onClick={() => setExpiryFilter("expiring-soon")}
            style={{ 
              background: expiryFilter === "expiring-soon" ? '#fff3e0' : '#f8f9fa',
              padding: '8px 12px', 
              borderRadius: 4, 
              cursor: 'pointer',
              border: expiryFilter === "expiring-soon" ? '2px solid #f57c00' : '1px solid #e0e0e0',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <span style={{ fontSize: 16, fontWeight: 'bold', color: '#f57c00' }}>
              {items.filter(item => getExpiryStatus(item.expiry) === 'expiring-soon').length}
            </span>
            <span style={{ fontSize: 12, color: '#666' }}>Expiring Soon</span>
          </div>
          <div 
            onClick={() => setExpiryFilter("expired")}
            style={{ 
              background: expiryFilter === "expired" ? '#ffebee' : '#f8f9fa',
              padding: '8px 12px', 
              borderRadius: 4, 
              cursor: 'pointer',
              border: expiryFilter === "expired" ? '2px solid #d32f2f' : '1px solid #e0e0e0',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <span style={{ fontSize: 16, fontWeight: 'bold', color: '#d32f2f' }}>
              {items.filter(item => getExpiryStatus(item.expiry) === 'expired').length}
            </span>
            <span style={{ fontSize: 12, color: '#666' }}>Expired</span>
          </div>
        </div>

        {/* Location Tabs */}
        <div style={{ 
          display: 'flex', 
          gap: 5, 
          marginBottom: 20,
          flexWrap: 'wrap',
          borderBottom: '1px solid #e0e0e0',
          paddingBottom: 10
        }}>
          <div 
            onClick={() => setLocationFilter("")}
            style={{ 
              background: locationFilter === "" ? '#007bff' : '#f8f9fa',
              color: locationFilter === "" ? 'white' : '#666',
              padding: '8px 16px', 
              borderRadius: 20, 
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: locationFilter === "" ? 'bold' : 'normal',
              transition: 'all 0.2s',
              border: locationFilter === "" ? 'none' : '1px solid #e0e0e0'
            }}
          >
            All Areas
          </div>
          {locations.filter(loc => loc !== 'Unknown').map(location => (
            <div 
              key={location}
              onClick={() => setLocationFilter(location)}
              style={{ 
                background: locationFilter === location ? '#007bff' : '#f8f9fa',
                color: locationFilter === location ? 'white' : '#666',
                padding: '8px 16px', 
                borderRadius: 20, 
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: locationFilter === location ? 'bold' : 'normal',
                transition: 'all 0.2s',
                border: locationFilter === location ? 'none' : '1px solid #e0e0e0'
              }}
            >
              {location}
            </div>
          ))}
        </div>

               {/* Filters */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr 1fr', 
          gap: 15, 
          marginBottom: 30,
          padding: 20,
          background: '#fafafa',
          borderRadius: 4,
          border: '1px solid #e0e0e0'
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

          <div>
            <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>
              Show Used Items
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="checkbox"
                checked={showUsedItems}
                onChange={(e) => setShowUsedItems(e.target.checked)}
                style={{ width: 20, height: 20 }}
              />
                            <span style={{ fontSize: 14, color: '#666' }}>
                 {showUsedItems ? 'Showing all items' : 'Hiding used items'}
               </span>
            </div>
          </div>
        </div>

      

                           {/* Items Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: 20,
          maxWidth: '100%'
        }}>
         {filteredAndSortedItems.map(item => (
                      <div key={item.id} style={{
              border: '1px solid #e0e0e0',
              borderRadius: 4,
              padding: 20,
              background: 'white',
              position: 'relative',
              maxWidth: '400px',
              justifySelf: 'center'
            }}>
            

                         {/* Expiry Status Indicator */}
             {item.expiry && (
               <div style={{
                 position: 'absolute',
                 top: 15,
                 right: 15,
                 width: 8,
                 height: 8,
                 borderRadius: '50%',
                 background: getExpiryStatus(item.expiry) === 'expired' ? '#dc3545' :
                            getExpiryStatus(item.expiry) === 'expiring-soon' ? '#ffc107' : '#28a745',
                 border: '2px solid white',
                 boxShadow: '0 0 0 1px #e0e0e0'
               }} />
             )}

                           {/* Image */}
              {item.image && (
                <div style={{ 
                  textAlign: 'center', 
                  marginBottom: 15,
                  height: 250,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Image
                    src={item.image}
                    alt={item.name}
                    width={300}
                    height={250}
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
             
                           {/* Location - Prominent Display */}
              <div style={{ marginBottom: 10 }}>
                <span style={{ 
                  fontSize: 14, 
                  color: '#666', 
                  fontWeight: 'bold',
                  background: '#e8f5e8',
                  padding: '4px 8px',
                  borderRadius: 3,
                  display: 'inline-block'
                }}>
                  {item.location || 'Unknown'}
                </span>
              </div>
             
                          <div style={{ fontSize: 14, color: '#666', marginBottom: 10 }}>
                {item.brand && <div><strong>Brand:</strong> {item.brand}</div>}
                {item.category && <div><strong>Category:</strong> {item.category}</div>}
                <div><strong>Quantity:</strong> {item.quantity}</div>
                               <div><strong>Status:</strong> {
                  item.completion === null ? 'Unopened/New' :
                  item.completion === 100 ? 'Unopened/New' :
                  item.completion === 0 ? 'Used' :
                  `${item.completion}% remaining`
                }</div>
               {item.expiry && (
                 <div><strong>Expires:</strong> {new Date(item.expiry).toLocaleDateString()}</div>
               )}
                               {item.purchase_date && (
                  <div><strong>Purchased:</strong> {new Date(item.purchase_date).toLocaleDateString()}</div>
                )}
                {item.notes && (
                  <div><strong>Notes:</strong> {item.notes}</div>
                )}
              </div>

                         {/* Actions */}
             <div style={{ display: 'flex', gap: 8, marginTop: 15 }}>
               <button
                 onClick={() => setEditingItem(item)}
                 style={{
                   padding: '6px 12px',
                   background: '#f8f9fa',
                   color: '#333',
                   border: '1px solid #dee2e6',
                   borderRadius: 4,
                   cursor: 'pointer',
                   fontSize: 13
                 }}
               >
                 Edit
               </button>
                               {(item.completion === null || item.completion > 0) && (
                  <button
                    onClick={() => markAsUsed(item.id)}
                    style={{
                      padding: '6px 12px',
                      background: '#f8f9fa',
                      color: '#333',
                      border: '1px solid #dee2e6',
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontSize: 13
                    }}
                  >
                                         Remove
                  </button>
                )}
               <button
                 onClick={() => deleteItem(item.id)}
                 style={{
                   padding: '6px 12px',
                   background: '#f8f9fa',
                   color: '#dc3545',
                   border: '1px solid #dee2e6',
                   borderRadius: 4,
                   cursor: 'pointer',
                   fontSize: 13
                 }}
               >
                 Delete
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

       {/* Edit Modal */}
       {editingItem && (
         <div style={{
           position: 'fixed',
           top: 0,
           left: 0,
           right: 0,
           bottom: 0,
           background: 'rgba(0, 0, 0, 0.5)',
           display: 'flex',
           justifyContent: 'center',
           alignItems: 'center',
           zIndex: 1000
         }}>
           <div style={{
             background: 'white',
             padding: 30,
             borderRadius: 8,
             width: '90%',
             maxWidth: 500,
             maxHeight: '90vh',
             overflow: 'auto'
           }}>
             <h2 style={{ margin: '0 0 20px 0' }}>Edit Item</h2>
             
             <div style={{ display: 'grid', gap: 15 }}>
               <div>
                 <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>
                   Name
                 </label>
                 <input
                   type="text"
                   value={editingItem.name}
                   onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
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
                   Brand
                 </label>
                 <input
                   type="text"
                   value={editingItem.brand || ''}
                   onChange={(e) => setEditingItem({...editingItem, brand: e.target.value})}
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
                   Category
                 </label>
                 <input
                   type="text"
                   value={editingItem.category || ''}
                   onChange={(e) => setEditingItem({...editingItem, category: e.target.value})}
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
                   value={editingItem.location || ''}
                   onChange={(e) => setEditingItem({...editingItem, location: e.target.value})}
                   style={{
                     width: '100%',
                     padding: '10px',
                     border: '1px solid #ddd',
                     borderRadius: 4,
                     fontSize: 16
                   }}
                 >
                   <option value="">Select Location</option>
                   {locations.map(location => (
                     <option key={location} value={location}>{location}</option>
                   ))}
                 </select>
               </div>

               <div>
                 <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>
                   Quantity
                 </label>
                 <input
                   type="number"
                   value={editingItem.quantity}
                   onChange={(e) => setEditingItem({...editingItem, quantity: parseInt(e.target.value) || 1})}
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
                     Status
                   </label>
                   <select
                     value={editingItem.completion}
                     onChange={(e) => setEditingItem({...editingItem, completion: parseInt(e.target.value)})}
                     style={{
                       width: '100%',
                       padding: '10px',
                       border: '1px solid #ddd',
                       borderRadius: 4,
                       fontSize: 16
                     }}
                   >
                     <option value={100}>Unopened/New</option>
                     <option value={75}>75% remaining</option>
                     <option value={50}>50% remaining</option>
                     <option value={25}>25% remaining</option>
                     <option value={0}>Used Up</option>
                   </select>
                 </div>

               <div>
                 <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>
                   Expiry Date
                 </label>
                 <input
                   type="date"
                   value={editingItem.expiry || ''}
                   onChange={(e) => setEditingItem({...editingItem, expiry: e.target.value})}
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
                   Purchase Date
                 </label>
                 <input
                   type="date"
                   value={editingItem.purchase_date || ''}
                   onChange={(e) => setEditingItem({...editingItem, purchase_date: e.target.value})}
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
                   Notes
                 </label>
                 <textarea
                   value={editingItem.notes || ''}
                   onChange={(e) => setEditingItem({...editingItem, notes: e.target.value})}
                   rows={3}
                   style={{
                     width: '100%',
                     padding: '10px',
                     border: '1px solid #ddd',
                     borderRadius: 4,
                     fontSize: 16,
                     resize: 'vertical'
                   }}
                 />
               </div>
             </div>

             <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
               <button
                 onClick={() => updateItem(editingItem)}
                 style={{
                   padding: '10px 20px',
                   background: '#007bff',
                   color: 'white',
                   border: 'none',
                   borderRadius: 4,
                   cursor: 'pointer',
                   fontSize: 14
                 }}
               >
                 Save Changes
               </button>
               <button
                 onClick={() => setEditingItem(null)}
                 style={{
                   padding: '10px 20px',
                   background: '#6c757d',
                   color: 'white',
                   border: 'none',
                   borderRadius: 4,
                   cursor: 'pointer',
                   fontSize: 14
                 }}
               >
                 Cancel
               </button>
             </div>
           </div>
         </div>
       )}
     </div>
   );
 } 