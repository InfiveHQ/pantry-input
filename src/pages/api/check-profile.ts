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
    const { user_id, email, first_name, last_name } = req.body;

    console.log('Check-profile API called with:', { user_id, email, first_name, last_name });

    if (!user_id || !email) {
      console.error('Missing required fields:', { user_id, email });
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if profile exists
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user_id)
      .single();

    if (existingProfile) {
      console.log('Profile found for user:', user_id);
      return res.status(200).json({ 
        success: true, 
        profile: existingProfile,
        exists: true,
        message: 'Profile exists'
      });
    }

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking profile:', checkError);
      return res.status(500).json({ error: 'Failed to check profile' });
    }

    // Profile doesn't exist, create it
    console.log('Profile not found, creating new profile for user:', user_id);
    
    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert({
        id: user_id,
        email: email,
        first_name: first_name || '',
        last_name: last_name || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (createError) {
      console.error('Profile creation error:', createError);
      return res.status(500).json({ 
        error: 'Failed to create profile',
        details: createError.message,
        code: createError.code
      });
    }

    console.log('Profile created successfully:', newProfile);
    return res.status(200).json({ 
      success: true, 
      profile: newProfile,
      exists: false,
      message: 'Profile created'
    });
  } catch (error) {
    console.error('Check profile error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 