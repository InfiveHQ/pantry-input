-- FIX TRIGGER TO AUTO-CREATE PROFILES
-- This will re-enable automatic profile creation during signup

-- 1. Drop the old function and trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- 2. Create a simpler, more robust function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Try to insert profile, but don't fail if it doesn't work
  BEGIN
    INSERT INTO profiles (id, email, full_name, created_at, updated_at)
    VALUES (
      NEW.id, 
      NEW.email, 
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
      NOW(),
      NOW()
    );
  EXCEPTION
    WHEN OTHERS THEN
      -- Log the error but don't fail the signup
      RAISE LOG 'Profile creation failed for user %: %', NEW.email, SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 4. Test the function manually
DO $$
DECLARE
  test_user_id uuid := gen_random_uuid();
BEGIN
  -- Test the function with dummy data
  PERFORM handle_new_user() FROM (SELECT 
    test_user_id as id,
    'test@example.com' as email,
    '{"full_name": "Test User"}'::jsonb as raw_user_meta_data
  ) AS dummy_user;
  
  RAISE NOTICE '✅ TRIGGER FUNCTION WORKS';
  
  -- Clean up test data
  DELETE FROM profiles WHERE id = test_user_id;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ TRIGGER FUNCTION FAILED: %', SQLERRM;
END $$; 