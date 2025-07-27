import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';

interface Household {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
}

export default function HouseholdSelector() {
  const { user, getUserHouseholds } = useAuth();
  const [households, setHouseholds] = useState<Household[]>([]);
  const [selectedHousehold, setSelectedHousehold] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchHouseholds = useCallback(async () => {
    try {
      const data = await getUserHouseholds();
      setHouseholds(data);
      if (data.length > 0 && !selectedHousehold) {
        setSelectedHousehold(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching households:', error);
    } finally {
      setLoading(false);
    }
  }, [getUserHouseholds, selectedHousehold]);

  useEffect(() => {
    if (user) {
      fetchHouseholds();
    }
  }, [user, fetchHouseholds]);

  if (loading) {
    return (
      <div style={{ padding: '8px 12px', color: '#666' }}>
        Loading households...
      </div>
    );
  }

  if (households.length === 0) {
    return (
      <div style={{ 
        padding: '8px 12px', 
        background: '#fff3cd', 
        border: '1px solid #ffeaa7',
        borderRadius: 4,
        color: '#856404'
      }}>
        No households yet. <Link href="/households" style={{ color: '#007bff' }}>Create one</Link>
      </div>
    );
  }

  const currentHousehold = households.find(h => h.id === selectedHousehold);

  return (
    <div style={{ 
      padding: '8px 12px', 
      background: '#e3f2fd', 
      border: '1px solid #bbdefb',
      borderRadius: 4,
      marginBottom: 10
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontWeight: 'bold', color: '#1976d2' }}>Household:</span>
        <select
          value={selectedHousehold || ''}
          onChange={(e) => setSelectedHousehold(e.target.value)}
          style={{
            padding: '4px 8px',
            border: '1px solid #bbdefb',
            borderRadius: 4,
            background: 'white',
            fontSize: 14
          }}
        >
          {households.map(household => (
            <option key={household.id} value={household.id}>
              {household.name}
            </option>
          ))}
        </select>
        {currentHousehold && (
          <span style={{ 
            fontSize: 12, 
            color: '#666',
            marginLeft: 8
          }}>
            {currentHousehold.owner_id === user?.id ? '(Owner)' : '(Member)'}
          </span>
        )}
      </div>
    </div>
  );
} 