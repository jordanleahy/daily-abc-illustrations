-- Add column for tracking color image generation cost separately
ALTER TABLE page_image_urls ADD COLUMN IF NOT EXISTS color_generation_cost_cents integer DEFAULT 0;