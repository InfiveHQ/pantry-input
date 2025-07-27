import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invitation ID is required' });
  }

  try {
    const { data: invitation, error } = await supabase
      .from('household_invitations')
      .select(`
        *,
        household:household_id(name)
      `)
      .eq('id', id)
      .eq('status', 'pending')
      .single();

    if (error || !invitation) {
      return res.status(404).json({ error: 'Invitation not found or has expired' });
    }

    // Check if invitation has expired
    if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
      return res.status(410).json({ error: 'Invitation has expired' });
    }

    res.status(200).json(invitation);
  } catch (error) {
    console.error('Error fetching invitation:', error);
    res.status(500).json({ 
      error: 'Failed to fetch invitation',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 