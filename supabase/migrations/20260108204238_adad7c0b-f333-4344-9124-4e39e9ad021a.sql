-- Add city column to books table for city-specific book associations
ALTER TABLE public.books 
ADD COLUMN city TEXT;

-- Create index for efficient city lookups
CREATE INDEX idx_books_city ON public.books(city);

-- Add comment for documentation
COMMENT ON COLUMN public.books.city IS 'City slug for city-specific landing pages (e.g., jerseycity, hoboken)';