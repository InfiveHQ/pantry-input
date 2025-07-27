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
  const { user_id } = req.body;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invitation ID is required' });
  }

  if (!user_id) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    // Get the invitation
    const { data: invitation, error: invitationError } = await supabase
      .from('household_invitations')
      .select('*')
      .eq('id', id)
      .eq('status', 'pending')
      .single();

    if (invitationError || !invitation) {
      return res.status(404).json({ error: 'Invitation not found or has expired' });
    }

    // Check if invitation has expired
    if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
      return res.status(410).json({ error: 'Invitation has expired' });
    }

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from('household_members')
      .select('*')
      .eq('household_id', invitation.household_id)
      .eq('user_id', user_id)
      .single();

    if (existingMember) {
      return res.status(400).json({ error: 'User is already a member of this household' });
    }

    // Add user to household
    const { data: member, error: memberError } = await supabase
      .from('household_members')
      .insert({
        household_id: invitation.household_id,
        user_id: user_id,
        role: invitation.role
      })
      .select()
      .single();

    if (memberError) {
      console.error('Error adding member:', memberError);
      throw memberError;
    }

    // Update invitation status
    const { error: updateError } = await supabase
      .from('household_invitations')
      .update({ status: 'accepted' })
      .eq('id', id);

    if (updateError) {
      console.error('Error updating invitation:', updateError);
      // Don't fail the whole operation if this fails
    }

    res.status(200).json({
      message: 'Invitation accepted successfully',
      member
    });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    res.status(500).json({ 
      error: 'Failed to accept invitation',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 