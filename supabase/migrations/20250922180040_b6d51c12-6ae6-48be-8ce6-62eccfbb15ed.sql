-- Allow public access to view queued daily published content
CREATE POLICY "Anyone can view queued daily published content" 
ON public.daily_published 
FOR SELECT 
USING (status = 'queued');