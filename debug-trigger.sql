-- DEBUG TRIGGER ISSUE
-- This will check what's wrong with the trigger and fix it

-- 1. Check if trigger exists
SELECT 
    'trigger exists' as check_item,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ YES'
        ELSE '❌ NO'
    END as status
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- 2. Check if function exists
SELECT 
    'function exists' as check_item,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ YES'
        ELSE '❌ NO'
    END as status
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- 3. Drop everything and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- 4. Create a very simple function
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

-- 5. Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 6. Test the function manually
DO $$
DECLARE
  test_user_id uuid := gen_random_uuid();
BEGIN
  -- Test the function with dummy data
  PERFORM handle_new_user() FROM (SELECT 
    test_user_id as id,
    'test@example.com' as email,
    '{"first_name": "John", "last_name": "Doe"}'::jsonb as raw_user_meta_data
  ) AS dummy_user;
  
  RAISE NOTICE '✅ FUNCTION WORKS - Test profile created';
  
  -- Show the test profile
  SELECT 'test profile created' as result, id, email, first_name, last_name 
  FROM profiles WHERE id = test_user_id;
  
  -- Clean up test data
  DELETE FROM profiles WHERE id = test_user_id;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ FUNCTION FAILED: %', SQLERRM;
END $$;

-- 7. Check profiles table structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY ordinal_position; 