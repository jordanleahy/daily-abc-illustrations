-- Add is_library_book flag to books table
ALTER TABLE books 
ADD COLUMN IF NOT EXISTS is_library_book BOOLEAN DEFAULT false;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_books_library ON books(is_library_book) WHERE is_library_book = true;

-- Mark all currently published books as library books
UPDATE books 
SET is_library_book = true 
WHERE id IN (
  SELECT DISTINCT book_id 
  FROM daily_published 
  WHERE status IN ('active', 'queued', 'expired')
);

-- Add RLS policy for subscribers to view library books directly
CREATE POLICY "Subscribers can view library books"
ON books FOR SELECT
TO authenticated
USING (
  is_library_book = true 
  AND has_active_subscription(auth.uid())
);

-- Add RLS policy for subscribers to view pages for library books directly
CREATE POLICY "Subscribers can view pages for library books"
ON pages FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM books
    WHERE books.id = pages.book_id
      AND books.is_library_book = true
  )
  AND has_active_subscription(auth.uid())
);