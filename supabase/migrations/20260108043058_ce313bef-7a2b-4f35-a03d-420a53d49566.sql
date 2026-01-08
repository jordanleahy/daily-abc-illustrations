-- Delete all blog posts created before January 1st, 2026
DELETE FROM blog_posts WHERE created_at < '2026-01-01';