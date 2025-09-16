-- Create daily_published table for public daily ABC illustrations
CREATE TABLE public.daily_published (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  published_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '48 hours'),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add foreign key constraint to books table
ALTER TABLE public.daily_published 
ADD CONSTRAINT daily_published_book_id_fkey 
FOREIGN KEY (book_id) REFERENCES public.books(id) ON DELETE CASCADE;

-- Create index for efficient querying of active daily publications
CREATE INDEX idx_daily_published_active_expires ON public.daily_published (is_active, expires_at DESC) WHERE is_active = true;

-- Enable RLS but make it completely public for reading
ALTER TABLE public.daily_published ENABLE ROW LEVEL SECURITY;

-- Policy for public read access (no authentication required)
CREATE POLICY "Anyone can view daily published content" 
ON public.daily_published 
FOR SELECT 
USING (is_active = true AND expires_at > now());

-- Policy for authenticated users to publish their books
CREATE POLICY "Users can publish their own books daily" 
ON public.daily_published 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  EXISTS (
    SELECT 1 FROM public.books 
    WHERE id = book_id AND user_id = auth.uid()
  )
);

-- Policy for users to update their own daily publications
CREATE POLICY "Users can update their own daily publications" 
ON public.daily_published 
FOR UPDATE 
USING (
  auth.uid() IS NOT NULL AND 
  EXISTS (
    SELECT 1 FROM public.books 
    WHERE id = book_id AND user_id = auth.uid()
  )
);

-- Add trigger for updated_at timestamp
CREATE TRIGGER update_daily_published_updated_at
  BEFORE UPDATE ON public.daily_published
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();