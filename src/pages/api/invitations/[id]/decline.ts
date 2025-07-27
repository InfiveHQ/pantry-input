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

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invitation ID is required' });
  }

  try {
    // Update invitation status to declined
    const { error } = await supabase
      .from('household_invitations')
      .update({ status: 'declined' })
      .eq('id', id)
      .eq('status', 'pending');

    if (error) {
      console.error('Error declining invitation:', error);
      throw error;
    }

    res.status(200).json({
      message: 'Invitation declined successfully'
    });
  } catch (error) {
    console.error('Error declining invitation:', error);
    res.status(500).json({ 
      error: 'Failed to decline invitation',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 