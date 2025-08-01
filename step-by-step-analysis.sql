-- STEP-BY-STEP DATABASE ANALYSIS QUERIES
-- ⚠️ SAFETY: These are READ-ONLY queries only - no data will be modified or deleted
-- Run these queries one by one in your Supabase SQL Editor

-- QUERY 1: Check which tables exist
SELECT 
    table_name,
    'Table exists' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'households', 'household_members', 'household_invitations', 'pantry_items', 'shopping_list')
ORDER BY table_name;

-- QUERY 2: Get complete table structure
SELECT 
    t.table_name,
    c.column_name,
    c.data_type,
    c.character_maximum_length,
    c.is_nullable,
    c.column_default,
    c.ordinal_position
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name
WHERE t.table_schema = 'public' 
AND t.table_name IN ('profiles', 'households', 'household_members', 'household_invitations', 'pantry_items', 'shopping_list')
ORDER BY t.table_name, c.ordinal_position;

-- QUERY 3: Check RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE WHEN rowsecurity THEN 'ENABLED' ELSE 'DISABLED' END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'households', 'household_members', 'household_invitations', 'pantry_items', 'shopping_list')
ORDER BY tablename;

-- QUERY 4: List all RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'households', 'household_members', 'household_invitations', 'pantry_items', 'shopping_list')
ORDER BY tablename, policyname;

-- QUERY 5: Get all constraints
SELECT 
    tc.table_name,
    kcu.column_name,
    tc.constraint_type,
    tc.constraint_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_schema = 'public'
AND tc.table_name IN ('profiles', 'households', 'household_members', 'household_invitations', 'pantry_items', 'shopping_list')
ORDER BY tc.table_name, kcu.column_name;

-- QUERY 6: Get all indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'households', 'household_members', 'household_invitations', 'pantry_items', 'shopping_list')
ORDER BY tablename, indexname;

-- QUERY 7: Get all triggers
SELECT 
    trigger_schema,
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND event_object_table IN ('profiles', 'households', 'household_members', 'household_invitations', 'pantry_items', 'shopping_list')
ORDER BY event_object_table, trigger_name;

-- QUERY 8: Get all functions
SELECT 
    routine_schema,
    routine_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('handle_new_user', 'update_household_invitations_updated_at', 'get_table_info')
ORDER BY routine_name;

-- QUERY 9: Count rows in each table
SELECT 
    'profiles' as table_name,
    COUNT(*) as row_count
FROM profiles
UNION ALL
SELECT 
    'households' as table_name,
    COUNT(*) as row_count
FROM households
UNION ALL
SELECT 
    'household_members' as table_name,
    COUNT(*) as row_count
FROM household_members
UNION ALL
SELECT 
    'household_invitations' as table_name,
    COUNT(*) as row_count
FROM household_invitations
UNION ALL
SELECT 
    'pantry_items' as table_name,
    COUNT(*) as row_count
FROM pantry_items
UNION ALL
SELECT 
    'shopping_list' as table_name,
    COUNT(*) as row_count
FROM shopping_list;

-- QUERY 10: Test RLS policies
SELECT 'Testing RLS for profiles' as test, COUNT(*) as visible_rows FROM profiles
UNION ALL
SELECT 'Testing RLS for households' as test, COUNT(*) as visible_rows FROM households
UNION ALL
SELECT 'Testing RLS for household_members' as test, COUNT(*) as visible_rows FROM household_members
UNION ALL
SELECT 'Testing RLS for household_invitations' as test, COUNT(*) as visible_rows FROM household_invitations
UNION ALL
SELECT 'Testing RLS for pantry_items' as test, COUNT(*) as visible_rows FROM pantry_items
UNION ALL
SELECT 'Testing RLS for shopping_list' as test, COUNT(*) as visible_rows FROM shopping_list;

-- ✅ ALL QUERIES ABOVE ARE READ-ONLY AND SAFE TO RUN
-- ✅ NO DATA WILL BE MODIFIED, DELETED, OR CHANGED
-- ✅ Run these queries one by one to avoid syntax errors 