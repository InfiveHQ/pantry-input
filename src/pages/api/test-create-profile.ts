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

    console.log('Test create-profile called with:', { user_id, email, first_name, last_name });

    if (!user_id || !email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Test the exact same logic as the real create-profile API
    const { data, error } = await supabase
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

    if (error) {
      console.error('Profile creation error:', error);
      return res.status(500).json({ 
        error: 'Failed to create profile',
        details: error.message,
        code: error.code
      });
    }

    return res.status(200).json({ 
      success: true, 
      profile: data,
      message: 'Test profile created successfully'
    });
  } catch (error) {
    console.error('Test create profile error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 