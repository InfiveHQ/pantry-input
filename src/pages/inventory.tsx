import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { getStorageAreasByRoom, getRooms } from "../lib/storageAreas";

import Navigation from "../components/Navigation";
import FloatingAddButton from "../components/FloatingAddButton";
import RoomBasedStorageSelector from "../components/RoomBasedStorageSelector";

interface PantryItem {
  id: number;
  name: string | null;
  brand: string | null;
  category: string | null;
  quantity: number;
  completion: number;
  expiry: string;
  purchase_date: string | null;
  location: string | null;
  tags: string;
  notes: string;
  barcode: string;
  image: string;
  scanned_at: string;
  created_at: string;
}

export default function Inventory() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [items, setItems] = useState<PantryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [roomFilter, setRoomFilter] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [showUsedItems, setShowUsedItems] = useState(true);
  const [expiryFilter, setExpiryFilter] = useState(""); // "expired", "expiring-soon", or ""
  const [editingItem, setEditingItem] = useState<PantryItem | null>(null);
  const [editingSelectedRoom, setEditingSelectedRoom] = useState('Kitchen');
  const [isMobile, setIsMobile] = useState(false);
  const [showAllStats, setShowAllStats] = useState(false);


  const locations = [
    "Shelf Top Small",
    "Shelf Top Right", 
    "Shelf Top Large",
    "Shelf Bottom",
    "Countertop",
    "Box Coffee",
    "Snack Cabinet",
    "Medicine Cabinet",
    "Alcohol Cabinet",
    "Fridge",
    "Freezer",
    "Cleaning Cupboard",
    "Unknown"
  ];

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    
    if (user) {
      fetchItems();
    }
  }, [user, authLoading, router]);



  // Check if mobile for responsive sticky positioning
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
     }, []);

   // Debug roomFilter changes
   useEffect(() => {
     console.log('roomFilter changed to:', roomFilter);
     console.log('roomFilter type:', typeof roomFilter);
     console.log('roomFilter length:', roomFilter.length);
   }, [roomFilter]);

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

  const fetchItems = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/pantry_items?select=*&order=created_at.desc`, {
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
        alert('Item marked as finished');
      } else {
        alert('Failed to update item');
      }
    } catch (error) {
      console.error('Error updating item:', error);
      alert('Error updating item');
    }
  };

  const addToShoppingList = async (item: PantryItem) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Please log in to add items to shopping list');
        return;
      }

      const response = await fetch('/api/shopping-list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ itemId: item.id })
      });

      if (response.ok) {
        alert(`${item.name} added to shopping list for next trip`);
      } else if (response.status === 409) {
        alert(`${item.name} is already in your shopping list`);
      } else {
        const errorData = await response.json();
        alert(`Error adding to shopping list: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error adding to shopping list:', error);
      alert('Error adding to shopping list');
    }
  };

  const updateItem = async (updatedItem: PantryItem) => {
    try {
      // Clean up the data before sending to database
      const cleanItem = {
        ...updatedItem,
        purchase_date: updatedItem.purchase_date || null,
        expiry: updatedItem.expiry || null,
        brand: updatedItem.brand || null,
        category: updatedItem.category || null,
        location: updatedItem.location || "Unknown",
        tags: updatedItem.tags || null,
        notes: updatedItem.notes || null,
        barcode: updatedItem.barcode || null,
        image: updatedItem.image || null
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/pantry_items?id=eq.${updatedItem.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_KEY!,
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_KEY}`
        },
        body: JSON.stringify(cleanItem)
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

    const duplicateItem = async (item: PantryItem) => {
    try {
      const newItem = {
        ...item,
        id: undefined, // Remove ID so Supabase generates a new one
        completion: 100, // Reset to new item
        scanned_at: item.scanned_at, // Keep the original scanned_at date
        created_at: undefined, // Remove created_at so it gets set to current timestamp
        // Keep original purchase_date instead of setting to today
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/pantry_items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_KEY!,
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_KEY}`
        },
        body: JSON.stringify(newItem)
      });

      if (response.ok) {
        // Refresh items list
        await fetchItems();
        
        // Scroll to top to show the new item
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 100);
        
        alert('Item duplicated successfully!');
      } else {
        const errorText = await response.text();
        console.error('Failed to duplicate item:', errorText);
        alert('Failed to duplicate item');
      }
    } catch (error) {
      console.error('Error duplicating item:', error);
      alert('Failed to duplicate item');
    }
  };

  const getExpiryStatus = (expiry: string) => {
    if (!expiry) return 'no-expiry';
    const daysUntilExpiry = Math.ceil((new Date(expiry).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntilExpiry < 0) return 'expired';
    if (daysUntilExpiry === 0) return 'expiring-today';
    if (daysUntilExpiry <= 3) return 'expiring-3-days';
    if (daysUntilExpiry <= 7) return 'expiring-week';
    return 'ok';
  };

  const getItemsWithSameName = (itemName: string) => {
    return items.filter(item => {
      const nameMatches = (item.name?.toLowerCase() || '') === itemName.toLowerCase();
      // If "Exclude Used" is checked, only count unused items
      const usageMatches = showUsedItems ? (item.completion === null || item.completion > 0) : true;
      return nameMatches && usageMatches;
    });
  };

  const filteredAndSortedItems = items
    .filter(item => {
      const matchesSearch = (item.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                          (item.brand?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                          (item.category?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      
      // Room and location filtering
      let matchesLocation = true;
      if (roomFilter) {
        // If room is selected, check if item's location belongs to that room
        const storageAreasInRoom = getStorageAreasByRoom(roomFilter);
        const itemLocationInRoom = storageAreasInRoom.find(area => area.name === item.location);
        matchesLocation = !!itemLocationInRoom;
      } else if (locationFilter) {
        // If specific location is selected, check exact match
        matchesLocation = item.location === locationFilter;
      }
      
      // For "Finished" tab, show all finished items regardless of showUsedItems setting
      // For all other tabs, apply the showUsedItems filter
      const matchesUsedStatus = expiryFilter === "finished" ? 
        true : // Show all items when on "Finished" tab
        !showUsedItems || (item.completion === null || item.completion > 0);
        
      const matchesExpiryFilter = !expiryFilter || 
                                 (expiryFilter === "finished" ? item.completion === 0 : 
                                  expiryFilter === "expiring-week" ? 
                                    (getExpiryStatus(item.expiry) === "expiring-week" || 
                                     getExpiryStatus(item.expiry) === "expiring-3-days" || 
                                     getExpiryStatus(item.expiry) === "expiring-today") :
                                  getExpiryStatus(item.expiry) === expiryFilter);
      return matchesSearch && matchesLocation && matchesUsedStatus && matchesExpiryFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'expiry':
          return new Date(a.expiry || '9999-12-31').getTime() - new Date(b.expiry || '9999-12-31').getTime();
        case 'purchase_date':
          return new Date(b.purchase_date || '9999-12-31').getTime() - new Date(a.purchase_date || '9999-12-31').getTime();
        case 'created_at':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'scanned_at':
          return new Date(b.scanned_at).getTime() - new Date(a.scanned_at).getTime();
        case 'location':
          return (a.location || '').localeCompare(b.location || '');
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime(); // Default to created_at sorting
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
    <div style={{ 
      padding: 20, 
      maxWidth: '100%', 
      margin: '0 auto',
      background: 'var(--content-bg)',
      color: 'var(--foreground)',
      minHeight: '100vh',
      position: 'relative',
      paddingTop: isMobile ? '15px' : '60px', // Increased padding for desktop to account for navigation height
      paddingBottom: isMobile ? '70px' : '15px' // Reduced bottom padding for compact mobile nav
    }}>


             {/* Sticky Navigation Container - Responsive positioning */}
               <div style={{
          position: 'sticky',
          top: isMobile ? '0px' : '70px', // No top offset for mobile since nav is at bottom
          zIndex: 100,
          background: 'var(--content-bg)',
          paddingTop: 10,
          paddingBottom: 10,
          borderBottom: '1px solid var(--border)',
          marginBottom: 20,
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          boxShadow: 'var(--shadow-sm)'
        }}>
        {/* Compact Stats Cards */}
        <div style={{ 
          display: 'flex', 
          gap: 6, 
          marginBottom: 12,
          flexWrap: 'wrap'
        }}>
                     {/* All Items - Always visible */}
           <div 
             onClick={() => setExpiryFilter("")}
             style={{ 
               background: expiryFilter === "" ? 'var(--stats-card-active)' : 'var(--stats-card-bg)',
               padding: '6px 10px', 
               borderRadius: 4, 
               cursor: 'pointer',
               border: expiryFilter === "" ? '2px solid var(--primary)' : '1px solid var(--border)',
               transition: 'all 0.2s',
               display: 'flex',
               alignItems: 'center',
               gap: 6
             }}
           >
             <span style={{ fontSize: 14, fontWeight: 'bold', color: 'var(--primary)' }}>{filteredAndSortedItems.length}</span>
             <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>All Items</span>
           </div>
           
                       {/* Expired - Always visible */}
            <div 
              onClick={() => setExpiryFilter("expired")}
              style={{ 
                background: expiryFilter === "expired" ? 'var(--expired-bg)' : 'var(--stats-card-bg)',
                padding: '6px 10px', 
                borderRadius: 4, 
                cursor: 'pointer',
                border: expiryFilter === "expired" ? '2px solid var(--expired-border)' : '1px solid var(--border)',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 'bold', color: 'var(--expired-border)' }}>
                {items.filter(item => {
                  const matchesExpiry = getExpiryStatus(item.expiry) === 'expired';
                  // Apply room filter if active
                  let matchesLocation = true;
                  if (roomFilter) {
                    const storageAreasInRoom = getStorageAreasByRoom(roomFilter);
                    const itemLocationInRoom = storageAreasInRoom.find(area => area.name === item.location);
                    matchesLocation = !!itemLocationInRoom;
                  } else if (locationFilter) {
                    matchesLocation = item.location === locationFilter;
                  }
                  return matchesExpiry && matchesLocation;
                }).length}
              </span>
              <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Expired</span>
            </div>
                     {/* Week - Hidden on mobile unless expanded */}
           <div 
             onClick={() => setExpiryFilter("expiring-week")}
             style={{ 
               background: expiryFilter === "expiring-week" ? 'var(--expiring-week-bg)' : 'var(--stats-card-bg)',
               padding: '6px 10px', 
               borderRadius: 4, 
               cursor: 'pointer',
               border: expiryFilter === "expiring-week" ? '2px solid var(--expiring-week-border)' : '1px solid var(--border)',
               transition: 'all 0.2s',
               display: isMobile && !showAllStats ? 'none' : 'flex',
               alignItems: 'center',
               gap: 6
             }}
           >
             <span style={{ fontSize: 14, fontWeight: 'bold', color: 'var(--expiring-week-border)' }}>
               {items.filter(item => {
                 const matchesExpiry = getExpiryStatus(item.expiry) === 'expiring-week' || 
                                      getExpiryStatus(item.expiry) === 'expiring-3-days' || 
                                      getExpiryStatus(item.expiry) === 'expiring-today';
                 // Apply room filter if active
                 let matchesLocation = true;
                 if (roomFilter) {
                   const storageAreasInRoom = getStorageAreasByRoom(roomFilter);
                   const itemLocationInRoom = storageAreasInRoom.find(area => area.name === item.location);
                   matchesLocation = !!itemLocationInRoom;
                 } else if (locationFilter) {
                   matchesLocation = item.location === locationFilter;
                 }
                 return matchesExpiry && matchesLocation;
               }).length}
             </span>
             <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Week</span>
           </div>
                     {/* 3 Days - Hidden on mobile unless expanded */}
           <div 
             onClick={() => setExpiryFilter("expiring-3-days")}
             style={{ 
               background: expiryFilter === "expiring-3-days" ? 'var(--expiring-3-days-bg)' : 'var(--stats-card-bg)',
               padding: '6px 10px', 
               borderRadius: 4, 
               cursor: 'pointer',
               border: expiryFilter === "expiring-3-days" ? '2px solid var(--expiring-3-days-border)' : '1px solid var(--border)',
               transition: 'all 0.2s',
               display: isMobile && !showAllStats ? 'none' : 'flex',
               alignItems: 'center',
               gap: 6
             }}
           >
             <span style={{ fontSize: 14, fontWeight: 'bold', color: 'var(--expiring-3-days-border)' }}>
               {items.filter(item => {
                 const matchesExpiry = getExpiryStatus(item.expiry) === 'expiring-3-days' || 
                                      getExpiryStatus(item.expiry) === 'expiring-today';
                 // Apply room filter if active
                 let matchesLocation = true;
                 if (roomFilter) {
                   const storageAreasInRoom = getStorageAreasByRoom(roomFilter);
                   const itemLocationInRoom = storageAreasInRoom.find(area => area.name === item.location);
                   matchesLocation = !!itemLocationInRoom;
                 } else if (locationFilter) {
                   matchesLocation = item.location === locationFilter;
                 }
                 return matchesExpiry && matchesLocation;
               }).length}
             </span>
             <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>3 Days</span>
           </div>
                     {/* Today - Hidden on mobile unless expanded */}
           <div 
             onClick={() => setExpiryFilter("expiring-today")}
             style={{ 
               background: expiryFilter === "expiring-today" ? 'var(--expiring-today-bg)' : 'var(--stats-card-bg)',
               padding: '6px 10px', 
               borderRadius: 4, 
               cursor: 'pointer',
               border: expiryFilter === "expiring-today" ? '2px solid var(--expiring-today-border)' : '1px solid var(--border)',
               transition: 'all 0.2s',
               display: isMobile && !showAllStats ? 'none' : 'flex',
               alignItems: 'center',
               gap: 6
             }}
           >
             <span style={{ fontSize: 14, fontWeight: 'bold', color: 'var(--expiring-today-border)' }}>
               {items.filter(item => {
                 const matchesExpiry = getExpiryStatus(item.expiry) === 'expiring-today';
                 // Apply room filter if active
                 let matchesLocation = true;
                 if (roomFilter) {
                   const storageAreasInRoom = getStorageAreasByRoom(roomFilter);
                   const itemLocationInRoom = storageAreasInRoom.find(area => area.name === item.location);
                   matchesLocation = !!itemLocationInRoom;
                 } else if (locationFilter) {
                   matchesLocation = item.location === locationFilter;
                 }
                 return matchesExpiry && matchesLocation;
               }).length}
             </span>
             <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Today</span>
           </div>
          
                     {/* Finished - Always visible */}
           <div 
             onClick={() => setExpiryFilter("finished")}
             style={{ 
               background: expiryFilter === "finished" ? 'var(--finished-bg)' : 'var(--stats-card-bg)',
               padding: '6px 10px', 
               borderRadius: 4, 
               cursor: 'pointer',
               border: expiryFilter === "finished" ? '2px solid var(--finished-border)' : '1px solid var(--border)',
               transition: 'all 0.2s',
               display: 'flex',
               alignItems: 'center',
               gap: 6
             }}
           >
             <span style={{ fontSize: 14, fontWeight: 'bold', color: 'var(--finished-border)' }}>
               {items.filter(item => {
                 const matchesFinished = item.completion === 0;
                 // Apply room filter if active
                 let matchesLocation = true;
                 if (roomFilter) {
                   const storageAreasInRoom = getStorageAreasByRoom(roomFilter);
                   const itemLocationInRoom = storageAreasInRoom.find(area => area.name === item.location);
                   matchesLocation = !!itemLocationInRoom;
                 } else if (locationFilter) {
                   matchesLocation = item.location === locationFilter;
                 }
                 return matchesFinished && matchesLocation;
               }).length}
             </span>
             <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Finished</span>
           </div>
          
          {/* Mobile: Show/Hide toggle button */}
          {isMobile && (
            <button
              onClick={() => setShowAllStats(!showAllStats)}
              style={{
                background: 'var(--stats-card-bg)',
                color: 'var(--text-secondary)',
                padding: '6px 10px',
                border: '1px solid var(--border)',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 10,
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              {showAllStats ? 'Hide' : 'More'}
              <span style={{ fontSize: 8 }}>
                {showAllStats ? '▼' : '▶'}
              </span>
            </button>
          )}
        </div>

                                  {/* Room-Based Storage Selector */}
         <div style={{ marginBottom: 8 }}>
                                               <RoomBasedStorageSelector
               selectedRoom={roomFilter}
               selectedStorageArea={locationFilter}
                                                       onRoomChange={(room) => {
                 console.log('Setting room filter to:', room);
                 setRoomFilter(room);
                 setLocationFilter(""); // Clear specific location when room changes
                 console.log('roomFilter after setState:', room); // This won't show the updated value immediately
                 
                 // Force a re-render by updating a different state
                 setTimeout(() => {
                   console.log('Forcing re-render check');
                   setRoomFilter(prev => {
                     console.log('Previous roomFilter:', prev);
                     return room;
                   });
                 }, 0);
               }}
             onStorageAreaChange={(storageArea) => {
               setLocationFilter(storageArea);
               setRoomFilter(""); // Clear room filter when specific location is selected
             }}
           />
         </div>
      </div>

                               {/* Compact Filters */}
         <div style={{ 
           display: 'flex', 
           gap: 10, 
           marginBottom: 12,
           padding: 8,
           background: 'var(--filter-bg)',
           borderRadius: 6,
           border: `1px solid var(--border)`,
           alignItems: 'center',
           flexWrap: 'wrap',
           boxShadow: 'var(--shadow-sm)'
         }}>
         <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
           <input
             type="text"
             placeholder="Search by name, brand, or category..."
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             style={{
               width: '100%',
               padding: '8px 12px',
               paddingRight: searchTerm ? '32px' : '12px',
               border: `1px solid var(--input-border)`,
               borderRadius: 4,
               fontSize: 14,
               background: 'var(--input-bg)',
               color: 'var(--text-primary)'
             }}
           />
           {searchTerm && (
             <button
               onClick={() => setSearchTerm('')}
               style={{
                 position: 'absolute',
                 right: '8px',
                 top: '50%',
                 transform: 'translateY(-50%)',
                 background: 'none',
                 border: 'none',
                 cursor: 'pointer',
                 fontSize: '16px',
                 color: 'var(--text-secondary)',
                 padding: '4px',
                 borderRadius: '50%',
                 display: 'flex',
                 alignItems: 'center',
                 justifyContent: 'center',
                 width: '20px',
                 height: '20px'
               }}
               onMouseEnter={(e) => {
                 e.currentTarget.style.backgroundColor = 'var(--border)';
                 e.currentTarget.style.color = 'var(--text-primary)';
               }}
               onMouseLeave={(e) => {
                 e.currentTarget.style.backgroundColor = 'transparent';
                 e.currentTarget.style.color = 'var(--text-secondary)';
               }}
             >
               ×
             </button>
           )}
         </div>

         <div style={{ minWidth: 120 }}>
           <select
             value={sortBy}
             onChange={(e) => setSortBy(e.target.value)}
             style={{
               width: '100%',
               padding: '8px 12px',
               border: `1px solid var(--input-border)`,
               borderRadius: 4,
               fontSize: 14,
               background: 'var(--input-bg)',
               color: 'var(--text-primary)'
             }}
           >
             <option value="name">Name</option>
             <option value="expiry">Expiry</option>
             <option value="purchase_date">Purchased</option>
             <option value="created_at">Added</option>
             <option value="location">Location</option>
           </select>
         </div>

         <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
           <input
             type="checkbox"
             checked={showUsedItems}
             onChange={(e) => setShowUsedItems(e.target.checked)}
             style={{ width: 16, height: 16 }}
           />
                       <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
              Exclude Used
            </span>
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
              border: `1px solid var(--card-border)`,
              borderRadius: 8,
              padding: 20,
              background: 'var(--content-card-bg)',
              position: 'relative',
              maxWidth: '400px',
              justifySelf: 'center',
              boxShadow: 'var(--shadow-sm)',
              transition: 'all 0.2s ease'
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
                background: getExpiryStatus(item.expiry) === 'expired' ? 'var(--danger)' :
                           getExpiryStatus(item.expiry) === 'expiring-today' ? 'var(--danger)' :
                           getExpiryStatus(item.expiry) === 'expiring-3-days' ? 'var(--warning)' :
                           getExpiryStatus(item.expiry) === 'expiring-week' ? 'var(--warning)' : 'var(--success)',
                border: '2px solid var(--card-bg)',
                boxShadow: `0 0 0 1px var(--border)`
              }} />
            )}

                         {/* Total Quantity Indicator */}
             {(() => {
               const itemsWithSameName = getItemsWithSameName(item.name || '');
               if (itemsWithSameName.length > 1) {
                 return (
                   <div style={{
                     position: 'absolute',
                     top: 12,
                     right: item.expiry ? 32 : 12,
                     background: 'var(--quantity-indicator-bg, #ffffff)',
                     color: 'var(--quantity-indicator-text, #000000)',
                                           fontSize: 12,
                     fontWeight: '600',
                     width: 20,
                     height: 20,
                     borderRadius: '50%',
                     textAlign: 'center',
                     display: 'flex',
                     alignItems: 'center',
                     justifyContent: 'center',
                     border: '1px solid var(--quantity-indicator-border, rgba(0, 0, 0, 0.1))',
                     boxShadow: 'var(--quantity-indicator-shadow, 0 1px 3px rgba(0, 0, 0, 0.15))'
                   }}>
                     {itemsWithSameName.length}
                   </div>
                 );
               }
               return null;
             })()}

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
                  alt={item.name || 'Item'}
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
            <h3 style={{ margin: '0 0 10px 0', color: 'var(--text-primary)' }}>{item.name}</h3>
            
            {/* Location - Prominent Display */}
            <div style={{ marginBottom: 10 }}>
              <span style={{ 
                fontSize: 14, 
                color: 'var(--text-secondary)', 
                fontWeight: 'bold',
                background: 'var(--location-bg)',
                padding: '4px 8px',
                borderRadius: 3,
                display: 'inline-block'
              }}>
                {item.location || 'Unknown'}
              </span>
            </div>
            
                         <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 10 }}>
               {item.brand && <div><strong>Brand:</strong> {item.brand}</div>}
               {item.category && <div><strong>Category:</strong> {item.category}</div>}
               <div><strong>Status:</strong> {
                 item.completion === null ? 'Unopened/New' :
                 item.completion === 100 ? 'Unopened/New' :
                 item.completion === 0 ? 'Used' :
                 `${item.completion}% remaining`
               }</div>
               {item.purchase_date && (
                 <div><strong>Purchased:</strong> {new Date(item.purchase_date).toLocaleDateString()}</div>
               )}
               {item.expiry && (
                 <div><strong>Expires:</strong> {new Date(item.expiry).toLocaleDateString()}</div>
               )}
               {item.notes && (
                 <div><strong>Notes:</strong> {item.notes}</div>
               )}
             </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8, marginTop: 15 }}>
                             <button
                 onClick={() => {
                   setEditingItem(item);
                   // Set the editing room based on the item's current location
                   const currentLocationRoom = getRooms().find(room => 
                     getStorageAreasByRoom(room).find(area => area.name === item.location)
                   ) || 'Kitchen';
                   setEditingSelectedRoom(currentLocationRoom);
                 }}
                 style={{
                   padding: '6px 12px',
                   background: 'var(--stats-card-bg)',
                   color: 'var(--text-primary)',
                   border: `1px solid var(--border)`,
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
                     background: 'var(--stats-card-bg)',
                     color: 'var(--text-primary)',
                     border: `1px solid var(--border)`,
                     borderRadius: 4,
                     cursor: 'pointer',
                     fontSize: 13
                   }}
                 >
                   Finished
                 </button>
               )}
               <button
                 onClick={() => addToShoppingList(item)}
                 style={{
                   padding: '6px 12px',
                   background: 'var(--success)',
                   color: 'white',
                   border: `1px solid var(--success)`,
                   borderRadius: 4,
                   cursor: 'pointer',
                   fontSize: 13
                 }}
               >
                 Shop
               </button>
               <button
                 onClick={() => deleteItem(item.id)}
                 style={{
                   padding: '6px 12px',
                   background: 'var(--stats-card-bg)',
                   color: 'var(--danger)',
                   border: `1px solid var(--border)`,
                   borderRadius: 4,
                   cursor: 'pointer',
                   fontSize: 13
                 }}
               >
                 Delete
               </button>
               <button
                 onClick={() => duplicateItem(item)}
                 title="Duplicate item"
                 style={{
                   padding: '6px 8px',
                   background: 'var(--stats-card-bg)',
                   color: 'var(--text-secondary)',
                   border: `1px solid var(--border)`,
                   borderRadius: 4,
                   cursor: 'pointer',
                   fontSize: 14,
                   minWidth: '32px',
                   display: 'flex',
                   alignItems: 'center',
                   justifyContent: 'center'
                 }}
               >
                 +
               </button>
            </div>
          </div>
        ))}
      </div>

      {filteredAndSortedItems.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>
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
          background: 'var(--modal-overlay)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'var(--modal-bg)',
            padding: 30,
            borderRadius: 8,
            width: '90%',
            maxWidth: 500,
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h2 style={{ margin: '0 0 20px 0', color: 'var(--text-primary)' }}>Edit Item</h2>
            
            <div style={{ display: 'grid', gap: 15 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold', color: 'var(--text-primary)' }}>
                  Name
                </label>
                <input
                  type="text"
                  value={editingItem.name || ''}
                  onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: `1px solid var(--input-border)`,
                    borderRadius: 4,
                    fontSize: 16,
                    background: 'var(--input-bg)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold', color: 'var(--text-primary)' }}>
                  Brand
                </label>
                <input
                  type="text"
                  value={editingItem.brand || ''}
                  onChange={(e) => setEditingItem({...editingItem, brand: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: `1px solid var(--input-border)`,
                    borderRadius: 4,
                    fontSize: 16,
                    background: 'var(--input-bg)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold', color: 'var(--text-primary)' }}>
                  Category
                </label>
                <input
                  type="text"
                  value={editingItem.category || ''}
                  onChange={(e) => setEditingItem({...editingItem, category: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: `1px solid var(--input-border)`,
                    borderRadius: 4,
                    fontSize: 16,
                    background: 'var(--input-bg)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>

                                                                                                                       <div>
                   <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold', color: 'var(--text-primary)' }}>
                     Room & Location
                   </label>
                   
                   {/* Room Selection Tabs */}
                   <div style={{ 
                     display: 'flex', 
                     gap: 4, 
                     marginBottom: 8,
                     flexWrap: 'wrap'
                   }}>
                     {getRooms().map(room => (
                       <button
                         key={room}
                         type="button"
                         onClick={() => {
                           setEditingSelectedRoom(room);
                           // Clear location when changing rooms
                           setEditingItem({...editingItem, location: ''});
                         }}
                         style={{
                           padding: '6px 12px',
                           background: editingSelectedRoom === room ? 'var(--primary)' : 'var(--stats-card-bg)',
                           color: editingSelectedRoom === room ? 'white' : 'var(--text-primary)',
                           border: `1px solid ${editingSelectedRoom === room ? 'var(--primary)' : 'var(--border)'}`,
                           borderRadius: 4,
                           cursor: 'pointer',
                           fontSize: 12,
                           fontWeight: editingSelectedRoom === room ? 'bold' : 'normal',
                           transition: 'all 0.2s'
                         }}
                       >
                         {room}
                       </button>
                     ))}
                   </div>
                   
                   {/* Storage Area Dropdown - Show areas for the selected room */}
                   <select
                     value={editingItem.location || ''}
                     onChange={(e) => setEditingItem({...editingItem, location: e.target.value})}
                     style={{
                       width: '100%',
                       padding: '10px',
                       border: `1px solid var(--input-border)`,
                       borderRadius: 4,
                       fontSize: 16,
                       background: 'var(--input-bg)',
                       color: 'var(--text-primary)'
                     }}
                   >
                     <option value="">-- Select Storage Area in {editingSelectedRoom} --</option>
                     {getStorageAreasByRoom(editingSelectedRoom).map(area => (
                       <option key={area.id} value={area.name}>
                         {area.name}
                       </option>
                     ))}
                   </select>
                 </div>

              <div>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold', color: 'var(--text-primary)' }}>
                  Quantity
                </label>
                <input
                  type="number"
                  value={editingItem.quantity}
                  onChange={(e) => setEditingItem({...editingItem, quantity: parseInt(e.target.value) || 1})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: `1px solid var(--input-border)`,
                    borderRadius: 4,
                    fontSize: 16,
                    background: 'var(--input-bg)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold', color: 'var(--text-primary)' }}>
                  How much left (%)
                </label>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editingItem.completion}
                    onChange={(e) => setEditingItem({...editingItem, completion: parseInt(e.target.value) || 0})}
                    style={{
                      flex: 1,
                      padding: '10px',
                      border: `1px solid var(--input-border)`,
                      borderRadius: 4,
                      fontSize: 16,
                      background: 'var(--input-bg)',
                      color: 'var(--text-primary)'
                    }}
                    placeholder="Enter percentage (0-100)"
                  />
                  <span style={{ fontSize: 14, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                    % remaining
                  </span>
                </div>
                <div style={{ marginTop: 5, fontSize: 12, color: 'var(--text-secondary)' }}>
                  <div>100% = Unopened/New</div>
                  <div>0% = Used Up</div>
                  <div>Enter any percentage between 0-100</div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold', color: 'var(--text-primary)' }}>
                  Expiry Date
                </label>
                <input
                  type="date"
                  name="expiry"
                  value={editingItem.expiry || ''}
                  onChange={(e) => setEditingItem({...editingItem, expiry: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: `1px solid var(--input-border)`,
                    borderRadius: 4,
                    fontSize: 16,
                    background: 'var(--input-bg)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold', color: 'var(--text-primary)' }}>
                  Purchase Date
                </label>
                <input
                  type="date"
                  name="purchase_date"
                  value={editingItem.purchase_date || ''}
                  onChange={(e) => setEditingItem({...editingItem, purchase_date: e.target.value || null})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: `1px solid var(--input-border)`,
                    borderRadius: 4,
                    fontSize: 16,
                    background: 'var(--input-bg)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold', color: 'var(--text-primary)' }}>
                  Tags (Optional)
                </label>
                <input
                  type="text"
                  value={editingItem.tags || ''}
                  onChange={(e) => setEditingItem({...editingItem, tags: e.target.value})}
                  placeholder="e.g., organic, gluten-free, favorite"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: `1px solid var(--input-border)`,
                    borderRadius: 4,
                    fontSize: 16,
                    background: 'var(--input-bg)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold', color: 'var(--text-primary)' }}>
                  Notes
                </label>
                <textarea
                  value={editingItem.notes || ''}
                  onChange={(e) => setEditingItem({...editingItem, notes: e.target.value})}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: `1px solid var(--input-border)`,
                    borderRadius: 4,
                    fontSize: 16,
                    resize: 'vertical',
                    background: 'var(--input-bg)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button
                onClick={() => updateItem(editingItem)}
                style={{
                  padding: '10px 20px',
                  background: 'var(--primary)',
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
                  background: 'var(--secondary)',
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

             {/* Navigation and Floating Add Button */}
       <Navigation />
       <FloatingAddButton defaultRoom={roomFilter} />
    </div>
  );
}