-- Create habits table
CREATE TABLE public.habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  photo_url TEXT,
  coin_amount INTEGER NOT NULL DEFAULT 1,
  frequency TEXT NOT NULL DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  deadline_time TIME,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create habit_assignments table
CREATE TABLE public.habit_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  kid_profile_id UUID NOT NULL REFERENCES public.kid_profiles(id) ON DELETE CASCADE,
  parent_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create habit_completions table
CREATE TABLE public.habit_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_assignment_id UUID NOT NULL REFERENCES public.habit_assignments(id) ON DELETE CASCADE,
  kid_profile_id UUID NOT NULL REFERENCES public.kid_profiles(id) ON DELETE CASCADE,
  parent_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  completion_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'declined')),
  coins_deposited INTEGER NOT NULL DEFAULT 0,
  coins_retained INTEGER NOT NULL DEFAULT 0,
  marked_at TIMESTAMP WITH TIME ZONE,
  deadline_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(habit_assignment_id, completion_date)
);

-- Enable RLS
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_completions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for habits
CREATE POLICY "Parents can view their own habits"
  ON public.habits FOR SELECT
  USING (parent_user_id = auth.uid());

CREATE POLICY "Parents can create their own habits"
  ON public.habits FOR INSERT
  WITH CHECK (parent_user_id = auth.uid());

CREATE POLICY "Parents can update their own habits"
  ON public.habits FOR UPDATE
  USING (parent_user_id = auth.uid());

CREATE POLICY "Parents can delete their own habits"
  ON public.habits FOR DELETE
  USING (parent_user_id = auth.uid());

-- RLS Policies for habit_assignments
CREATE POLICY "Parents can view their own habit assignments"
  ON public.habit_assignments FOR SELECT
  USING (parent_user_id = auth.uid());

CREATE POLICY "Parents can create their own habit assignments"
  ON public.habit_assignments FOR INSERT
  WITH CHECK (parent_user_id = auth.uid());

CREATE POLICY "Parents can update their own habit assignments"
  ON public.habit_assignments FOR UPDATE
  USING (parent_user_id = auth.uid());

CREATE POLICY "Parents can delete their own habit assignments"
  ON public.habit_assignments FOR DELETE
  USING (parent_user_id = auth.uid());

-- RLS Policies for habit_completions
CREATE POLICY "Parents can view their kids' habit completions"
  ON public.habit_completions FOR SELECT
  USING (parent_user_id = auth.uid());

CREATE POLICY "Parents can create their kids' habit completions"
  ON public.habit_completions FOR INSERT
  WITH CHECK (parent_user_id = auth.uid());

CREATE POLICY "Parents can update their kids' habit completions"
  ON public.habit_completions FOR UPDATE
  USING (parent_user_id = auth.uid());

CREATE POLICY "Parents can delete their kids' habit completions"
  ON public.habit_completions FOR DELETE
  USING (parent_user_id = auth.uid());

-- Function to increment kid coins
CREATE OR REPLACE FUNCTION public.increment_kid_coins(p_kid_id UUID, p_amount INTEGER)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.kid_profiles
  SET earned_coins = earned_coins + p_amount,
      updated_at = now()
  WHERE id = p_kid_id;
END;
$$;

-- Function to decrement kid coins
CREATE OR REPLACE FUNCTION public.decrement_kid_coins(p_kid_id UUID, p_amount INTEGER)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.kid_profiles
  SET earned_coins = GREATEST(0, earned_coins - p_amount),
      updated_at = now()
  WHERE id = p_kid_id;
END;
$$;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_habits_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_habits_timestamp
  BEFORE UPDATE ON public.habits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_habits_updated_at();

CREATE TRIGGER update_habit_completions_timestamp
  BEFORE UPDATE ON public.habit_completions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_habits_updated_at();

-- Indexes for performance
CREATE INDEX idx_habits_parent_user_id ON public.habits(parent_user_id);
CREATE INDEX idx_habits_is_active ON public.habits(is_active);
CREATE INDEX idx_habit_assignments_kid_profile_id ON public.habit_assignments(kid_profile_id);
CREATE INDEX idx_habit_assignments_habit_id ON public.habit_assignments(habit_id);
CREATE INDEX idx_habit_completions_kid_profile_id ON public.habit_completions(kid_profile_id);
CREATE INDEX idx_habit_completions_completion_date ON public.habit_completions(completion_date);
CREATE INDEX idx_habit_completions_status ON public.habit_completions(status);