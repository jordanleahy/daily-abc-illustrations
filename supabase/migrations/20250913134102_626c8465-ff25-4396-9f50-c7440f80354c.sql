-- Enable real-time updates for books table
ALTER TABLE public.books REPLICA IDENTITY FULL;

-- Add books table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.books;