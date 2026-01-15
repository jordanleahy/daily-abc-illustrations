-- Fix is_latest flags for agents that should be latest but aren't
-- First, set all versions of these types to is_latest=false, then set the newest to true

-- Reset all to false for these types
UPDATE public.agents
SET is_latest = false
WHERE type IN ('book-creation-general', 'book-creation-manners', 'book-creation-parent-education');

-- Set the most recent version of each to is_latest=true
WITH latest_versions AS (
  SELECT DISTINCT ON (type) id
  FROM agents
  WHERE type IN ('book-creation-general', 'book-creation-manners', 'book-creation-parent-education')
  ORDER BY type, created_at DESC
)
UPDATE public.agents
SET is_latest = true
WHERE id IN (SELECT id FROM latest_versions);