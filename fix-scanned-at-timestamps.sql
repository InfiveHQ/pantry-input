-- Fix scanned_at timestamps for existing items
-- This script updates items that have date-only scanned_at values (like "2024-01-15")
-- to have proper timestamps with time information

-- First, let's see what we're working with
SELECT 
  id,
  name,
  scanned_at,
  LENGTH(scanned_at) as timestamp_length
FROM pantry_items 
WHERE scanned_at IS NOT NULL
ORDER BY scanned_at DESC
LIMIT 10;

-- Update items that have date-only scanned_at (10 characters like "2024-01-15")
-- to have proper timestamps with time information
UPDATE pantry_items 
SET scanned_at = scanned_at || 'T12:00:00.000Z'
WHERE scanned_at IS NOT NULL 
  AND LENGTH(scanned_at) = 10 
  AND scanned_at LIKE '____-__-__';

-- Verify the fix worked
SELECT 
  id,
  name,
  scanned_at,
  LENGTH(scanned_at) as timestamp_length
FROM pantry_items 
WHERE scanned_at IS NOT NULL
ORDER BY scanned_at DESC
LIMIT 10; 