-- Clean up existing invitations for testing
-- This will delete all pending invitations for the specified email

-- Option 1: Delete all pending invitations for a specific email
DELETE FROM household_invitations 
WHERE email = 'bwongsy@yahoo.co.uk' 
AND status = 'pending';

-- Option 2: Delete all pending invitations (use this if you want to start fresh)
-- DELETE FROM household_invitations WHERE status = 'pending';

-- Option 3: Update existing invitations to 'declined' instead of deleting
-- UPDATE household_invitations 
-- SET status = 'declined' 
-- WHERE email = 'bwongsy@yahoo.co.uk' 
-- AND status = 'pending';

-- Check what invitations exist
SELECT 
    id,
    household_id,
    email,
    status,
    created_at,
    expires_at
FROM household_invitations 
ORDER BY created_at DESC; 