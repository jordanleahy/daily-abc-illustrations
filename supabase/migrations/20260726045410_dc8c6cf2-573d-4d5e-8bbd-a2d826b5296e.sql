-- Revoke the implicit PUBLIC EXECUTE grant on all SECURITY DEFINER functions
DO $$
DECLARE
  fn record;
BEGIN
  FOR fn IN
    SELECT p.oid::regprocedure::text AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef
      AND NOT EXISTS (
        SELECT 1 FROM pg_depend d WHERE d.objid = p.oid AND d.deptype = 'e'
      )
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', fn.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', fn.sig);
  END LOOP;
END $$;

-- Re-grant only what the application needs
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_feature_access(uuid, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_active_subscription(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_book_published(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_public_book_by_slug(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_daily_published_pages(uuid) TO anon, authenticated;

GRANT EXECUTE ON FUNCTION public.archive_book(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_habit_completion_unified(uuid, uuid, uuid, date, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_switch_goal_from_regular(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_trick_completion_unified(uuid, integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_kid_coins(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_habit_completion_safe(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_kids_with_activity() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_users_with_activity() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_kid_reading_activity(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_library_books_by_completion(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_next_page_image_version_number(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_next_gemini_image_version_number(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_next_simplified_prompt_version_number(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_next_seo_version_number(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_kids() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_reading_activity(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_book_completion(uuid, uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.insert_page_at_position(uuid, integer, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.skip_habit_completion(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_reading_progress(uuid, uuid, integer, boolean, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_reading_progress(uuid, uuid, uuid, integer, boolean) TO authenticated;

-- Non-SECURITY DEFINER helpers used by the app (unchanged, but ensure access)
GRANT EXECUTE ON FUNCTION public.get_next_version_number(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_next_page_prompt_version_number(uuid) TO authenticated;

-- agent_performance_metrics: backend-only writes
DROP POLICY IF EXISTS "System can insert agent performance metrics" ON public.agent_performance_metrics;
DROP POLICY IF EXISTS "System can update agent performance metrics" ON public.agent_performance_metrics;

CREATE POLICY "Service role can insert agent performance metrics"
ON public.agent_performance_metrics
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can update agent performance metrics"
ON public.agent_performance_metrics
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);