-- Add product_description column to books table for storing AI-generated marketing descriptions
ALTER TABLE books ADD COLUMN product_description text;