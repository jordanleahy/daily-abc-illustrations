-- Phase 1: Database-Level Security with Subscription-Aware RLS Policies
-- Use CASCADE to drop function and its dependent policies

-- =============================================
-- 1. Drop existing function with CASCADE
-- =============================================
DROP FUNCTION IF EXISTS public.has_active_subscription(uuid) CASCADE;

-- =============================================
-- 2. Create subscription cache table
-- =============================================
CREATE TABLE IF NOT EXISTS public.user_subscription_cache (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  has_active_subscription BOOLEAN NOT NULL DEFAULT false,
  subscription_tier TEXT,
  cached_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_subscription_cache_user_id ON public.user_subscription_cache(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_cache_expires ON public.user_subscription_cache(expires_at);

-- Enable RLS on subscription cache
ALTER TABLE public.user_subscription_cache ENABLE ROW LEVEL SECURITY;

-- Users can only view their own subscription cache
CREATE POLICY "Users can view their own subscription cache"
  ON public.user_subscription_cache
  FOR SELECT
  USING (auth.uid() = user_id);

-- System/service role can manage cache
CREATE POLICY "Service role can manage subscription cache"
  ON public.user_subscription_cache
  FOR ALL
  USING (auth.role() = 'service_role');

-- =============================================
-- 3. Create feature access checking functions
-- =============================================

-- Function to check if user has feature access
CREATE OR REPLACE FUNCTION public.has_feature_access(p_user_id UUID, p_feature TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_has_subscription BOOLEAN;
BEGIN
  -- Feature: 'chat_and_books' - always available to authenticated users (FREE tier)
  IF p_feature = 'chat_and_books' THEN
    RETURN (p_user_id IS NOT NULL);
  END IF;
  
  -- All other features require active subscription
  -- Check cache first (valid for 5 minutes)
  SELECT has_active_subscription
  INTO v_has_subscription
  FROM public.user_subscription_cache
  WHERE user_id = p_user_id
    AND cached_at > NOW() - INTERVAL '5 minutes';
  
  -- If cache is valid, return result
  IF FOUND THEN
    RETURN v_has_subscription;
  END IF;
  
  -- If no cache or expired, return false (fail-safe)
  RETURN false;
END;
$$;

-- Recreate has_active_subscription function
CREATE OR REPLACE FUNCTION public.has_active_subscription(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN public.has_feature_access(p_user_id, 'library');
END;
$$;

-- =============================================
-- 4. Recreate dropped daily_published policies
-- =============================================

CREATE POLICY "Authenticated users with subscription can view active daily pub"
  ON public.daily_published
  FOR SELECT
  USING (
    status = 'active' 
    AND is_active = true 
    AND (expires_at IS NULL OR expires_at > now()) 
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role) OR has_active_subscription(auth.uid()))
  );

-- =============================================
-- 5. Recreate dropped books policies
-- =============================================

CREATE POLICY "Subscribers can view library books"
  ON public.books
  FOR SELECT
  USING (
    is_library_book = true 
    AND has_active_subscription(auth.uid())
  );

-- =============================================
-- 6. Recreate dropped pages policies
-- =============================================

CREATE POLICY "Subscribers can view pages for library books"
  ON public.pages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM books
      WHERE books.id = pages.book_id 
        AND books.is_library_book = true
    ) 
    AND has_active_subscription(auth.uid())
  );

-- =============================================
-- 7. Update RLS Policies for Habits Tables
-- =============================================

DROP POLICY IF EXISTS "Parents can view their own habits" ON public.habits;
DROP POLICY IF EXISTS "Parents can create their own habits" ON public.habits;
DROP POLICY IF EXISTS "Parents can update their own habits" ON public.habits;
DROP POLICY IF EXISTS "Parents can delete their own habits" ON public.habits;

CREATE POLICY "Parents can view their own habits"
  ON public.habits FOR SELECT
  USING (parent_user_id = auth.uid() AND has_feature_access(auth.uid(), 'habits_rewards'));

