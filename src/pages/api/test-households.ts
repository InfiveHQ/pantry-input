import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Test database connection
    const { data, error } = await supabase
      .from('households')
      .select('count')
      .limit(1);

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ 
        error: 'Database connection failed', 
        details: error.message,
        hint: 'Make sure you have run the database setup script'
      });
    }

    // Test if tables exist
    const { data: tableTest, error: tableError } = await supabase
      .rpc('get_table_info', { table_name: 'households' })
      .catch(() => ({ data: null, error: { message: 'Table does not exist' } }));

    res.status(200).json({
      message: 'API is working',
      database: 'Connected',
      tables: tableError ? 'Missing - run database setup' : 'Exist',
      env_vars: {
        supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
        service_role_key: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing'
      }
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({ 
      error: 'Test failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 