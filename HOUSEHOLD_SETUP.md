# Household Setup Guide

This guide will help you set up the multi-user household functionality for your pantry application.

## Database Setup

1. **Run the SQL script** in your Supabase database:
   - Go to your Supabase dashboard
   - Navigate to the SQL Editor
   - Copy and paste the contents of `database-setup.sql`
   - Execute the script

## Environment Variables

Add these environment variables to your `.env.local` file:

```env
# Existing variables
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_KEY=your_supabase_anon_key

# New variable for server-side operations
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Features Implemented

### 1. Household Management
- ✅ Create new households
- ✅ View all households you're a member of
- ✅ See household details and member count

### 2. Member Management
- ✅ Invite users by email to households
- ✅ View household members
- ✅ Role-based permissions (owner/member)

### 3. Security
- ✅ Row Level Security (RLS) policies
- ✅ Only household owners can invite/remove members
- ✅ Users can only see households they belong to

### 4. User Interface
- ✅ Modern, responsive design
- ✅ Error handling and user feedback
- ✅ Member list with roles
- ✅ Invitation modal

## API Endpoints

### `/api/households`
- `GET /api/households?user_id=<id>` - Get user's households
- `POST /api/households` - Create new household

### `/api/household-members`
- `GET /api/household-members?household_id=<id>` - Get household members
- `POST /api/household-members` - Invite member
- `DELETE /api/household-members?household_id=<id>&user_id=<id>` - Remove member

## Database Schema

### Tables Created:
1. **households** - Stores household information
2. **household_members** - Links users to households with roles
3. **profiles** - User profile information

### Key Features:
- UUID primary keys for security
- Foreign key constraints with CASCADE deletes
- Unique constraints to prevent duplicate memberships
- Automatic timestamps
- Row Level Security policies

## Usage

1. **Create a Household:**
   - Navigate to `/households`
   - Click "Create Household"
   - Enter household name
   - Submit form

2. **Invite Members:**
   - Click "Invite Member" on any household you own
   - Enter the email address
   - Submit invitation

3. **View Members:**
   - Click "View Members" on any household
   - See all members with their roles

## Next Steps

To complete the multi-user functionality, you'll need to:

1. **Update pantry items** to be associated with households
2. **Add household selection** to the product form
3. **Filter inventory** by household
4. **Add household switching** functionality
5. **Implement real-time updates** for shared pantries

## Troubleshooting

### Common Issues:

1. **"User not found" error when inviting:**
   - Make sure the user has signed up for the application
   - Check that the email address is correct

2. **Permission denied errors:**
   - Ensure RLS policies are properly set up
   - Check that the service role key is configured

3. **Households not showing:**
   - Verify the user is properly authenticated
   - Check that the user is a member of households

### Debug Steps:
1. Check browser console for errors
2. Verify environment variables are set
3. Test API endpoints directly
4. Check Supabase logs for database errors 