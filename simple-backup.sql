-- SIMPLE DATABASE BACKUP SCRIPT
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

-- 2. BACKUP RLS STATUS
SELECT 
    '-- BACKUP: RLS STATUS' as backup_comment,
    'ALTER TABLE ' || tablename || ' ENABLE ROW LEVEL SECURITY;' as enable_rls_statement
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'households', 'household_members', 'household_invitations', 'pantry_items', 'shopping_list')
AND rowsecurity = true
ORDER BY tablename;

-- 3. BACKUP RLS POLICIES
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

-- 4. BACKUP CONSTRAINTS
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

-- 5. BACKUP DATA COUNTS (for reference)
SELECT 
    '-- BACKUP: DATA COUNTS' as backup_comment,
    '-- ' || table_name || ': ' || COUNT(*) || ' rows' as data_count
FROM (
    SELECT 'profiles' as table_name, COUNT(*) as count FROM profiles
    UNION ALL
    SELECT 'households' as table_name, COUNT(*) as count FROM households
    UNION ALL
    SELECT 'household_members' as table_name, COUNT(*) as count FROM household_members
    UNION ALL
    SELECT 'household_invitations' as table_name, COUNT(*) as count FROM household_invitations
    UNION ALL
    SELECT 'pantry_items' as table_name, COUNT(*) as count FROM pantry_items
    UNION ALL
    SELECT 'shopping_list' as table_name, COUNT(*) as count FROM shopping_list
) t
GROUP BY table_name, count
ORDER BY table_name;

-- ✅ ALL QUERIES ABOVE ARE READ-ONLY AND SAFE TO RUN
-- ✅ This generates backup SQL statements, doesn't modify anything
-- ✅ Copy the results to save as backup 