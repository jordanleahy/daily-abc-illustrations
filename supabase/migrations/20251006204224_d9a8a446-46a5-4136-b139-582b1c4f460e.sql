-- Add admin update policy for daily_published so admins can reorder/requeue any item
CREATE POLICY "Admins can update all daily published"
ON public.daily_published
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));