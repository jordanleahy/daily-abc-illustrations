-- Fix overly permissive RLS policy for cities table
-- Drop the permissive policy and create a more restrictive one
DROP POLICY IF EXISTS "Authenticated users can manage cities" ON public.cities;

-- Only allow insert/update/delete for service role (admin operations)
-- Regular authenticated users should not modify reference data
CREATE POLICY "Service role can manage cities"
  ON public.cities
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');