CREATE POLICY "Parents can create their own habits"
  ON public.habits FOR INSERT
  WITH CHECK (parent_user_id = auth.uid() AND has_feature_access(auth.uid(), 'habits_rewards'));

CREATE POLICY "Parents can update their own habits"
  ON public.habits FOR UPDATE
  USING (parent_user_id = auth.uid() AND has_feature_access(auth.uid(), 'habits_rewards'));

CREATE POLICY "Parents can delete their own habits"
  ON public.habits FOR DELETE
  USING (parent_user_id = auth.uid() AND has_feature_access(auth.uid(), 'habits_rewards'));

-- Habit assignments
DROP POLICY IF EXISTS "Parents can view their own habit assignments" ON public.habit_assignments;
DROP POLICY IF EXISTS "Parents can create their own habit assignments" ON public.habit_assignments;
DROP POLICY IF EXISTS "Parents can update their own habit assignments" ON public.habit_assignments;
DROP POLICY IF EXISTS "Parents can delete their own habit assignments" ON public.habit_assignments;

CREATE POLICY "Parents can view their own habit assignments"
  ON public.habit_assignments FOR SELECT
  USING (parent_user_id = auth.uid() AND has_feature_access(auth.uid(), 'habits_rewards'));

CREATE POLICY "Parents can create their own habit assignments"
  ON public.habit_assignments FOR INSERT
  WITH CHECK (parent_user_id = auth.uid() AND has_feature_access(auth.uid(), 'habits_rewards'));

CREATE POLICY "Parents can update their own habit assignments"
  ON public.habit_assignments FOR UPDATE
  USING (parent_user_id = auth.uid() AND has_feature_access(auth.uid(), 'habits_rewards'));

CREATE POLICY "Parents can delete their own habit assignments"
  ON public.habit_assignments FOR DELETE
  USING (parent_user_id = auth.uid() AND has_feature_access(auth.uid(), 'habits_rewards'));

-- Habit completions
DROP POLICY IF EXISTS "Parents can view their kids' habit completions" ON public.habit_completions;
DROP POLICY IF EXISTS "Parents can create their kids' habit completions" ON public.habit_completions;
DROP POLICY IF EXISTS "Parents can update their kids' habit completions" ON public.habit_completions;
DROP POLICY IF EXISTS "Parents can delete their kids' habit completions" ON public.habit_completions;

CREATE POLICY "Parents can view their kids' habit completions"
  ON public.habit_completions FOR SELECT
  USING (parent_user_id = auth.uid() AND has_feature_access(auth.uid(), 'habits_rewards'));

CREATE POLICY "Parents can create their kids' habit completions"
  ON public.habit_completions FOR INSERT
  WITH CHECK (parent_user_id = auth.uid() AND has_feature_access(auth.uid(), 'habits_rewards'));

CREATE POLICY "Parents can update their kids' habit completions"
  ON public.habit_completions FOR UPDATE
  USING (parent_user_id = auth.uid() AND has_feature_access(auth.uid(), 'habits_rewards'));

CREATE POLICY "Parents can delete their kids' habit completions"
  ON public.habit_completions FOR DELETE
  USING (parent_user_id = auth.uid() AND has_feature_access(auth.uid(), 'habits_rewards'));

-- Habit schedule
DROP POLICY IF EXISTS "Parents can view their own habit schedules" ON public.habit_schedule;
DROP POLICY IF EXISTS "Parents can create their own habit schedules" ON public.habit_schedule;
DROP POLICY IF EXISTS "Parents can update their own habit schedules" ON public.habit_schedule;
DROP POLICY IF EXISTS "Parents can delete their own habit schedules" ON public.habit_schedule;

CREATE POLICY "Parents can view their own habit schedules"
  ON public.habit_schedule FOR SELECT
  USING (parent_user_id = auth.uid() AND has_feature_access(auth.uid(), 'habits_rewards'));

