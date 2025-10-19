-- Delete duplicate daily_published entry without thumbnail
-- This is the older entry (created at 02:44:32) that has no SEO metadata
DELETE FROM daily_published 
WHERE id = 'd34963ba-0ff5-4178-ad1a-2b0dcb168c85';