-- Create locations table for database-driven resort management
CREATE TABLE public.locations (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  emoji TEXT NOT NULL,
  description TEXT,
  spelling_guide TEXT,
  -- Visual profile for AI image generation
  terrain TEXT,
  architecture TEXT,
  landmarks TEXT[],
  color_palette TEXT,
  atmosphere TEXT,
  -- Management
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- Public read access (locations are public reference data)
CREATE POLICY "Locations are publicly readable"
ON public.locations
FOR SELECT
USING (true);

-- Only admins can modify locations
CREATE POLICY "Admins can manage locations"
ON public.locations
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- Create index for active locations
CREATE INDEX idx_locations_active_sort ON public.locations(is_active, sort_order);

-- Add comment for documentation
COMMENT ON TABLE public.locations IS 'Ski resort locations for book creation with visual profiles for AI image generation';