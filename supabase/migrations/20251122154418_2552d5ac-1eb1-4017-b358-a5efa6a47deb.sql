-- Create view for kid's last viewed book with cover image
-- RLS is handled by the underlying tables (user_book_activity, books, pages, page_image_urls)
CREATE OR REPLACE VIEW kid_last_viewed_book_with_cover AS
SELECT DISTINCT ON (uba.kid_id)
  uba.kid_id,
  uba.last_viewed_at,
  b.id AS book_id,
  b.book_name,
  b.book_description,
  b.is_library_book,
  piu.image_url AS cover_image_url
FROM user_book_activity uba
LEFT JOIN books b ON uba.book_id = b.id
LEFT JOIN pages p ON b.id = p.book_id AND p.page_type = 'cover'
LEFT JOIN page_image_urls piu ON p.id = piu.page_id AND piu.is_latest = true
ORDER BY uba.kid_id, uba.last_viewed_at DESC;

-- Grant access to authenticated users
GRANT SELECT ON kid_last_viewed_book_with_cover TO authenticated;