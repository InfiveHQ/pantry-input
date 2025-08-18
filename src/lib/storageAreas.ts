// Centralized Storage Areas Configuration
// This organizes all storage areas by room for better management

export interface StorageArea {
  id: string;
  name: string;
  room: string;
}

export const STORAGE_AREAS: StorageArea[] = [
  // Kitchen
  { id: 'kitchen-shelf-top-small', name: 'Shelf Top Small', room: 'Kitchen' },
  { id: 'kitchen-shelf-top-right', name: 'Shelf Top Right', room: 'Kitchen' },
  { id: 'kitchen-shelf-top-large', name: 'Shelf Top Large', room: 'Kitchen' },
  { id: 'kitchen-shelf-bottom', name: 'Shelf Bottom', room: 'Kitchen' },
  { id: 'kitchen-countertop', name: 'Countertop', room: 'Kitchen' },
  { id: 'kitchen-box-coffee', name: 'Box Coffee', room: 'Kitchen' },
  { id: 'kitchen-snack-cabinet', name: 'Snack Cabinet', room: 'Kitchen' },
  { id: 'kitchen-medicine-cabinet', name: 'Medicine Cabinet', room: 'Kitchen' },
  { id: 'kitchen-alcohol-cabinet', name: 'Alcohol Cabinet', room: 'Kitchen' },
  { id: 'kitchen-fridge', name: 'Fridge', room: 'Kitchen' },
  { id: 'kitchen-freezer', name: 'Freezer', room: 'Kitchen' },
  { id: 'kitchen-cleaning-cupboard', name: 'Cleaning Cupboard', room: 'Kitchen' },
  { id: 'kitchen-makeup-box', name: 'Makeup Box', room: 'Kitchen' },
  { id: 'kitchen-unknown', name: 'Unknown', room: 'Kitchen' },

  // Living Room
  { id: 'living-back-bookshelf', name: 'Back Bookshelf', room: 'Living Room' },
  { id: 'living-front-bookshelf', name: 'Front Bookshelf', room: 'Living Room' },
  { id: 'living-fireplace-box', name: 'Fireplace Box', room: 'Living Room' },
  { id: 'living-tv-cabinet', name: 'TV Cabinet', room: 'Living Room' },
  { id: 'living-beside-couch', name: 'Beside Couch', room: 'Living Room' },

  // Study Room
  { id: 'study-wardrobe', name: 'Study Room Wardrobe', room: 'Study Room' },
  { id: 'study-working-desk', name: 'Working Desk Area', room: 'Study Room' },
  { id: 'study-underbed-1', name: 'Underbed Storage 1', room: 'Study Room' },
  { id: 'study-underbed-2', name: 'Underbed Storage 2', room: 'Study Room' },

  // Bedroom
  { id: 'bedroom-front-shelves', name: 'Front shelves', room: 'Bedroom' },
  { id: 'bedroom-wardrobe-left', name: 'Wardrobe Left', room: 'Bedroom' },
  { id: 'bedroom-wardrobe-right', name: 'Wardrobe Right', room: 'Bedroom' },
  { id: 'bedroom-beside-table-left', name: 'Bedside Table Left', room: 'Bedroom' },
  { id: 'bedroom-beside-table-right', name: 'Bedside Table Right', room: 'Bedroom' },

  // Bathroom
  { id: 'bathroom-top-shelf', name: 'Top Shelf', room: 'Bathroom' },
  { id: 'bathroom-middle-shelf', name: 'Middle Shelf', room: 'Bathroom' },
  { id: 'bathroom-lower-shelf', name: 'Lower Shelf (Cleaning Products)', room: 'Bathroom' },
  { id: 'bathroom-outside-cleaning', name: 'Outside Cleaning Products', room: 'Bathroom' },
  { id: 'bathroom-bath-products', name: 'Bath Products Area', room: 'Bathroom' },

  // Stairs Cupboard
  { id: 'stairs-shoes-cabinet', name: 'Shoes Cabinet', room: 'Stairs Cupboard' },
  { id: 'stairs-cupboard', name: 'Stairs Cupboard', room: 'Stairs Cupboard' },

  // Conservatory
  { id: 'conservatory-general', name: 'General Storage', room: 'Conservatory' },

  // Garden Shed
  { id: 'garden-shed-general', name: 'General Storage', room: 'Garden Shed' },
];

// Helper functions
export const getRooms = (): string[] => {
  const roomSet = new Set<string>();
  STORAGE_AREAS.forEach(area => roomSet.add(area.room));
  const rooms = Array.from(roomSet);
  
  // Put Kitchen first, then sort the rest alphabetically
  const kitchenFirst = rooms.filter(room => room === 'Kitchen');
  const otherRooms = rooms.filter(room => room !== 'Kitchen').sort();
  
  return [...kitchenFirst, ...otherRooms];
};

export const getStorageAreasByRoom = (room: string): StorageArea[] => {
  return STORAGE_AREAS.filter(area => area.room === room);
};

export const getAllStorageAreaNames = (): string[] => {
  return STORAGE_AREAS.map(area => area.name);
};

export const getStorageAreaById = (id: string): StorageArea | undefined => {
  return STORAGE_AREAS.find(area => area.id === id);
};

export const getStorageAreaByName = (name: string): StorageArea | undefined => {
  return STORAGE_AREAS.find(area => area.name === name);
};

// For backward compatibility - returns just the names as before
export const LOCATION_OPTIONS = getAllStorageAreaNames();
