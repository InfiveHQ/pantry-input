-- COMPREHENSIVE DATABASE SETUP FOR PANTRY APPLICATION
-- Run this script in your Supabase SQL Editor

-- 1. Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT DEFAULT '',
  last_name TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create households table
CREATE TABLE IF NOT EXISTS households (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create household_members table
CREATE TABLE IF NOT EXISTS household_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT CHECK (role IN ('owner', 'member')) DEFAULT 'member',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(household_id, user_id)
);

-- 4. Create invitations table
CREATE TABLE IF NOT EXISTS invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  role TEXT CHECK (role IN ('owner', 'member')) DEFAULT 'member',
  status TEXT CHECK (status IN ('pending', 'accepted', 'declined')) DEFAULT 'pending',
  invited_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create pantry_items table
CREATE TABLE IF NOT EXISTS pantry_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  unit TEXT DEFAULT '',
  category TEXT DEFAULT '',
  expiry_date DATE,
  notes TEXT,
  added_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE pantry_items ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 8. Create RLS Policies for households
CREATE POLICY "Household owners can manage their households" ON households
  FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "Household members can view their households" ON households
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM household_members 
      WHERE household_id = households.id 
      AND user_id = auth.uid()
    )
  );

-- 9. Create RLS Policies for household_members
CREATE POLICY "Household members can view household members" ON household_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM household_members hm
      WHERE hm.household_id = household_members.household_id
      AND hm.user_id = auth.uid()
    )
  );

CREATE POLICY "Household owners can manage members" ON household_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM households
      WHERE id = household_members.household_id
      AND owner_id = auth.uid()
    )
  );

-- 10. Create RLS Policies for invitations
CREATE POLICY "Household owners can manage invitations" ON invitations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM households
      WHERE id = invitations.household_id
      AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can view invitations sent to their email" ON invitations
  FOR SELECT USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- 11. Create RLS Policies for pantry_items
CREATE POLICY "Household members can view pantry items" ON pantry_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM household_members
      WHERE household_id = pantry_items.household_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Household members can manage pantry items" ON pantry_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM household_members
      WHERE household_id = pantry_items.household_id
      AND user_id = auth.uid()
    )
  );

-- 12. Create function to handle new user creation
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

-- 13. Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 14. Create function to get table info (for testing)
CREATE OR REPLACE FUNCTION get_table_info(table_name TEXT)
RETURNS TABLE(column_name TEXT, data_type TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.column_name::TEXT,
    c.data_type::TEXT
  FROM information_schema.columns c
  WHERE c.table_schema = 'public' 
  AND c.table_name = get_table_info.table_name
  ORDER BY c.ordinal_position;
END;
$$ LANGUAGE plpgsql;

-- 15. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_household_members_user_id ON household_members(user_id);
CREATE INDEX IF NOT EXISTS idx_household_members_household_id ON household_members(household_id);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_household_id ON invitations(household_id);
CREATE INDEX IF NOT EXISTS idx_pantry_items_household_id ON pantry_items(household_id);
CREATE INDEX IF NOT EXISTS idx_pantry_items_added_by ON pantry_items(added_by);

-- 16. Test the setup
DO $$
DECLARE
  test_user_id uuid := gen_random_uuid();
  test_household_id uuid := gen_random_uuid();
BEGIN
  -- Test profile creation
  INSERT INTO profiles (id, email, first_name, last_name)
  VALUES (test_user_id, 'test@example.com', 'Test', 'User');
  
  -- Test household creation
  INSERT INTO households (id, name, owner_id)
  VALUES (test_household_id, 'Test Household', test_user_id);
  
  -- Test household member creation
  INSERT INTO household_members (household_id, user_id, role)
  VALUES (test_household_id, test_user_id, 'owner');
  
  RAISE NOTICE '✅ DATABASE SETUP COMPLETE - All tables and policies created successfully';
  
  -- Clean up test data
  DELETE FROM household_members WHERE household_id = test_household_id;
  DELETE FROM households WHERE id = test_household_id;
  DELETE FROM profiles WHERE id = test_user_id;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ SETUP FAILED: %', SQLERRM;
END $$;

-- 17. Show final table structure
SELECT 
    table_name,
    'Table created successfully' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'households', 'household_members', 'invitations', 'pantry_items')
ORDER BY table_name; 