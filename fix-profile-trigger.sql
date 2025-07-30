-- FIX PROFILE TRIGGER
-- This script improves the handle_new_user function to be more robust

-- Drop the existing trigger first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop the existing function
DROP FUNCTION IF EXISTS handle_new_user();

-- Create the improved function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if profile already exists to avoid conflicts
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = NEW.id) THEN
    INSERT INTO profiles (id, email, first_name, last_name, created_at, updated_at)
    VALUES (
      NEW.id, 
      NEW.email, 
      COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
      COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
      NOW(),
      NOW()
    );
    
    -- Log successful profile creation
    RAISE NOTICE 'Profile created for user: %', NEW.email;
  ELSE
    -- Log if profile already exists
    RAISE NOTICE 'Profile already exists for user: %', NEW.email;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log any errors but don't fail the user creation
    RAISE NOTICE 'Error creating profile for user %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Test the trigger with a sample user (optional)
-- This will create a test user and profile, then clean up
DO $$
DECLARE
  test_user_id uuid := gen_random_uuid();
BEGIN
  -- Insert a test user to trigger the function
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data)
  VALUES (
    test_user_id,
    'test-trigger@example.com',
    'encrypted_password_here',
    NOW(),
    NOW(),
    NOW(),
    '{"first_name": "Test", "last_name": "Trigger"}'
  );
  
  -- Check if profile was created
  IF EXISTS (SELECT 1 FROM profiles WHERE id = test_user_id) THEN
    RAISE NOTICE '✅ Trigger test successful - profile created for test user';
  ELSE
    RAISE NOTICE '❌ Trigger test failed - no profile created';
  END IF;
  
  -- Clean up test data
  DELETE FROM profiles WHERE id = test_user_id;
  DELETE FROM auth.users WHERE id = test_user_id;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ Trigger test error: %', SQLERRM;
    -- Clean up on error
    DELETE FROM profiles WHERE id = test_user_id;
    DELETE FROM auth.users WHERE id = test_user_id;
END $$; 