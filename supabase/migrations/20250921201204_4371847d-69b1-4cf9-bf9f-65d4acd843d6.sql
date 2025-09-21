-- Add QR code columns to books table
ALTER TABLE public.books 
ADD COLUMN qr_code_public_url TEXT,
ADD COLUMN qr_code_image TEXT,
ADD COLUMN qr_code_config JSONB DEFAULT '{}'::jsonb,
ADD COLUMN qr_code_generated_at TIMESTAMP WITH TIME ZONE;

-- Drop the book_qr_codes table and all its dependencies
DROP TABLE IF EXISTS public.book_qr_codes CASCADE;