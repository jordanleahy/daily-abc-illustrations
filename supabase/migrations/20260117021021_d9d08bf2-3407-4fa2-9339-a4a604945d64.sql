-- Add geo context columns to cities table for AI disambiguation
ALTER TABLE public.cities 
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'USA',
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS place_id TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.cities.state IS 'State/province for disambiguation (e.g., "New Jersey")';
COMMENT ON COLUMN public.cities.country IS 'Country name for disambiguation (e.g., "USA")';
COMMENT ON COLUMN public.cities.place_id IS 'Google Places API place_id for unique identification';