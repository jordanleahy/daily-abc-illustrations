-- Allow public access to view expired daily published content
CREATE POLICY "Anyone can view expired daily published content" 
ON public.daily_published 
FOR SELECT 
USING (status = 'expired');