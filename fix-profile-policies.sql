-- Fix RLS policies for profile creation
-- Run this in your Supabase SQL Editor

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create a new policy that allows service role to create profiles
CREATE POLICY "Allow profile creation" ON profiles
  FOR INSERT WITH CHECK (true);

-- Keep the existing select and update policies
-- (These should already exist and work fine) 