-- Add style template fields to books table
ALTER TABLE books 
ADD COLUMN IF NOT EXISTS reference_book_id UUID REFERENCES books(id),
ADD COLUMN IF NOT EXISTS style_name TEXT,
ADD COLUMN IF NOT EXISTS is_style_template BOOLEAN DEFAULT FALSE;

-- Create index for faster style template queries
CREATE INDEX IF NOT EXISTS idx_books_style_template 
ON books(user_id, is_style_template) 
WHERE is_style_template = TRUE;

-- Add comment explaining the fields
COMMENT ON COLUMN books.reference_book_id IS 'Reference to another book whose visual style was used as template';
COMMENT ON COLUMN books.style_name IS 'Custom name for this style template (e.g., "DanDan Style")';
COMMENT ON COLUMN books.is_style_template IS 'Whether this book should be available as a style template in chat';