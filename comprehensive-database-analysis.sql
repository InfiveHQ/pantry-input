-- COMPREHENSIVE DATABASE ANALYSIS QUERIES
-- ⚠️ SAFETY: These are READ-ONLY queries only - no data will be modified or deleted
-- Run these queries in your Supabase SQL Editor to get complete database information

-- 1. COMPLETE TABLE STRUCTURE - All columns with details
SELECT 
    t.table_name,
    c.column_name,
    c.data_type,
    c.character_maximum_length,
    c.is_nullable,
    c.column_default,
    c.ordinal_position,
    CASE 
        WHEN tc.constraint_type = 'PRIMARY KEY' THEN 'PRIMARY KEY'
        WHEN tc.constraint_type = 'FOREIGN KEY' THEN 'FOREIGN KEY'
        WHEN tc.constraint_type = 'UNIQUE' THEN 'UNIQUE'
        ELSE ''
    END as constraint_type,
    CASE 
        WHEN tc.constraint_type = 'FOREIGN KEY' THEN
            (SELECT table_name FROM information_schema.table_constraints 
             WHERE constraint_name = tc.constraint_name)
        ELSE ''
    END as references_table,
    CASE 
        WHEN tc.constraint_type = 'FOREIGN KEY' THEN
            (SELECT column_name FROM information_schema.key_column_usage 
             WHERE constraint_name = tc.constraint_name AND table_name = 
                (SELECT table_name FROM information_schema.table_constraints 
                 WHERE constraint_name = tc.constraint_name))
        ELSE ''
    END as references_column
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name
LEFT JOIN information_schema.key_column_usage kcu ON c.table_name = kcu.table_name AND c.column_name = kcu.column_name
LEFT JOIN information_schema.table_constraints tc ON kcu.constraint_name = tc.constraint_name
WHERE t.table_schema = 'public' 
AND t.table_name IN ('profiles', 'households', 'household_members', 'household_invitations', 'pantry_items', 'shopping_list')
ORDER BY t.table_name, c.ordinal_position;

-- 2. RLS STATUS - Which tables have RLS enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE WHEN rowsecurity THEN 'ENABLED' ELSE 'DISABLED' END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'households', 'household_members', 'household_invitations', 'pantry_items', 'shopping_list')
ORDER BY tablename;

-- 3. ALL RLS POLICIES - Complete policy information
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check,
    CASE 
        WHEN cmd = 'SELECT' THEN 'READ'
        WHEN cmd = 'INSERT' THEN 'CREATE'
        WHEN cmd = 'UPDATE' THEN 'UPDATE'
        WHEN cmd = 'DELETE' THEN 'DELETE'
        WHEN cmd = 'ALL' THEN 'ALL OPERATIONS'
        ELSE cmd
    END as operation_type
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'households', 'household_members', 'household_invitations', 'pantry_items', 'shopping_list')
ORDER BY tablename, policyname;

-- 4. ALL CONSTRAINTS - Primary keys, foreign keys, unique constraints
SELECT 
    tc.table_name,
    kcu.column_name,
    tc.constraint_type,
    tc.constraint_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.update_rule,
    rc.delete_rule
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
LEFT JOIN information_schema.referential_constraints rc 
    ON tc.constraint_name = rc.constraint_name
WHERE tc.table_schema = 'public'
AND tc.table_name IN ('profiles', 'households', 'household_members', 'household_invitations', 'pantry_items', 'shopping_list')
ORDER BY tc.table_name, kcu.column_name;

-- 5. INDEXES - All indexes on tables
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef,
    CASE WHEN indisunique THEN 'UNIQUE' ELSE 'NON-UNIQUE' END as index_type
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'households', 'household_members', 'household_invitations', 'pantry_items', 'shopping_list')
ORDER BY tablename, indexname;

-- 6. TRIGGERS - All triggers on tables
SELECT 
    trigger_schema,
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing,
    action_statement,
    action_orientation
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND event_object_table IN ('profiles', 'households', 'household_members', 'household_invitations', 'pantry_items', 'shopping_list')
ORDER BY event_object_table, trigger_name;

-- 7. FUNCTIONS - All functions
SELECT 
    routine_schema,
    routine_name,
    routine_type,
    data_type as return_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('handle_new_user', 'update_household_invitations_updated_at', 'get_table_info')
ORDER BY routine_name;

-- 8. DATA COUNTS - Row counts for all tables
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

-- 9. RLS TESTING - What data is visible to current user
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

-- 10. SAMPLE DATA - First few rows from each table (for understanding structure)
SELECT 'profiles' as table_name, json_agg(row_to_json(t)) as sample_data
FROM (SELECT * FROM profiles LIMIT 3) t
UNION ALL
SELECT 'households' as table_name, json_agg(row_to_json(t)) as sample_data
FROM (SELECT * FROM households LIMIT 3) t
UNION ALL
SELECT 'household_members' as table_name, json_agg(row_to_json(t)) as sample_data
FROM (SELECT * FROM household_members LIMIT 3) t
UNION ALL
SELECT 'household_invitations' as table_name, json_agg(row_to_json(t)) as sample_data
FROM (SELECT * FROM household_invitations LIMIT 3) t
UNION ALL
SELECT 'pantry_items' as table_name, json_agg(row_to_json(t)) as sample_data
FROM (SELECT * FROM pantry_items LIMIT 3) t
UNION ALL
SELECT 'shopping_list' as table_name, json_agg(row_to_json(t)) as sample_data
FROM (SELECT * FROM shopping_list LIMIT 3) t;

-- ✅ ALL QUERIES ABOVE ARE READ-ONLY AND SAFE TO RUN
-- ✅ NO DATA WILL BE MODIFIED, DELETED, OR CHANGED
-- ✅ These queries provide comprehensive database analysis 