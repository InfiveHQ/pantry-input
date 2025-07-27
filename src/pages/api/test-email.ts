import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { testEmail } = req.body;

  if (!testEmail) {
    return res.status(400).json({ error: 'Test email is required' });
  }

  try {
    console.log('Testing email functionality...');
    console.log('RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY);
    console.log('RESEND_API_KEY length:', process.env.RESEND_API_KEY?.length);

    // Test the invitation email API
    const invitationUrl = 'http://localhost:3000/accept-invitation?invitation_id=test123';
    
    const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/send-invitation-email-resend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        invitation_id: 'test123',
        email: testEmail,
        household_name: 'Test Household',
        invitation_url: invitationUrl,
      }),
    });

    console.log('Email API response status:', emailResponse.status);

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error('Email API error:', errorText);
      return res.status(500).json({
        error: 'Failed to send test email',
        details: errorText,
        status: emailResponse.status
      });
    }

    const responseData = await emailResponse.json();
    console.log('Email API success response:', responseData);

    res.status(200).json({
      message: 'Test email sent successfully',
      response: responseData
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({
      error: 'Failed to send test email',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 