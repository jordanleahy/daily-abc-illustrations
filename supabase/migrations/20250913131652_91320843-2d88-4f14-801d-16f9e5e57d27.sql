-- Enable real-time updates for book_system_prompts table
ALTER TABLE public.book_system_prompts REPLICA IDENTITY FULL;

-- Add the table to the supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.book_system_prompts;