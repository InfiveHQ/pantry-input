import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

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
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, firstName: string, lastName?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  createHousehold: (name: string) => Promise<Household>;
  getUserHouseholds: () => Promise<Household[]>;
  inviteMember: (householdId: string, email: string) => Promise<{ message: string; status: string; email?: string; invitation_url?: string }>;
  getHouseholdMembers: (householdId: string) => Promise<HouseholdMember[]>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
      } catch (error) {
        console.error('Error getting session:', error);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, firstName: string, lastName?: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
          data: {
            first_name: firstName,
            last_name: lastName || ''
          }
        }
      });
      
      if (error) {
        console.error('Signup error:', error);
        throw error;
      }
      
      // Check if user was created successfully
      if (data.user) {
        console.log('User created successfully:', data.user.id);
        
        // Wait a moment for the database trigger to potentially create the profile
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check if profile was created by the trigger
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();
          
          if (profileData) {
            console.log('Profile already exists (created by trigger):', profileData);
            return; // Profile already exists, no need to create manually
          }
          
          if (profileError && profileError.code !== 'PGRST116') {
            console.error('Error checking profile:', profileError);
          }
        } catch (checkError) {
          console.error('Error checking existing profile:', checkError);
        }
        
        // Fallback: Create profile via API if trigger didn't work
        try {
          console.log('Creating profile via API fallback...');
          const response = await fetch('/api/check-profile', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              user_id: data.user.id,
              email: email,
              first_name: firstName,
              last_name: lastName || ''
            })
          });

          if (response.ok) {
            const result = await response.json();
            console.log('Profile check/creation result:', result);
          } else {
            const errorData = await response.json();
            console.error('Failed to check/create profile via API:', errorData);
            // Don't fail signup if profile creation fails - user can still use the app
          }
        } catch (profileError) {
          console.error('Profile creation error:', profileError);
          // Don't fail signup if profile creation fails
        }
      }
    } catch (error: unknown) {
      console.error('Signup failed:', error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        console.error('Signin error:', error);
        throw error;
      }
      
      // Check if user has a profile, create one if needed
      if (data.user) {
        console.log('User signed in successfully:', data.user.id);
        
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();
          
          if (!profileData && profileError?.code === 'PGRST116') {
            console.log('No profile found for user, creating one...');
            // Create profile for existing user
            const response = await fetch('/api/check-profile', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                user_id: data.user.id,
                email: data.user.email,
                first_name: data.user.user_metadata?.first_name || '',
                last_name: data.user.user_metadata?.last_name || ''
              })
            });
            
            if (response.ok) {
              const result = await response.json();
              console.log('Profile created for existing user:', result);
            } else {
              console.error('Failed to create profile for existing user');
            }
          } else if (profileData) {
            console.log('Profile found for user:', profileData);
          }
        } catch (profileCheckError) {
          console.error('Error checking profile during signin:', profileCheckError);
        }
      }
    } catch (error) {
      console.error('Signin failed:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Signout failed:', error);
      throw error;
    }
  };

  const createHousehold = async (name: string): Promise<Household> => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      const response = await fetch('/api/households', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          owner_id: user.id
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create household');
      }

      return response.json();
    } catch (error) {
      console.error('Create household error:', error);
      throw error;
    }
  };

  const getUserHouseholds = async (): Promise<Household[]> => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      const response = await fetch(`/api/households?user_id=${user.id}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch households');
      }

      return response.json();
    } catch (error) {
      console.error('Get households error:', error);
      throw error;
    }
  };

  const inviteMember = async (householdId: string, email: string): Promise<{ message: string; status: string; email?: string; invitation_url?: string }> => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      const response = await fetch('/api/household-members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          household_id: householdId,
          user_email: email,
          invited_by: user.id
        })
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Invite member error:', error);
        throw new Error(error.error || 'Failed to invite member');
      }

      return response.json();
    } catch (error: unknown) {
      console.error('Invite member failed:', error);
      throw error;
    }
  };

  const getHouseholdMembers = async (householdId: string): Promise<HouseholdMember[]> => {
    try {
      const response = await fetch(`/api/household-members?household_id=${householdId}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch members');
      }

      return response.json();
    } catch (error) {
      console.error('Get members error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      signUp, 
      signIn, 
      signOut,
      createHousehold,
      getUserHouseholds,
      inviteMember,
      getHouseholdMembers
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 