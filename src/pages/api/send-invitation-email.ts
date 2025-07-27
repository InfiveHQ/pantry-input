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
    // For now, we'll use a simple approach with a public email service
    // In production, you'd use SendGrid, Resend, or similar
    
    const emailContent = `
      <html>
        <body>
          <h2>🏠 Household Invitation</h2>
          <p>You've been invited to join <strong>${household_name}</strong>!</p>
          <p>Click the link below to accept or decline the invitation:</p>
          <a href="${invitation_url}" style="
            display: inline-block;
            padding: 12px 24px;
            background: #28a745;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            font-weight: bold;
          ">Accept Invitation</a>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p>${invitation_url}</p>
          <p>This invitation will expire in 7 days.</p>
        </body>
      </html>
    `;

    // For now, just log the email content
    // In production, you'd send this via an email service
    console.log('📧 Email would be sent to:', email);
    console.log('📧 Email content:', emailContent);

    // Update the invitation to mark that email was sent
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
      message: 'Invitation email prepared',
      note: 'Email content logged to console. In production, this would be sent via email service.'
    });

  } catch (error) {
    console.error('Error sending invitation email:', error);
    res.status(500).json({ 
      error: 'Failed to send invitation email',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 