-- Add column for tracking B&W coloring image generation cost separately from color image cost
ALTER TABLE page_image_urls ADD COLUMN IF NOT EXISTS bw_generation_cost_cents integer DEFAULT 0;

COMMENT ON COLUMN page_image_urls.bw_generation_cost_cents IS 
'Cost in cents for generating the B&W coloring image. Tracked separately from color image cost.';