-- TEMPORARILY DISABLE TRIGGER
-- This will allow signup to work while we fix the trigger issue

-- 1. Disable the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Verify trigger is disabled
SELECT 
    'trigger status' as check_item,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ DISABLED - SIGNUP SHOULD WORK'
        ELSE '❌ STILL ENABLED'
    END as status
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- 3. Test if we can access profiles table
SELECT 
    'profiles accessible' as check_item,
    CASE 
        WHEN EXISTS (SELECT 1 FROM profiles LIMIT 1) THEN '✅ YES'
        ELSE '❌ NO'
    END as status;

-- 4. Show current profiles count
SELECT 
    'profiles count' as check_item,
    COUNT(*) as count
FROM profiles; 