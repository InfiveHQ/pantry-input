-- DATABASE ANALYSIS QUERIES FOR PANTRY APPLICATION
-- ⚠️ SAFETY: These are READ-ONLY queries only - no data will be modified or deleted
-- Run these queries in your Supabase SQL Editor to understand current state

-- 1. Check if tables exist and their structure (READ-ONLY)
SELECT 
    table_name,
    'Table exists' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'households', 'household_members', 'household_invitations', 'pantry_items', 'shopping_list')
ORDER BY table_name;

-- 2. Get detailed table structure for all relevant tables (READ-ONLY)
SELECT 
    t.table_name,
    c.column_name,
    c.data_type,
    c.is_nullable,
    c.column_default,
    CASE 
        WHEN tc.constraint_type = 'PRIMARY KEY' THEN 'PRIMARY KEY'
        WHEN tc.constraint_type = 'FOREIGN KEY' THEN 'FOREIGN KEY'
        ELSE ''
    END as constraint_type,
    CASE 
        WHEN tc.constraint_type = 'FOREIGN KEY' THEN
            (SELECT table_name FROM information_schema.table_constraints 
             WHERE constraint_name = tc.constraint_name)
        ELSE ''
    END as references_table
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name
LEFT JOIN information_schema.key_column_usage kcu ON c.table_name = kcu.table_name AND c.column_name = kcu.column_name
LEFT JOIN information_schema.table_constraints tc ON kcu.constraint_name = tc.constraint_name
WHERE t.table_schema = 'public' 
AND t.table_name IN ('profiles', 'households', 'household_members', 'household_invitations', 'pantry_items', 'shopping_list')
ORDER BY t.table_name, c.ordinal_position;

-- 3. Check RLS status for all tables (READ-ONLY)
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'households', 'household_members', 'household_invitations', 'pantry_items', 'shopping_list')
ORDER BY tablename;

-- 4. List all RLS policies (READ-ONLY)
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

-- 5. Check for any data in tables (READ-ONLY - just counting rows)
-- Using CASE statements to handle missing tables gracefully
SELECT 
    'profiles' as table_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') 
        THEN (SELECT COUNT(*) FROM profiles)
        ELSE 0
    END as row_count
UNION ALL
SELECT 
    'households' as table_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'households') 
        THEN (SELECT COUNT(*) FROM households)
        ELSE 0
    END as row_count
UNION ALL
SELECT 
    'household_members' as table_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'household_members') 
        THEN (SELECT COUNT(*) FROM household_members)
        ELSE 0
    END as row_count
UNION ALL
SELECT 
    'household_invitations' as table_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'household_invitations') 
        THEN (SELECT COUNT(*) FROM household_invitations)
        ELSE 0
    END as row_count
UNION ALL
SELECT 
    'pantry_items' as table_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pantry_items') 
        THEN (SELECT COUNT(*) FROM pantry_items)
        ELSE 0
    END as row_count
UNION ALL
SELECT 
    'shopping_list' as table_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'shopping_list') 
        THEN (SELECT COUNT(*) FROM shopping_list)
        ELSE 0
    END as row_count;

-- 6. Check for any indexes (READ-ONLY)
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'households', 'household_members', 'household_invitations', 'pantry_items', 'shopping_list')
ORDER BY tablename, indexname;

-- 7. Check for triggers (READ-ONLY)
SELECT 
    trigger_schema,
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND event_object_table IN ('profiles', 'households', 'household_members', 'household_invitations', 'pantry_items', 'shopping_list')
ORDER BY event_object_table, trigger_name;

-- 8. Check for functions (READ-ONLY)
SELECT 
    routine_schema,
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('handle_new_user', 'update_household_invitations_updated_at', 'get_table_info')
ORDER BY routine_name;

-- 9. Test RLS policies (READ-ONLY - just counting visible rows)
-- This will show what data is visible to the current user
SELECT 'Testing RLS for profiles' as test, 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') 
        THEN (SELECT COUNT(*) FROM profiles)
        ELSE 0
    END as visible_rows
UNION ALL
SELECT 'Testing RLS for households' as test, 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'households') 
        THEN (SELECT COUNT(*) FROM households)
        ELSE 0
    END as visible_rows
UNION ALL
SELECT 'Testing RLS for household_members' as test, 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'household_members') 
        THEN (SELECT COUNT(*) FROM household_members)
        ELSE 0
    END as visible_rows
UNION ALL
SELECT 'Testing RLS for household_invitations' as test, 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'household_invitations') 
        THEN (SELECT COUNT(*) FROM household_invitations)
        ELSE 0
    END as visible_rows
UNION ALL
SELECT 'Testing RLS for pantry_items' as test, 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pantry_items') 
        THEN (SELECT COUNT(*) FROM pantry_items)
        ELSE 0
    END as visible_rows
UNION ALL
SELECT 'Testing RLS for shopping_list' as test, 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'shopping_list') 
        THEN (SELECT COUNT(*) FROM shopping_list)
        ELSE 0
    END as visible_rows;

-- 10. Check for any constraint violations or issues (READ-ONLY)
SELECT 
    'Foreign key constraints' as check_type,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_schema = 'public'
AND tc.table_name IN ('profiles', 'households', 'household_members', 'household_invitations', 'pantry_items', 'shopping_list')
ORDER BY tc.table_name, kcu.column_name;

-- ✅ ALL QUERIES ABOVE ARE READ-ONLY AND SAFE TO RUN
-- ✅ NO DATA WILL BE MODIFIED, DELETED, OR CHANGED
-- ✅ These queries only analyze your database structure and count rows 