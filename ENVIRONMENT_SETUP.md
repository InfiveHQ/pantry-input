# Environment Setup Guide

## Quick Fix for Signup and Multi-User Issues

### 1. Environment Variables Setup

Create a `.env.local` file in your project root with the following variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Optional: Notion Integration (if using)
NOTION_API_KEY=your_notion_api_key
NOTION_DATABASE_ID=your_notion_database_id
```

### 2. Get Your Supabase Credentials

1. Go to your Supabase project dashboard
2. Navigate to Settings > API
3. Copy the following values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_KEY`
   - **service_role secret** → `SUPABASE_SERVICE_ROLE_KEY`

### 3. Database Setup

Run the complete database setup script in your Supabase SQL Editor:

```sql
-- Copy and paste the contents of database-setup-complete.sql
-- This will create all necessary tables, policies, and functions
```

### 4. Verify Database Setup

Run the diagnostic script to check if everything is set up correctly:

```sql
-- Copy and paste the contents of comprehensive-diagnostic.sql
-- This will show you what's missing or incorrectly configured
```

### 5. Common Issues and Solutions

#### Issue: "Missing Supabase environment variables"
**Solution**: Make sure your `.env.local` file exists and has the correct values.

#### Issue: "Database tables may not exist"
**Solution**: Run the `database-setup-complete.sql` script in your Supabase SQL Editor.

#### Issue: "Email not confirmed"
**Solution**: 
1. Check your email for the confirmation link
2. Click the link to confirm your account
3. Then try signing in again

#### Issue: "Invalid login credentials"
**Solution**: 
1. Make sure you're using the correct email/password
2. If you just signed up, check your email for confirmation
3. Try resetting your password if needed

#### Issue: "User already registered"
**Solution**: Use the "Sign In" option instead of "Sign Up" for existing accounts.

### 6. Testing the Setup

1. **Test Signup**:
   - Go to `/login`
   - Click "Need an account? Sign Up"
   - Enter email and password (min 6 characters)
   - Check your email for confirmation

2. **Test Multi-User**:
   - Create a household
   - Invite another user by email
   - The invited user should receive an email invitation

### 7. Troubleshooting

If you're still having issues:

1. **Check Browser Console**: Look for error messages in the browser's developer tools
2. **Check Network Tab**: See if API calls are failing
3. **Check Supabase Logs**: Go to your Supabase dashboard > Logs
4. **Run Diagnostic**: Use the `comprehensive-diagnostic.sql` script

### 8. Development vs Production

For development, you can disable email confirmation in Supabase:
1. Go to Authentication > Settings
2. Disable "Enable email confirmations"
3. This will allow immediate signup without email confirmation

**Note**: Only disable email confirmation for development/testing purposes.

### 9. Security Notes

- Never commit your `.env.local` file to version control
- Keep your service role key secret
- Use environment variables for all sensitive configuration
- Regularly rotate your API keys

### 10. Next Steps

After setting up the environment:
1. Test signup functionality
2. Test multi-user household creation
3. Test member invitations
4. Test pantry item sharing between household members

If you encounter any specific errors, check the browser console and Supabase logs for detailed error messages. 