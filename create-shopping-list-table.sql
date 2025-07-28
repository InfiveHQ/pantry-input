-- Create shopping_list table
CREATE TABLE IF NOT EXISTS shopping_list (
  id SERIAL PRIMARY KEY,
  item_id UUID REFERENCES pantry_items(id) ON DELETE CASCADE,
  added_by UUID REFERENCES profiles(id),
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(item_id)
);

-- Enable RLS
ALTER TABLE shopping_list ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can view all shopping list items" ON shopping_list;
DROP POLICY IF EXISTS "Authenticated users can insert shopping list items" ON shopping_list;
DROP POLICY IF EXISTS "Authenticated users can delete shopping list items" ON shopping_list;

-- Create more permissive policies
CREATE POLICY "Enable all operations for authenticated users" ON shopping_list
  FOR ALL USING (auth.role() = 'authenticated');

-- Alternative: If you want to disable RLS completely, you can run this instead:
-- ALTER TABLE shopping_list DISABLE ROW LEVEL SECURITY; 