-- FIX PROFILES TABLE STRUCTURE
-- This will update the profiles table to have first_name/last_name instead of full_name

-- 1. Add first_name and last_name columns
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT;

-- 2. Update existing profiles to split full_name into first_name/last_name
UPDATE profiles 
SET 
  first_name = COALESCE(SPLIT_PART(full_name, ' ', 1), ''),
  last_name = COALESCE(SUBSTRING(full_name FROM POSITION(' ' IN full_name) + 1), '')
WHERE full_name IS NOT NULL AND first_name IS NULL;

-- 3. Drop the full_name column
ALTER TABLE profiles DROP COLUMN IF EXISTS full_name;

-- 4. Drop and recreate the function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- 5. Create the function with correct column names
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

-- 6. Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 7. Test the function
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

-- 8. Show final table structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY ordinal_position; 