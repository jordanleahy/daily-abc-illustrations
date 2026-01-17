-- Create category enum for city landmarks
CREATE TYPE public.landmark_category AS ENUM ('natural', 'architectural', 'cultural');

-- Add new columns to city_landmarks table
ALTER TABLE public.city_landmarks 
ADD COLUMN IF NOT EXISTS google_place_id text,
ADD COLUMN IF NOT EXISTS category public.landmark_category DEFAULT 'architectural',
ADD COLUMN IF NOT EXISTS prompt_snippet text;

-- Add index for efficient category lookups within a city
CREATE INDEX IF NOT EXISTS idx_city_landmarks_city_category 
ON public.city_landmarks (city_id, category) 
WHERE is_active = true;

-- Add index for google_place_id lookups
CREATE INDEX IF NOT EXISTS idx_city_landmarks_google_place_id 
ON public.city_landmarks (google_place_id) 
WHERE google_place_id IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.city_landmarks.google_place_id IS 'Google Places API place_id for enrichment and photo fetching';
COMMENT ON COLUMN public.city_landmarks.category IS 'Grouping for agent prompts: natural (parks, beaches), architectural (buildings, bridges), cultural (museums, theaters)';
COMMENT ON COLUMN public.city_landmarks.prompt_snippet IS 'Pre-written descriptive text for image generation prompts';