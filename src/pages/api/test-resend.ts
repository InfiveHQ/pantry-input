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
    console.log('Testing Resend API...');
    console.log('RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY);
    console.log('RESEND_API_KEY length:', process.env.RESEND_API_KEY?.length);

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
             body: JSON.stringify({
         from: 'onboarding@resend.dev',
         to: testEmail,
         subject: 'Test Email from Pantry App',
         html: '<h1>Test Email</h1><p>This is a test email to verify Resend API is working.</p>',
       }),
    });

    console.log('Resend response status:', resendResponse.status);

    if (!resendResponse.ok) {
      const errorData = await resendResponse.json();
      console.error('Resend API error:', errorData);
      return res.status(500).json({
        error: 'Failed to send test email',
        details: errorData,
        status: resendResponse.status
      });
    }

    const responseData = await resendResponse.json();
    console.log('Resend success response:', responseData);

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