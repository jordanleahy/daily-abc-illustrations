-- Allow admins to manage cities (add/update/delete)
CREATE POLICY "Admins can manage cities"
ON public.cities
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Drop the old service_role only policy since admins should manage this
DROP POLICY IF EXISTS "Service role can manage cities" ON public.cities;

-- Make questions publicly readable (reference data)
DROP POLICY IF EXISTS "Questions viewable by authenticated" ON public.questions;

CREATE POLICY "Questions are publicly readable"
ON public.questions
FOR SELECT
USING (true);