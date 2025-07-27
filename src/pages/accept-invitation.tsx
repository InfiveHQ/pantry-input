import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';

interface Invitation {
  id: string;
  household_id: string;
  email: string;
  role: string;
  status: string;
  household?: {
    name: string;
  };
}

export default function AcceptInvitation() {
  const router = useRouter();
  const { invitation_id } = router.query;
  const { user, loading: authLoading } = useAuth();
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (invitation_id) {
      fetchInvitation();
    }
  }, [invitation_id]);

  const fetchInvitation = async () => {
    try {
      const response = await fetch(`/api/invitations/${invitation_id}`);
      if (response.ok) {
        const data = await response.json();
        setInvitation(data);
      } else {
        setError('Invitation not found or has expired');
      }
    } catch (error) {
      setError('Failed to load invitation');
    } finally {
      setLoading(false);
    }
  };

  const acceptInvitation = async () => {
    if (!user) {
      setError('Please sign in to accept the invitation');
      return;
    }

    try {
      const response = await fetch(`/api/invitations/${invitation_id}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id
        })
      });

      if (response.ok) {
        setSuccess('Invitation accepted! You are now a member of the household.');
        setTimeout(() => {
          router.push('/households');
        }, 2000);
      } else {
        const error = await response.json();
        setError(error.error || 'Failed to accept invitation');
      }
    } catch (error) {
      setError('Failed to accept invitation');
    }
  };

  const declineInvitation = async () => {
    try {
      const response = await fetch(`/api/invitations/${invitation_id}/decline`, {
        method: 'POST'
      });

      if (response.ok) {
        setSuccess('Invitation declined');
        setTimeout(() => {
          router.push('/');
        }, 2000);
      } else {
        setError('Failed to decline invitation');
      }
    } catch (error) {
      setError('Failed to decline invitation');
    }
  };

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#f8f9fa'
      }}>
        <div>Loading invitation...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#f8f9fa'
      }}>
        <div style={{
          background: 'white',
          padding: 40,
          borderRadius: 8,
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          textAlign: 'center',
          maxWidth: 400
        }}>
          <h2 style={{ color: '#dc3545', marginBottom: 20 }}>❌ Error</h2>
          <p style={{ color: '#666', marginBottom: 20 }}>{error}</p>
          <button
            onClick={() => router.push('/')}
            style={{
              padding: '10px 20px',
              background: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer'
            }}
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#f8f9fa'
      }}>
        <div style={{
          background: 'white',
          padding: 40,
          borderRadius: 8,
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          textAlign: 'center',
          maxWidth: 400
        }}>
          <h2 style={{ color: '#28a745', marginBottom: 20 }}>✅ Success</h2>
          <p style={{ color: '#666', marginBottom: 20 }}>{success}</p>
        </div>
      </div>
    );
  }

  if (!invitation) {
    return null;
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: '#f8f9fa'
    }}>
      <div style={{
        background: 'white',
        padding: 40,
        borderRadius: 8,
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        textAlign: 'center',
        maxWidth: 500
      }}>
        <h1 style={{ color: '#333', marginBottom: 20 }}>🏠 Household Invitation</h1>
        
        <div style={{ marginBottom: 30 }}>
          <h3 style={{ color: '#333', marginBottom: 10 }}>
            You've been invited to join "{invitation.household?.name || 'Unknown Household'}"
          </h3>
          <p style={{ color: '#666', marginBottom: 10 }}>
            Role: <strong>{invitation.role}</strong>
          </p>
          <p style={{ color: '#666', fontSize: 14 }}>
            This invitation was sent to: <strong>{invitation.email}</strong>
          </p>
        </div>

        {!user ? (
          <div style={{ marginBottom: 20 }}>
            <p style={{ color: '#666', marginBottom: 15 }}>
              Please sign in to accept this invitation
            </p>
            <button
              onClick={() => router.push('/login')}
              style={{
                padding: '12px 24px',
                background: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 16,
                fontWeight: 'bold'
              }}
            >
              Sign In
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button
              onClick={acceptInvitation}
              style={{
                padding: '12px 24px',
                background: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 16,
                fontWeight: 'bold'
              }}
            >
              ✅ Accept Invitation
            </button>
            <button
              onClick={declineInvitation}
              style={{
                padding: '12px 24px',
                background: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 16
              }}
            >
              ❌ Decline
            </button>
          </div>
        )}

        <div style={{ marginTop: 20 }}>
          <button
            onClick={() => router.push('/')}
            style={{
              padding: '8px 16px',
              background: 'none',
              color: '#666',
              border: '1px solid #ddd',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 14
            }}
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
} 