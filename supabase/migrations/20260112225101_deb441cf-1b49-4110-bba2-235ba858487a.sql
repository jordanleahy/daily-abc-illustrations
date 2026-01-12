-- Create cities table for database-driven city management
CREATE TABLE public.cities (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '🏙️',
  description TEXT,
  spelling_guide TEXT,
  terrain TEXT,
  architecture TEXT,
  landmarks TEXT[],
  color_palette TEXT,
  atmosphere TEXT,
  og_image TEXT,
  seo_description TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;

-- Public read access (cities are public reference data)
CREATE POLICY "Cities are publicly readable"
  ON public.cities
  FOR SELECT
  USING (true);

-- Only authenticated users can modify (admin use)
CREATE POLICY "Authenticated users can manage cities"
  ON public.cities
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Create updated_at trigger
CREATE TRIGGER update_cities_updated_at
  BEFORE UPDATE ON public.cities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed with existing city data
INSERT INTO public.cities (id, label, emoji, description, spelling_guide, terrain, architecture, landmarks, color_palette, atmosphere, og_image, seo_description, sort_order) VALUES
(
  'JERSEY_CITY',
  'Jersey City',
  '🌅',
  'NJ, waterfront views, diverse neighborhoods',
  'Jersey City (two words)',
  'Hudson River waterfront, urban landscape with views of Manhattan skyline',
  'Mix of historic brownstones, modern high-rises, and industrial-converted lofts',
  ARRAY['Liberty State Park', 'Exchange Place', 'Newport', 'Journal Square', 'Hamilton Park'],
  'Urban blues, sunset oranges, waterfront teals',
  'Diverse, artistic, urban waterfront community',
  '/images/cities/jerseycity-cover.jpeg',
  'Discover personalized ABC books featuring Jersey City landmarks, culture, and community. Educational content designed for local families.',
  1
),
(
  'HOBOKEN',
  'Hoboken',
  '🚂',
  'NJ, historic mile-square city',
  'Hoboken (one word)',
  'Compact mile-square city along Hudson River, cobblestone streets',
  'Classic brownstones, historic train terminal, waterfront piers',
  ARRAY['Hoboken Terminal', 'Washington Street', 'Stevens Institute', 'Pier A', 'Church Square Park'],
  'Brick reds, historic browns, river blues',
  'Historic, walkable, tight-knit community',
  '/images/cities/hoboken-cover.jpeg',
  'Explore ABC books celebrating Hoboken''s unique character and community. Engaging educational content for local children and families.',
  2
),
(
  'NEW_YORK_CITY',
  'New York City',
  '🗽',
  'The Big Apple, iconic landmarks',
  'New York City (NYC acceptable)',
  'Manhattan skyline, Central Park, diverse boroughs',
  'Iconic skyscrapers, brownstones, modern towers, historic landmarks',
  ARRAY['Statue of Liberty', 'Central Park', 'Empire State Building', 'Brooklyn Bridge', 'Times Square'],
  'Classic yellows, urban grays, park greens',
  'Iconic, energetic, world-famous metropolis',
  '/images/cities/newyork-cover.jpeg',
  'NYC-themed ABC books bringing the Big Apple to life for young learners. Educational adventures through iconic neighborhoods and landmarks.',
  3
);

-- Create index for active cities lookup
CREATE INDEX idx_cities_active_sort ON public.cities (is_active, sort_order) WHERE is_active = true;