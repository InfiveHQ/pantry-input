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

  const { invitation_id, email, password, full_name } = req.body;

  if (!invitation_id || !email || !password || !full_name) {
    return res.status(400).json({ 
      error: 'Invitation ID, email, password, and full name are required' 
    });
  }

  try {
    // Check if invitation exists and is valid
    const { data: invitation, error: invitationError } = await supabase
      .from('household_invitations')
      .select(`
        *,
        households(name)
      `)
      .eq('id', invitation_id)
      .eq('email', email)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .single();

    if (invitationError || !invitation) {
      return res.status(404).json({ 
        error: 'Invitation not found, expired, or already used' 
      });
    }

    // Create the user account
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name }
    });

    if (authError) {
      return res.status(400).json({ 
        error: 'Failed to create user account',
        details: authError.message 
      });
    }

    const userId = authData.user.id;

    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email,
        full_name
      });

    if (profileError) {
      // Clean up the created user if profile creation fails
      await supabase.auth.admin.deleteUser(userId);
      return res.status(500).json({ 
        error: 'Failed to create user profile',
        details: profileError.message 
      });
    }

    // Add user to household
    const { error: memberError } = await supabase
      .from('household_members')
      .insert({
        household_id: invitation.household_id,
        user_id: userId,
        role: invitation.role
      });

    if (memberError) {
      // Clean up if adding to household fails
      await supabase.auth.admin.deleteUser(userId);
      return res.status(500).json({ 
        error: 'Failed to add user to household',
        details: memberError.message 
      });
    }

    // Update invitation status
    const { error: updateError } = await supabase
      .from('household_invitations')
      .update({ status: 'accepted' })
      .eq('id', invitation_id);

    if (updateError) {
      console.error('Failed to update invitation status:', updateError);
    }

    res.status(200).json({
      message: 'Account created and invitation accepted successfully',
      household_name: invitation.households.name,
      user_id: userId
    });

  } catch (error) {
    console.error('Error accepting invitation:', error);
    res.status(500).json({ 
      error: 'Failed to accept invitation',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 