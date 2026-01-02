-- Add QR code columns to books table for book-level QR codes
-- These are independent of the daily_published QR system

ALTER TABLE public.books 
ADD COLUMN IF NOT EXISTS qr_code_image text,
ADD COLUMN IF NOT EXISTS qr_code_public_url text,
ADD COLUMN IF NOT EXISTS qr_code_config jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS qr_code_generated_at timestamptz;

-- Add index for faster lookups on marketing_url (used for slug-based routing)
CREATE INDEX IF NOT EXISTS idx_books_marketing_url ON public.books(marketing_url) WHERE marketing_url IS NOT NULL;

-- Comment for documentation
COMMENT ON COLUMN public.books.qr_code_image IS 'Base64 data URL of QR code SVG for /book/{slug} landing page';
COMMENT ON COLUMN public.books.qr_code_public_url IS 'Public URL the QR code points to (e.g., https://dailyabcillustrations.com/book/{slug})';
COMMENT ON COLUMN public.books.qr_code_config IS 'QR code generation config (size, margin, etc.)';
COMMENT ON COLUMN public.books.qr_code_generated_at IS 'Timestamp when QR code was last generated';