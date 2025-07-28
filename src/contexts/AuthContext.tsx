import { createContext, useContext, useEffect, useState } from 'react';
import { createClient, User } from '@supabase/supabase-js';

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

// Check for required environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables. Please check your .env.local file.');
}

const supabase = createClient(
  supabaseUrl || '',
  supabaseKey || ''
);

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
        
        // Create profile via API
        try {
          console.log('Attempting to create profile for user:', data.user.id);
          
          const response = await fetch('/api/create-profile', {
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

          console.log('Profile creation response status:', response.status);
          
          if (response.ok) {
            const result = await response.json();
            console.log('Profile created successfully:', result);
          } else {
            const error = await response.json();
            console.error('Failed to create profile:', error);
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
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        console.error('Signin error:', error);
        throw error;
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