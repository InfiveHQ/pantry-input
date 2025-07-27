import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { invitation_id, email, household_name, invitation_url } = await req.json()

    if (!invitation_id || !email || !household_name || !invitation_url) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

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
    `

    // Send email using Supabase's built-in email functionality
    // Note: This requires setting up email templates in Supabase dashboard
    const { data, error } = await supabaseClient.auth.admin.sendRawEmail({
      to: email,
      subject: `You're invited to join ${household_name}!`,
      html: emailContent,
    })

    if (error) {
      console.error('Error sending email:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to send email', details: error.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Update invitation status
    const { error: updateError } = await supabaseClient
      .from('household_invitations')
      .update({ 
        status: 'email_sent',
        updated_at: new Date().toISOString()
      })
      .eq('id', invitation_id)

    if (updateError) {
      console.error('Error updating invitation:', updateError)
    }

    return new Response(
      JSON.stringify({ 
        message: 'Invitation email sent successfully',
        email_sent: true
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in send-invitation-email function:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}) 