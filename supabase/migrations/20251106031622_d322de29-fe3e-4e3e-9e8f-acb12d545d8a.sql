-- Add educational_focus field to books table
ALTER TABLE books 
ADD COLUMN educational_focus JSONB DEFAULT NULL;