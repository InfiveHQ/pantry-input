import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // Get household members
    const { household_id } = req.query;
    
    if (!household_id) {
      return res.status(400).json({ error: 'Household ID is required' });
    }

    try {
      const { data: members, error } = await supabase
        .from('household_members')
        .select(`
          *,
          profiles:user_id(email, full_name)
        `)
        .eq('household_id', household_id);

      if (error) throw error;

      res.status(200).json(members);
    } catch (error) {
      console.error('Error fetching members:', error);
      res.status(500).json({ error: 'Failed to fetch members' });
    }
  } else if (req.method === 'POST') {
    // Invite member to household
    const { household_id, user_email, role = 'member', invited_by } = req.body;

    if (!household_id || !user_email) {
      return res.status(400).json({ error: 'Household ID and user email are required' });
    }

    try {
      // First, try to find the user by email in the profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', user_email)
        .single();

      if (profileError || !profile) {
        // User doesn't exist yet - create a pending invitation
        
        // First, get the household name and inviter info
        const { data: household, error: householdError } = await supabase
          .from('households')
          .select('name, owner_id')
          .eq('id', household_id)
          .single();

        if (householdError || !household) {
          return res.status(404).json({ error: 'Household not found' });
        }

        // Check if the inviter is the household owner
        if (household.owner_id !== invited_by) {
          return res.status(403).json({ error: 'Only household owners can invite members' });
        }

        const { data: invitation, error: invitationError } = await supabase
          .from('household_invitations')
          .insert({
            household_id,
            email: user_email,
            role,
            status: 'pending',
            invited_by: invited_by
          })
          .select()
          .single();

        if (invitationError) throw invitationError;

        // Send invitation email using the dedicated email API
        try {
          const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/accept-invitation?invitation_id=${invitation.id}`;
          
          const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/send-invitation-email-resend`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              invitation_id: invitation.id,
              email: user_email,
              household_name: household.name,
              invitation_url: invitationUrl,
            }),
          });

          if (!emailResponse.ok) {
            console.error('Email sending failed:', await emailResponse.text());
            // Still return success but note that email wasn't sent
            res.status(201).json({
              message: 'Invitation created but email sending failed',
              invitation_id: invitation.id,
              email: user_email,
              status: 'pending',
              note: 'Email sending failed. You may need to manually share the invitation link.'
            });
          } else {
            res.status(201).json({
              message: 'Invitation sent successfully',
              invitation_id: invitation.id,
              email: user_email,
              status: 'pending',
              email_sent: true
            });
          }
        } catch (emailError) {
          console.error('Error sending invitation email:', emailError);
          res.status(201).json({
            message: 'Invitation created but email sending failed',
            invitation_id: invitation.id,
            email: user_email,
            status: 'pending',
            note: 'Email sending failed. You may need to manually share the invitation link.'
          });
        }
        return;
      }

      // User exists - check if already a member
      const { data: existingMember } = await supabase
        .from('household_members')
        .select('*')
        .eq('household_id', household_id)
        .eq('user_id', profile.id)
        .single();

      if (existingMember) {
        return res.status(400).json({ error: 'User is already a member of this household' });
      }

      // Get household info for the response
      const { data: household, error: householdError } = await supabase
        .from('households')
        .select('name')
        .eq('id', household_id)
        .single();

      if (householdError || !household) {
        return res.status(404).json({ error: 'Household not found' });
      }

      // Add member
      const { data: member, error: memberError } = await supabase
        .from('household_members')
        .insert({
          household_id,
          user_id: profile.id,
          role
        })
        .select()
        .single();

      if (memberError) throw memberError;

      res.status(201).json({
        message: 'Member added successfully',
        member,
        user_email,
        household_name: household.name,
        status: 'added'
      });
    } catch (error) {
      console.error('Error adding member:', error);
      res.status(500).json({ 
        error: 'Failed to add member',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  } else if (req.method === 'DELETE') {
    // Remove member from household
    const { household_id, user_id } = req.query;

    if (!household_id || !user_id) {
      return res.status(400).json({ error: 'Household ID and user ID are required' });
    }

    try {
      const { error } = await supabase
        .from('household_members')
        .delete()
        .eq('household_id', household_id)
        .eq('user_id', user_id);

      if (error) throw error;

      res.status(200).json({ message: 'Member removed successfully' });
    } catch (error) {
      console.error('Error removing member:', error);
      res.status(500).json({ error: 'Failed to remove member' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
} 