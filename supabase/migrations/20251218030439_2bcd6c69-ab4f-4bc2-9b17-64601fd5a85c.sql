-- Fix SECURITY DEFINER view issue by setting security_invoker=true on kid_last_viewed_book_with_cover view
-- This ensures RLS policies are enforced based on the querying user, not the view owner

-- Recreate the view with SECURITY INVOKER
CREATE OR REPLACE VIEW public.kid_last_viewed_book_with_cover
WITH (security_invoker = true)
AS
SELECT DISTINCT ON (uba.kid_id) 
    uba.kid_id,
    uba.last_viewed_at,
    b.id AS book_id,
    b.book_name,
    b.book_description,
    b.is_library_book,
    piu.image_url AS cover_image_url
FROM user_book_activity uba
JOIN books b ON uba.book_id = b.id
LEFT JOIN pages p ON b.id = p.book_id AND p.page_type = 'cover'::page_type
LEFT JOIN page_image_urls piu ON p.id = piu.page_id AND piu.is_latest = true
WHERE b.id IS NOT NULL
ORDER BY uba.kid_id, uba.last_viewed_at DESC;