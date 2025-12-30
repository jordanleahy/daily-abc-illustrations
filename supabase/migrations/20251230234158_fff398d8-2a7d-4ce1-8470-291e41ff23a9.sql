-- Delete the duplicate draft book with no images
-- Book: Mickey's Magical Christmas Sight Words (draft, 0 images, no daily_published)
DELETE FROM pages WHERE book_id = '06e0ba85-a1e5-4a9a-b88a-31d1576b1887';
DELETE FROM books WHERE id = '06e0ba85-a1e5-4a9a-b88a-31d1576b1887';

-- Now update the remaining book's marketing_url to match its daily_published.slug
UPDATE books b
SET 
  marketing_url = dp.slug,
  updated_at = now()
FROM daily_published dp
WHERE b.id = '7c7e4206-b16e-4ccc-8332-380d95ffb916'
  AND dp.book_id = b.id
  AND dp.slug IS NOT NULL;