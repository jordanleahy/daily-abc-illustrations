-- Create brands table for equipment brands like Burton, K2, etc.
CREATE TABLE public.brands (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'snowboard', -- snowboard, ski, apparel, etc.
  logo_url TEXT,
  website_url TEXT,
  color_palette TEXT,
  emoji TEXT DEFAULT '🏂',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Brands are publicly readable"
  ON public.brands FOR SELECT
  USING (true);

-- Authenticated users can manage brands
CREATE POLICY "Authenticated users can manage brands"
  ON public.brands FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Index for active brands
CREATE INDEX idx_brands_active ON public.brands(is_active, sort_order);

-- Updated_at trigger
CREATE TRIGGER update_brands_updated_at
  BEFORE UPDATE ON public.brands
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial brands
INSERT INTO public.brands (id, label, description, category, emoji, sort_order) VALUES
  ('BURTON', 'Burton', 'Leading snowboard brand since 1977', 'snowboard', '🏂', 1),
  ('K2', 'K2', 'Innovative ski and snowboard equipment', 'both', '⛷️', 2),
  ('ROSSIGNOL', 'Rossignol', 'French ski and snowboard manufacturer', 'both', '🎿', 3),
  ('SALOMON', 'Salomon', 'Premium outdoor sports equipment', 'both', '🏔️', 4),
  ('CAPITA', 'Capita', 'High-performance snowboards', 'snowboard', '🏂', 5),
  ('JONES', 'Jones', 'Backcountry and freeride boards', 'snowboard', '🗻', 6);

-- Insert Brand question
INSERT INTO public.questions (
  id,
  label,
  description,
  placeholder_key,
  icon_name,
  options_table,
  options_value_column,
  options_label_column,
  sort_order,
  is_active
) VALUES (
  'BRAND',
  'What brand theme should we feature?',
  'Choose an equipment brand for the book theme',
  '{{BRAND_OPTIONS}}',
  'Tag',
  'brands',
  'id',
  'label',
  60,
  true
)
ON CONFLICT (id) DO NOTHING;