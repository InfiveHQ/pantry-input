-- SIMPLE TRIGGER FIX
-- This should work in Supabase SQL Editor

-- 1. Check current trigger status
SELECT 
    'current trigger status' as check_item,
    CASE 
        WHEN COUNT(*) > 0 THEN 'EXISTS'
        ELSE 'DOES NOT EXIST'
    END as status
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- 2. Drop function first (if it exists)
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- 3. Create the function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, first_name, last_name, created_at, updated_at)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    NOW(),
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 5. Verify it was created
SELECT 
    'trigger created' as check_item,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ SUCCESS'
        ELSE '❌ FAILED'
    END as status
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created'; 