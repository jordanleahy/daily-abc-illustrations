-- Create age_groups table for centralized age range management
CREATE TABLE public.age_groups (
  id text PRIMARY KEY,
  label text NOT NULL,
  min_age integer NOT NULL,
  max_age integer NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.age_groups ENABLE ROW LEVEL SECURITY;

-- Public read access for all users
CREATE POLICY "Anyone can view active age groups"
ON public.age_groups
FOR SELECT
USING (is_active = true);

-- Admin-only write access
CREATE POLICY "Admins can manage age groups"
ON public.age_groups
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Seed initial data matching current AGE_RANGE_IDS
INSERT INTO public.age_groups (id, label, min_age, max_age, sort_order) VALUES
  ('0-2', '0-2 years', 0, 2, 1),
  ('2-4', '2-4 years', 2, 4, 2),
  ('4-6', '4-6 years', 4, 6, 3),
  ('6-8', '6-8 years', 6, 8, 4),
  ('8-10', '8-10 years', 8, 10, 5),
  ('10-12', '10-12 years', 10, 12, 6);

-- Add updated_at trigger
CREATE TRIGGER update_age_groups_updated_at
  BEFORE UPDATE ON public.age_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_habits_updated_at();