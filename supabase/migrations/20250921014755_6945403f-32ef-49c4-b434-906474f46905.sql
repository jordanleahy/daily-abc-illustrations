-- Add source_type column to page_image_urls table to track image source
ALTER TABLE page_image_urls 
ADD COLUMN source_type TEXT NOT NULL DEFAULT 'ai_generated';

-- Add check constraint to ensure valid source types
ALTER TABLE page_image_urls 
ADD CONSTRAINT page_image_urls_source_type_check 
CHECK (source_type IN ('ai_generated', 'user_uploaded'));

-- Create index for efficient filtering by source type
CREATE INDEX idx_page_image_urls_source_type ON page_image_urls(source_type);