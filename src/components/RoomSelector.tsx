import { useState, useEffect, useCallback } from 'react';
import { isFeatureEnabled } from '../lib/featureFlags';

interface Room {
  id: string;
  name: string;
  household_id: string;
  description?: string;
}

interface RoomSelectorProps {
  householdId: string;
  selectedRoomId?: string;
  onRoomChange: (roomId: string) => void;
  className?: string;
}

export default function RoomSelector({ 
  householdId, 
  selectedRoomId, 
  onRoomChange, 
  className = '' 
}: RoomSelectorProps) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/rooms?household_id=${householdId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch rooms');
      }
      
      const data = await response.json();
      setRooms(data);
      
      // If no room is selected and rooms exist, select the first one
      if (!selectedRoomId && data.length > 0) {
        onRoomChange(data[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load rooms');
      console.error('Error fetching rooms:', err);
    } finally {
      setLoading(false);
    }
  }, [householdId, selectedRoomId, onRoomChange]);

  useEffect(() => {
    if (householdId && isFeatureEnabled('MULTI_ROOM')) {
      fetchRooms();
    }
  }, [householdId, fetchRooms]);

  // If multi-room feature is disabled, don't render anything
  if (!isFeatureEnabled('MULTI_ROOM')) {
    return null;
  }

  const handleRoomChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const roomId = event.target.value;
    onRoomChange(roomId);
  };

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
        <span className="text-sm text-gray-600">Loading rooms...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-sm text-red-600 ${className}`}>
        Error loading rooms: {error}
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className={`text-sm text-gray-500 ${className}`}>
        No rooms available
      </div>
    );
  }

  return (
    <div className={`flex flex-col space-y-2 ${className}`}>
      <label htmlFor="room-select" className="text-sm font-medium text-gray-700">
        Room
      </label>
      <select
        id="room-select"
        value={selectedRoomId || ''}
        onChange={handleRoomChange}
        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
      >
        {rooms.map((room) => (
          <option key={room.id} value={room.id}>
            {room.name}
          </option>
        ))}
      </select>
    </div>
  );
}

// Kitchen-specific room component (always shows "Kitchen")
export function KitchenRoomSelector({ 
  className = '' 
}: Omit<RoomSelectorProps, 'householdId' | 'selectedRoomId' | 'onRoomChange'>) {
  // Always show kitchen for kitchen-only mode
  if (isFeatureEnabled('MULTI_ROOM')) {
    return null; // Use the main RoomSelector instead
  }

  return (
    <div className={`flex flex-col space-y-2 ${className}`}>
      <label className="text-sm font-medium text-gray-700">
        Location
      </label>
      <div className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-700 sm:text-sm">
        Kitchen
      </div>
    </div>
  );
}
