import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !serviceRoleKey) {
      return res.status(500).json({ 
        error: 'Missing environment variables',
        supabaseUrl: supabaseUrl ? 'Set' : 'Missing',
        serviceRoleKey: serviceRoleKey ? 'Set' : 'Missing'
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Test database connection
    const { error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (error) {
      return res.status(500).json({ 
        error: 'Database connection failed',
        details: error.message
      });
    }

    return res.status(200).json({ 
      message: 'Profile API is working',
      database: 'Connected',
      env_vars: {
        supabase_url: supabaseUrl ? 'Set' : 'Missing',
        service_role_key: serviceRoleKey ? 'Set' : 'Missing'
      }
    });
  } catch (error) {
    console.error('Test profile error:', error);
    return res.status(500).json({ 
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 