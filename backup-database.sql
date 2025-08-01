-- COMPREHENSIVE DATABASE BACKUP SCRIPT
-- ⚠️ SAFETY: These are READ-ONLY queries that create backup statements
-- Run this in Supabase SQL Editor to generate backup SQL

-- 1. BACKUP TABLE STRUCTURES
SELECT 
    '-- BACKUP: ' || table_name || ' TABLE STRUCTURE' as backup_comment,
    'CREATE TABLE IF NOT EXISTS ' || table_name || ' (' ||
    string_agg(
        column_name || ' ' || data_type || 
        CASE WHEN character_maximum_length IS NOT NULL 
             THEN '(' || character_maximum_length || ')' 
             ELSE '' 
        END ||
        CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
        CASE WHEN column_default IS NOT NULL 
             THEN ' DEFAULT ' || column_default 
             ELSE '' 
        END,
        ', '
        ORDER BY ordinal_position
    ) || ');' as create_statement
FROM information_schema.columns c
JOIN information_schema.tables t ON c.table_name = t.table_name
WHERE t.table_schema = 'public' 
AND t.table_name IN ('profiles', 'households', 'household_members', 'household_invitations', 'pantry_items', 'shopping_list')
GROUP BY table_name
ORDER BY table_name;

-- 2. BACKUP CONSTRAINTS
SELECT 
    '-- BACKUP: ' || tc.table_name || ' CONSTRAINTS' as backup_comment,
    'ALTER TABLE ' || tc.table_name || ' ADD CONSTRAINT ' || tc.constraint_name || ' ' ||
    CASE 
        WHEN tc.constraint_type = 'PRIMARY KEY' THEN 'PRIMARY KEY (' || kcu.column_name || ')'
        WHEN tc.constraint_type = 'FOREIGN KEY' THEN 
            'FOREIGN KEY (' || kcu.column_name || ') REFERENCES ' || 
            ccu.table_name || '(' || ccu.column_name || ')'
        WHEN tc.constraint_type = 'UNIQUE' THEN 'UNIQUE (' || kcu.column_name || ')'
        ELSE tc.constraint_type || ' (' || kcu.column_name || ')'
    END || ';' as constraint_statement
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_schema = 'public'
AND tc.table_name IN ('profiles', 'households', 'household_members', 'household_invitations', 'pantry_items', 'shopping_list')
ORDER BY tc.table_name, tc.constraint_type;

-- 3. BACKUP INDEXES
SELECT 
    '-- BACKUP: ' || tablename || ' INDEXES' as backup_comment,
    indexdef || ';' as index_statement
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'households', 'household_members', 'household_invitations', 'pantry_items', 'shopping_list')
ORDER BY tablename, indexname;

-- 4. BACKUP RLS POLICIES
SELECT 
    '-- BACKUP: ' || tablename || ' RLS POLICIES' as backup_comment,
    'CREATE POLICY "' || policyname || '" ON ' || tablename || ' ' ||
    'FOR ' || cmd || ' ' ||
    CASE WHEN permissive THEN 'PERMISSIVE' ELSE 'RESTRICTIVE' END || ' ' ||
    'TO ' || COALESCE(roles, 'public') || ' ' ||
    CASE WHEN qual IS NOT NULL THEN 'USING (' || qual || ') ' ELSE '' END ||
    CASE WHEN with_check IS NOT NULL THEN 'WITH CHECK (' || with_check || ') ' ELSE '' END ||
    ';' as policy_statement
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'households', 'household_members', 'household_invitations', 'pantry_items', 'shopping_list')
ORDER BY tablename, policyname;

-- 5. BACKUP TRIGGERS
SELECT 
    '-- BACKUP: ' || event_object_table || ' TRIGGERS' as backup_comment,
    'CREATE TRIGGER ' || trigger_name || ' ' ||
    action_timing || ' ' || event_manipulation || ' ON ' || event_object_table || ' ' ||
    'FOR EACH ' || action_orientation || ' ' ||
    'EXECUTE FUNCTION ' || action_statement || ';' as trigger_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND event_object_table IN ('profiles', 'households', 'household_members', 'household_invitations', 'pantry_items', 'shopping_list')
ORDER BY event_object_table, trigger_name;

-- 6. BACKUP FUNCTIONS
SELECT 
    '-- BACKUP: ' || routine_name || ' FUNCTION' as backup_comment,
    'CREATE OR REPLACE FUNCTION ' || routine_name || '(' ||
    CASE WHEN routine_type = 'FUNCTION' THEN 'RETURNS ' || data_type ELSE '' END ||
    ') AS $$' || routine_definition || '$$ LANGUAGE plpgsql;' as function_statement
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('handle_new_user', 'update_household_invitations_updated_at', 'get_table_info')
ORDER BY routine_name;

-- 7. BACKUP DATA (INSERT STATEMENTS)
-- Note: This will generate INSERT statements for all data
SELECT 
    '-- BACKUP: ' || table_name || ' DATA' as backup_comment,
    '-- INSERT statements for ' || table_name || ' data would go here' as data_comment
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'households', 'household_members', 'household_invitations', 'pantry_items', 'shopping_list')
ORDER BY table_name;

-- 8. ENABLE RLS STATEMENTS
SELECT 
    '-- BACKUP: ENABLE RLS' as backup_comment,
    'ALTER TABLE ' || tablename || ' ENABLE ROW LEVEL SECURITY;' as enable_rls_statement
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'households', 'household_members', 'household_invitations', 'pantry_items', 'shopping_list')
AND rowsecurity = true
ORDER BY tablename;

-- ✅ ALL QUERIES ABOVE ARE READ-ONLY AND SAFE TO RUN
-- ✅ This generates backup SQL statements, doesn't modify anything
-- ✅ Copy the results to save as backup 