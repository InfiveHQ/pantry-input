-- Add wasted field to existing pantry_items table
-- Run this in your Supabase SQL Editor

-- Add only the wasted field
ALTER TABLE pantry_items 
ADD COLUMN IF NOT EXISTS wasted BOOLEAN DEFAULT FALSE;

-- Create index for better performance when filtering wasted items
CREATE INDEX IF NOT EXISTS idx_pantry_items_wasted ON pantry_items(wasted);
