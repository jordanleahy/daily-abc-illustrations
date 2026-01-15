-- Fix is_latest for dr-seuss and manners agents
-- Set the most recent version of each to is_latest=true
WITH latest_versions AS (
  SELECT DISTINCT ON (type) id
  FROM agents
  WHERE type IN ('book-creation-dr-seuss', 'book-creation-manners')
  ORDER BY type, created_at DESC
)
UPDATE public.agents
SET is_latest = true
WHERE id IN (SELECT id FROM latest_versions);