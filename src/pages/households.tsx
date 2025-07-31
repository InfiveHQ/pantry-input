import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';

import Navigation from '../components/Navigation';
import FloatingAddButton from '../components/FloatingAddButton';

interface Household {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
}

interface HouseholdMember {
  id: string;
  household_id: string;
  user_id: string;
  role: 'owner' | 'member';
  created_at: string;
  profiles?: {
    email: string;
    full_name: string;
  };
}

interface Invitation {
  id: string;
  household_id: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  expires_at: string;
  household?: {
    name: string;
  };
}

export default function Households() {
  const { 
    user, 
    loading: authLoading, 
    createHousehold, 
    getUserHouseholds, 
    inviteMember, 
    getHouseholdMembers 
  } = useAuth();
  const router = useRouter();
  const [households, setHouseholds] = useState<Household[]>([]);
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newHouseholdName, setNewHouseholdName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [selectedHousehold, setSelectedHousehold] = useState<string | null>(null);
  const [showMembers, setShowMembers] = useState<string | null>(null);
  const [showInvitations, setShowInvitations] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  const fetchHouseholds = useCallback(async () => {
    try {
      setError('');
      const data = await getUserHouseholds();
      setHouseholds(data);
    } catch (error: unknown) {
      console.error('Error fetching households:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch households');
    } finally {
      setLoading(false);
    }
  }, [getUserHouseholds]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchHouseholds();
    }
  }, [user, fetchHouseholds]);

  // Check if mobile for responsive layout
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  const handleCreateHousehold = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHouseholdName.trim()) return;

    try {
      setError('');
      await createHousehold(newHouseholdName);
      setNewHouseholdName('');
      setShowCreateForm(false);
      fetchHouseholds();
      alert('Household created successfully!');
    } catch (error: unknown) {
      console.error('Error creating household:', error);
      setError(error instanceof Error ? error.message : 'Error creating household');
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !selectedHousehold) return;

    try {
      setError('');
      const result = await inviteMember(selectedHousehold, inviteEmail);
      setInviteEmail('');
      setSelectedHousehold(null);
      
             // Show appropriate message based on the result
       if (result?.status === 'added') {
         alert('Member added successfully!');
       } else if (result?.status === 'invited') {
         const message = `Invitation sent to ${result.email}!\n\nShare this link with them:\n${result.invitation_url}`;
         alert(message);
       } else {
         alert('Invitation sent!');
       }
    } catch (error: unknown) {
      console.error('Error inviting member:', error);
      setError(error instanceof Error ? error.message : 'Error sending invitation');
    }
  };

  const fetchMembers = async (householdId: string) => {
    try {
      setError('');
      const data = await getHouseholdMembers(householdId);
      setMembers(data);
    } catch (error: unknown) {
      console.error('Error fetching members:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch members');
    }
  };

  const fetchInvitations = async (householdId: string) => {
    try {
      setError('');
      const response = await fetch(`/api/invitations?household_id=${householdId}`);
      if (response.ok) {
        const data = await response.json();
        setInvitations(data);
      } else {
        throw new Error('Failed to fetch invitations');
      }
    } catch (error: unknown) {
      console.error('Error fetching invitations:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch invitations');
    }
  };

  const cancelInvitation = async (invitationId: string) => {
    try {
      setError('');
      const response = await fetch(`/api/invitations?invitation_id=${invitationId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        // Refresh invitations list
        if (showInvitations) {
          fetchInvitations(showInvitations);
        }
        alert('Invitation cancelled successfully!');
      } else {
        throw new Error('Failed to cancel invitation');
      }
    } catch (error: unknown) {
      console.error('Error cancelling invitation:', error);
      setError(error instanceof Error ? error.message : 'Failed to cancel invitation');
    }
  };

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

  if (!user) {
    return null;
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
      {/* Header with Theme Toggle and Sign Out */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 30,
        position: 'relative'
      }}>
        {/* Left side - Title */}
        <h1 style={{ color: 'var(--text-primary)', margin: 0 }}>Households</h1>
        
        {/* Right side - Create Household */}
        <div style={{ display: 'flex', gap: 15, alignItems: 'center' }}>
          <button
            onClick={() => setShowCreateForm(true)}
            style={{
              padding: '8px 16px',
              background: 'var(--primary)',
              color: 'white',
              textDecoration: 'none',
              borderRadius: 6,
              fontWeight: 'bold',
              border: 'none',
              cursor: 'pointer',
              fontSize: '12px',
              transition: 'all 0.2s ease'
            }}
          >
            ➕ Create Household
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div style={{
          background: '#f8d7da',
          color: '#721c24',
          padding: '12px',
          borderRadius: 4,
          marginBottom: 20,
          border: '1px solid #f5c6cb'
        }}>
          {error}
        </div>
      )}

      {/* Create Household Section */}
      <div style={{ 
        background: 'white', 
        padding: 20, 
        borderRadius: 8, 
        marginBottom: 30,
        border: '1px solid #e0e0e0'
      }}>
        <h2 style={{ margin: '0 0 20px 0', color: '#333' }}>Create New Household</h2>
        
        {!showCreateForm ? (
          <button
            onClick={() => setShowCreateForm(true)}
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
            ➕ Create Household
          </button>
        ) : (
          <form onSubmit={handleCreateHousehold}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
                Household Name
              </label>
              <input
                type="text"
                value={newHouseholdName}
                onChange={(e) => setNewHouseholdName(e.target.value)}
                placeholder="e.g., Smith Family"
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: 4,
                  fontSize: 16
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="submit"
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
                Create Household
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                style={{
                  padding: '12px 24px',
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: 16
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Households List */}
      <div style={{ 
        background: 'white', 
        padding: 20, 
        borderRadius: 8,
        border: '1px solid #e0e0e0'
      }}>
        <h2 style={{ margin: '0 0 20px 0', color: '#333' }}>Your Households</h2>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <h3>Loading households...</h3>
          </div>
        ) : households.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
            <h3>No households yet</h3>
            <p>Create your first household to start sharing your pantry!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 20 }}>
            {households.map(household => (
              <div key={household.id} style={{
                border: '1px solid #e0e0e0',
                borderRadius: 8,
                padding: 20,
                background: '#f8f9fa'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                  <h3 style={{ margin: 0, color: '#333' }}>{household.name}</h3>
                  <span style={{
                    padding: '4px 8px',
                    background: household.owner_id === user?.id ? '#28a745' : '#007bff',
                    color: 'white',
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 'bold'
                  }}>
                    {household.owner_id === user?.id ? 'Owner' : 'Member'}
                  </span>
                </div>
                
                <div style={{ marginBottom: 15 }}>
                  <p style={{ margin: 0, color: '#666' }}>
                    Created: {new Date(household.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button
                    onClick={() => {
                      // TODO: Navigate to household's pantry
                      alert('Navigate to household pantry - coming soon!');
                    }}
                    style={{
                      padding: '8px 16px',
                      background: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontSize: 14
                    }}
                  >
                    View Pantry
                  </button>
                  
                                     <button
                     onClick={() => {
                       if (showMembers === household.id) {
                         setShowMembers(null);
                       } else {
                         setShowMembers(household.id);
                         fetchMembers(household.id);
                       }
                     }}
                     style={{
                       padding: '8px 16px',
                       background: '#6f42c1',
                       color: 'white',
                       border: 'none',
                       borderRadius: 4,
                       cursor: 'pointer',
                       fontSize: 14
                     }}
                   >
                     {showMembers === household.id ? 'Hide Members' : 'View Members'}
                   </button>
                   
                   <button
                     onClick={() => {
                       if (showInvitations === household.id) {
                         setShowInvitations(null);
                       } else {
                         setShowInvitations(household.id);
                         fetchInvitations(household.id);
                       }
                     }}
                     style={{
                       padding: '8px 16px',
                       background: '#fd7e14',
                       color: 'white',
                       border: 'none',
                       borderRadius: 4,
                       cursor: 'pointer',
                       fontSize: 14
                     }}
                   >
                     {showInvitations === household.id ? 'Hide Invitations' : 'View Invitations'}
                   </button>
                  
                  {household.owner_id === user?.id && (
                    <button
                      onClick={() => setSelectedHousehold(household.id)}
                      style={{
                        padding: '8px 16px',
                        background: '#17a2b8',
                        color: 'white',
                        border: 'none',
                        borderRadius: 4,
                        cursor: 'pointer',
                        fontSize: 14
                      }}
                    >
                      Invite Member
                    </button>
                  )}
                </div>

                {/* Members Section */}
                {showMembers === household.id && (
                  <div style={{ 
                    marginTop: 15, 
                    padding: 15, 
                    background: '#f8f9fa', 
                    borderRadius: 4,
                    border: '1px solid #e9ecef'
                  }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#495057' }}>Members</h4>
                    {members.length === 0 ? (
                      <p style={{ margin: 0, color: '#6c757d' }}>No members yet</p>
                    ) : (
                      <div style={{ display: 'grid', gap: 8 }}>
                        {members.map(member => (
                          <div key={member.id} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '8px 12px',
                            background: 'white',
                            borderRadius: 4,
                            border: '1px solid #dee2e6'
                          }}>
                            <div>
                              <span style={{ fontWeight: 'bold' }}>
                                {member.profiles?.full_name || member.profiles?.email || 'Unknown User'}
                              </span>
                              <span style={{
                                marginLeft: 8,
                                padding: '2px 6px',
                                background: member.role === 'owner' ? '#28a745' : '#007bff',
                                color: 'white',
                                borderRadius: 3,
                                fontSize: 12
                              }}>
                                {member.role}
                              </span>
                            </div>
                            <span style={{ color: '#6c757d', fontSize: 12 }}>
                              {member.profiles?.email}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                                 )}
                 
                 {/* Invitations Section */}
                 {showInvitations === household.id && (
                   <div style={{ 
                     marginTop: 15, 
                     padding: 15, 
                     background: '#fff3cd', 
                     borderRadius: 4,
                     border: '1px solid #ffeaa7'
                   }}>
                     <h4 style={{ margin: '0 0 10px 0', color: '#856404' }}>Pending Invitations</h4>
                     {invitations.length === 0 ? (
                       <p style={{ margin: 0, color: '#856404' }}>No pending invitations</p>
                     ) : (
                       <div style={{ display: 'grid', gap: 8 }}>
                         {invitations.map(invitation => (
                           <div key={invitation.id} style={{
                             display: 'flex',
                             justifyContent: 'space-between',
                             alignItems: 'center',
                             padding: '8px 12px',
                             background: 'white',
                             borderRadius: 4,
                             border: '1px solid #ffeaa7'
                           }}>
                             <div>
                               <span style={{ fontWeight: 'bold', color: '#856404' }}>
                                 {invitation.email}
                               </span>
                               <span style={{
                                 marginLeft: 8,
                                 padding: '2px 6px',
                                 background: '#fd7e14',
                                 color: 'white',
                                 borderRadius: 3,
                                 fontSize: 12
                               }}>
                                 {invitation.status}
                               </span>
                             </div>
                             <div style={{ display: 'flex', gap: 5 }}>
                               <span style={{ color: '#856404', fontSize: 12 }}>
                                 {new Date(invitation.created_at).toLocaleDateString()}
                               </span>
                               {invitation.status === 'pending' && (
                                 <button
                                   onClick={() => cancelInvitation(invitation.id)}
                                   style={{
                                     padding: '2px 6px',
                                     background: '#dc3545',
                                     color: 'white',
                                     border: 'none',
                                     borderRadius: 3,
                                     cursor: 'pointer',
                                     fontSize: 12
                                   }}
                                 >
                                   Cancel
                                 </button>
                               )}
                             </div>
                           </div>
                         ))}
                       </div>
                     )}
                   </div>
                 )}
               </div>
             ))}
           </div>
         )}
       </div>

      {/* Invite Modal */}
      {selectedHousehold && (
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
            maxWidth: 400
          }}>
            <h2 style={{ margin: '0 0 20px 0' }}>Invite Member</h2>
            
            <form onSubmit={handleInviteMember}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Enter email address"
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: 4,
                    fontSize: 16
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="submit"
                  style={{
                    padding: '10px 20px',
                    background: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontSize: 14
                  }}
                >
                  Send Invitation
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedHousehold(null);
                    setInviteEmail('');
                  }}
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
            </form>
          </div>
        </div>
      )}
      
      {/* Navigation and Floating Add Button */}
      <Navigation />
      <FloatingAddButton />
    </div>
  );
} 