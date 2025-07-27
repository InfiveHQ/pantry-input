import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // Get invitations for a household
    const { household_id } = req.query;
    
    if (!household_id) {
      return res.status(400).json({ error: 'Household ID is required' });
    }

    try {
      const { data: invitations, error } = await supabase
        .from('household_invitations')
        .select(`
          *,
          household:household_id(name)
        `)
        .eq('household_id', household_id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching invitations:', error);
        throw error;
      }

      res.status(200).json(invitations);
    } catch (error) {
      console.error('Error fetching invitations:', error);
      res.status(500).json({ 
        error: 'Failed to fetch invitations',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  } else if (req.method === 'DELETE') {
    // Cancel/delete invitation
    const { invitation_id } = req.query;
    
    if (!invitation_id) {
      return res.status(400).json({ error: 'Invitation ID is required' });
    }

    try {
      const { error } = await supabase
        .from('household_invitations')
        .delete()
        .eq('id', invitation_id);

      if (error) {
        console.error('Error deleting invitation:', error);
        throw error;
      }

      res.status(200).json({ message: 'Invitation cancelled successfully' });
    } catch (error) {
      console.error('Error deleting invitation:', error);
      res.status(500).json({ 
        error: 'Failed to cancel invitation',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
} 