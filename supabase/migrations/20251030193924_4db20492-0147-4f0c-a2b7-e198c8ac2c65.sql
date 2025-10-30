-- Add cost tracking columns to page_image_urls table
ALTER TABLE page_image_urls 
ADD COLUMN IF NOT EXISTS generation_cost_cents INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS usage_metadata JSONB DEFAULT NULL;

COMMENT ON COLUMN page_image_urls.generation_cost_cents IS 
'Cost in cents for generating this image. Calculated from API usage data.';

COMMENT ON COLUMN page_image_urls.usage_metadata IS 
'Token usage metadata from the AI API (prompt_tokens, completion_tokens, total_tokens).';