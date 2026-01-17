-- Create resorts table for ski resort options
CREATE TABLE public.resorts (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  description TEXT,
  location TEXT,
  state TEXT,
  country TEXT DEFAULT 'USA',
  terrain TEXT,
  difficulty_levels TEXT[],
  signature_runs TEXT[],
  atmosphere TEXT,
  color_palette TEXT,
  emoji TEXT DEFAULT '⛷️',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.resorts ENABLE ROW LEVEL SECURITY;

-- Allow public read access (resorts are reference data)
CREATE POLICY "Resorts are publicly readable"
  ON public.resorts
  FOR SELECT
  USING (true);

-- Only authenticated users can modify
CREATE POLICY "Authenticated users can insert resorts"
  ON public.resorts
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update resorts"
  ON public.resorts
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete resorts"
  ON public.resorts
  FOR DELETE
  TO authenticated
  USING (true);

-- Create index for active resorts
CREATE INDEX idx_resorts_active ON public.resorts(is_active) WHERE is_active = true;

-- Add timestamp trigger
CREATE TRIGGER update_resorts_updated_at
  BEFORE UPDATE ON public.resorts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some initial resorts
INSERT INTO public.resorts (id, label, location, state, terrain, difficulty_levels, signature_runs, atmosphere, sort_order) VALUES
  ('VAIL', 'Vail', 'Vail, Colorado', 'Colorado', 'Alpine bowls and groomed runs', ARRAY['Beginner', 'Intermediate', 'Expert'], ARRAY['Back Bowls', 'Blue Sky Basin'], 'Luxury mountain village with European charm', 1),
  ('KILLINGTON', 'Killington', 'Killington, Vermont', 'Vermont', 'Varied terrain with steep drops', ARRAY['Beginner', 'Intermediate', 'Advanced', 'Expert'], ARRAY['Superstar', 'Outer Limits'], 'East coast beast with challenging trails', 2),
  ('PARK_CITY', 'Park City', 'Park City, Utah', 'Utah', 'Wide groomed runs and powder bowls', ARRAY['Beginner', 'Intermediate', 'Advanced'], ARRAY['Jupiter Bowl', 'McConkeys'], 'Historic mining town turned ski paradise', 3),
  ('MAMMOTH', 'Mammoth Mountain', 'Mammoth Lakes, California', 'California', 'High altitude volcanic terrain', ARRAY['Intermediate', 'Advanced', 'Expert'], ARRAY['Cornice Bowl', 'Climax'], 'California sunshine with epic snowfall', 4),
  ('ASPEN', 'Aspen', 'Aspen, Colorado', 'Colorado', 'Four mountains of diverse terrain', ARRAY['Beginner', 'Intermediate', 'Advanced', 'Expert'], ARRAY['Highlands Bowl', 'Ajax Mountain'], 'Glamorous ski town with world-class dining', 5);

-- Add the Resort question to questions table
INSERT INTO public.questions (id, label, description, placeholder_key, options_table, options_label_column, options_value_column, icon_name, sort_order, is_active)
VALUES (
  'RESORT',
  'Resort',
  'Ski resort setting for the book',
  'RESORT_OPTIONS',
  'resorts',
  'label',
  'id',
  'Mountain',
  15,
  true
);