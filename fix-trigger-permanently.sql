-- FIX TRIGGER PERMANENTLY
-- This will create a working trigger that automatically creates profiles

-- 1. Drop everything first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- 2. Create a very simple, robust function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Simple insert with error handling
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
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail signup
    RAISE LOG 'Profile creation failed for user %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 4. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON profiles TO authenticated;

-- 5. Test the trigger with a dummy user
DO $$
DECLARE
  test_user_id uuid := gen_random_uuid();
BEGIN
  -- Simulate a user signup
  INSERT INTO auth.users (id, email, encrypted_password, raw_user_meta_data, created_at, updated_at)
  VALUES (
    test_user_id,
    'test@example.com',
    'dummy_password',
    '{"first_name": "John", "last_name": "Doe"}'::jsonb,
    NOW(),
    NOW()
  );
  
  -- Check if profile was created
  IF EXISTS (SELECT 1 FROM profiles WHERE id = test_user_id) THEN
    RAISE NOTICE '✅ TRIGGER WORKS - Profile created automatically';
  ELSE
    RAISE NOTICE '❌ TRIGGER FAILED - No profile created';
  END IF;
  
  -- Clean up test data
  DELETE FROM auth.users WHERE id = test_user_id;
  DELETE FROM profiles WHERE id = test_user_id;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ TRIGGER TEST FAILED: %', SQLERRM;
END $$;

-- 6. Verify trigger exists
SELECT 
    'trigger status' as check_item,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ ENABLED'
        ELSE '❌ DISABLED'
    END as status
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created'; 