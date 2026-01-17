-- Add policy to allow all authenticated users to view agents marked as is_latest
-- This is needed so users can see the chat orchestration agent and book creation agents
CREATE POLICY "All authenticated users can view latest agents"
ON public.agents
FOR SELECT
TO authenticated
USING (is_latest = true);