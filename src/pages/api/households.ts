import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // Get user's households
    const { user_id } = req.query;
    
    if (!user_id) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    try {
      // Get households where user is owner or member
      const { data: households, error } = await supabase
        .from('households')
        .select(`
          *,
          household_members!inner(user_id)
        `)
        .eq('household_members.user_id', user_id);

      if (error) {
        console.error('Supabase error:', error);
        return res.status(500).json({ 
          error: 'Failed to fetch households',
          details: error.message,
          hint: error.message.includes('relation') ? 'Database tables may not exist. Run the setup script.' : 'Check your database connection.'
        });
      }

      res.status(200).json(households);
    } catch (error) {
      console.error('Error fetching households:', error);
      res.status(500).json({ 
        error: 'Failed to fetch households',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  } else if (req.method === 'POST') {
    // Create new household
    const { name, owner_id } = req.body;

    if (!name || !owner_id) {
      return res.status(400).json({ error: 'Name and owner_id are required' });
    }

    try {
      // Create household
      const { data: household, error: householdError } = await supabase
        .from('households')
        .insert({
          name,
          owner_id
        })
        .select()
        .single();

      if (householdError) throw householdError;

      // Add owner as member
      const { error: memberError } = await supabase
        .from('household_members')
        .insert({
          household_id: household.id,
          user_id: owner_id,
          role: 'owner'
        });

      if (memberError) throw memberError;

      res.status(201).json(household);
    } catch (error) {
      console.error('Error creating household:', error);
      res.status(500).json({ error: 'Failed to create household' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
} 