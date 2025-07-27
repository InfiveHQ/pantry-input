-- MANUALLY ADD PROFILES FOR USERS
-- This will create profiles for users who signed up but don't have profiles

-- 1. Check how many users are missing profiles
SELECT 
    'users without profiles' as check_item,
    COUNT(*) as count
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- 2. Create profiles for users who don't have them
INSERT INTO profiles (id, email, first_name, last_name, created_at, updated_at)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'first_name', ''),
    COALESCE(au.raw_user_meta_data->>'last_name', ''),
    au.created_at,
    NOW()
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 3. Verify profiles were created
SELECT 
    'profiles created' as check_item,
    COUNT(*) as count
FROM profiles;

-- 4. Show all users and their profile status
SELECT 
    au.email,
    CASE 
        WHEN p.id IS NOT NULL THEN '✅ HAS PROFILE'
        ELSE '❌ NO PROFILE'
    END as profile_status
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
ORDER BY au.created_at DESC; 