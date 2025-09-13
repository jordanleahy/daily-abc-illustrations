-- Enable realtime for page_system_prompts table
ALTER TABLE public.page_system_prompts REPLICA IDENTITY FULL;

-- Add table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.page_system_prompts;