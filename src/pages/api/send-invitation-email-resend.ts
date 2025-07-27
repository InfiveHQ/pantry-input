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

  const { invitation_id, email, household_name, invitation_url } = req.body;

  if (!invitation_id || !email || !household_name || !invitation_url) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    console.log('Sending invitation email...');
    console.log('RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY);
    console.log('RESEND_API_KEY length:', process.env.RESEND_API_KEY?.length);
    console.log('Email details:', { invitation_id, email, household_name, invitation_url });
    
    // Email content
    const emailContent = `
      <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #f8f9fa; padding: 30px; border-radius: 8px; text-align: center;">
            <h2 style="color: #333; margin-bottom: 20px;">🏠 Household Invitation</h2>
            <p style="color: #666; font-size: 16px; margin-bottom: 20px;">
              You've been invited to join <strong style="color: #333;">${household_name}</strong>!
            </p>
            <p style="color: #666; font-size: 14px; margin-bottom: 30px;">
              Click the button below to accept or decline the invitation:
            </p>
            <a href="${invitation_url}" style="
              display: inline-block;
              padding: 15px 30px;
              background: #28a745;
              color: white;
              text-decoration: none;
              border-radius: 6px;
              font-weight: bold;
              font-size: 16px;
              margin-bottom: 20px;
            ">Accept Invitation</a>
            <p style="color: #666; font-size: 12px; margin-top: 20px;">
              If the button doesn't work, copy and paste this link into your browser:
            </p>
            <p style="color: #007bff; font-size: 12px; word-break: break-all;">
              ${invitation_url}
            </p>
            <p style="color: #666; font-size: 12px; margin-top: 20px;">
              This invitation will expire in 7 days.
            </p>
          </div>
        </body>
      </html>
    `;

    // Send email using Resend
    console.log('Making Resend API call...');
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'onboarding@resend.dev', // Use Resend's sandbox domain for development
        to: email,
        subject: `You're invited to join ${household_name}!`,
        html: emailContent,
      }),
    });
    
    console.log('Resend response status:', resendResponse.status);

    if (!resendResponse.ok) {
      const errorData = await resendResponse.json();
      console.error('Resend API error:', errorData);
      throw new Error(`Failed to send email: ${errorData.message || 'Unknown error'}`);
    }

    // Update invitation status
    const { error: updateError } = await supabase
      .from('household_invitations')
      .update({ 
        status: 'email_sent',
        updated_at: new Date().toISOString()
      })
      .eq('id', invitation_id);

    if (updateError) {
      console.error('Error updating invitation:', updateError);
    }

    res.status(200).json({ 
      message: 'Invitation email sent successfully',
      email_sent: true
    });

  } catch (error) {
    console.error('Error sending invitation email:', error);
    res.status(500).json({ 
      error: 'Failed to send invitation email',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 