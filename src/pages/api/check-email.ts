import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if email exists in profiles table
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', email)
      .single();

    if (profileData) {
      return res.status(200).json({ 
        exists: true, 
        message: 'Email already registered',
        profile: { id: profileData.id, email: profileData.email }
      });
    }

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error checking email:', profileError);
      return res.status(500).json({ error: 'Failed to check email' });
    }

    // Also check auth.users table
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('Error checking auth users:', authError);
      return res.status(200).json({ exists: false, message: 'Email not found' });
    }

    const userExists = authData.users.some(user => user.email === email);

    return res.status(200).json({ 
      exists: userExists, 
      message: userExists ? 'Email already registered' : 'Email not found'
    });

  } catch (error) {
    console.error('Check email error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 