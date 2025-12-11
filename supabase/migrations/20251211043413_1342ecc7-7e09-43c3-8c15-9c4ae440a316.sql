-- Add coloring_image_url column to page_image_urls table
ALTER TABLE page_image_urls 
ADD COLUMN coloring_image_url TEXT DEFAULT NULL;