CREATE POLICY "Parents can create their own habit schedules"
  ON public.habit_schedule FOR INSERT
  WITH CHECK (parent_user_id = auth.uid() AND has_feature_access(auth.uid(), 'habits_rewards'));

CREATE POLICY "Parents can update their own habit schedules"
  ON public.habit_schedule FOR UPDATE
  USING (parent_user_id = auth.uid() AND has_feature_access(auth.uid(), 'habits_rewards'));

CREATE POLICY "Parents can delete their own habit schedules"
  ON public.habit_schedule FOR DELETE
  USING (parent_user_id = auth.uid() AND has_feature_access(auth.uid(), 'habits_rewards'));

-- =============================================
-- 8. Update RLS Policies for Rewards Tables
-- =============================================

DROP POLICY IF EXISTS "Parents can view their own products" ON public.kid_rewards_products;
DROP POLICY IF EXISTS "Parents can create their own products" ON public.kid_rewards_products;
DROP POLICY IF EXISTS "Parents can update their own products" ON public.kid_rewards_products;
DROP POLICY IF EXISTS "Parents can delete their own products" ON public.kid_rewards_products;

CREATE POLICY "Parents can view their own products"
  ON public.kid_rewards_products FOR SELECT
  USING (parent_user_id = auth.uid() AND has_feature_access(auth.uid(), 'habits_rewards'));

CREATE POLICY "Parents can create their own products"
  ON public.kid_rewards_products FOR INSERT
  WITH CHECK (parent_user_id = auth.uid() AND has_feature_access(auth.uid(), 'habits_rewards'));

CREATE POLICY "Parents can update their own products"
  ON public.kid_rewards_products FOR UPDATE
  USING (parent_user_id = auth.uid() AND has_feature_access(auth.uid(), 'habits_rewards'));

CREATE POLICY "Parents can delete their own products"
  ON public.kid_rewards_products FOR DELETE
  USING (parent_user_id = auth.uid() AND has_feature_access(auth.uid(), 'habits_rewards'));

-- Kid purchases
DROP POLICY IF EXISTS "Parents can view purchases for their kids" ON public.kid_purchases;
DROP POLICY IF EXISTS "Parents can create purchases for their kids" ON public.kid_purchases;
DROP POLICY IF EXISTS "Parents can update purchases for their kids" ON public.kid_purchases;

CREATE POLICY "Parents can view purchases for their kids"
  ON public.kid_purchases FOR SELECT
  USING (parent_user_id = auth.uid() AND has_feature_access(auth.uid(), 'habits_rewards'));

CREATE POLICY "Parents can create purchases for their kids"
  ON public.kid_purchases FOR INSERT
  WITH CHECK (
    parent_user_id = auth.uid() 
    AND has_feature_access(auth.uid(), 'habits_rewards')
    AND EXISTS (SELECT 1 FROM kid_profiles WHERE id = kid_purchases.kid_profile_id AND parent_user_id = auth.uid())
  );

CREATE POLICY "Parents can update purchases for their kids"
  ON public.kid_purchases FOR UPDATE
  USING (parent_user_id = auth.uid() AND has_feature_access(auth.uid(), 'habits_rewards'));

-- =============================================
-- 9. Helper functions for subscription cache
-- =============================================

CREATE OR REPLACE FUNCTION public.update_subscription_cache(
  p_user_id UUID,
  p_has_active_subscription BOOLEAN,
  p_subscription_tier TEXT DEFAULT NULL,
  p_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_subscription_cache (
    user_id, has_active_subscription, subscription_tier, cached_at, expires_at
  ) VALUES (
    p_user_id, p_has_active_subscription, p_subscription_tier, NOW(), p_expires_at
  )
  ON CONFLICT (user_id) DO UPDATE SET
    has_active_subscription = EXCLUDED.has_active_subscription,
    subscription_tier = EXCLUDED.subscription_tier,
    cached_at = EXCLUDED.cached_at,
    expires_at = EXCLUDED.expires_at;
END;
$$;