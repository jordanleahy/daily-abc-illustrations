-- Add book_id column to habits table to link reading habits to books
ALTER TABLE habits 
ADD COLUMN book_id uuid REFERENCES books(id) ON DELETE SET NULL;

-- Add index for faster lookups when checking book completion
CREATE INDEX idx_habits_book_id ON habits(book_id) WHERE book_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN habits.book_id IS 'Reference to the book if this habit is a reading habit. Null for non-book habits like "brush teeth".';