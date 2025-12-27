-- Create grade_levels table for educational content targeting
CREATE TABLE public.grade_levels (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.grade_levels ENABLE ROW LEVEL SECURITY;

-- Allow public read access (grade levels are reference data)
CREATE POLICY "Grade levels are publicly readable"
  ON public.grade_levels
  FOR SELECT
  USING (true);

-- Seed the initial grade levels
INSERT INTO public.grade_levels (id, label, description, sort_order) VALUES
  ('PRE_K', 'Pre-K', 'Pre-Kindergarten (Ages 3-4)', 1),
  ('K', 'Kindergarten', 'Kindergarten (Ages 5-6)', 2),
  ('GRADE_1', '1st Grade', 'First Grade (Ages 6-7)', 3),
  ('GRADE_2', '2nd Grade', 'Second Grade (Ages 7-8)', 4);

-- Add trigger for updated_at
CREATE TRIGGER update_grade_levels_updated_at
  BEFORE UPDATE ON public.grade_levels
  FOR EACH ROW
  EXECUTE FUNCTION public.update_habits_updated_at();