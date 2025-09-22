-- Step 1: Add QR code columns to daily_published table
ALTER TABLE public.daily_published 
ADD COLUMN qr_code_image text,
ADD COLUMN qr_code_public_url text,
ADD COLUMN qr_code_config jsonb DEFAULT '{}'::jsonb,
ADD COLUMN qr_code_generated_at timestamp with time zone;

-- Step 2: Migrate existing QR code data from books to daily_published
UPDATE public.daily_published 
SET 
  qr_code_image = books.qr_code_image,
  qr_code_public_url = books.qr_code_public_url,
  qr_code_config = books.qr_code_config,
  qr_code_generated_at = books.qr_code_generated_at
FROM public.books 
WHERE daily_published.book_id = books.id 
  AND books.qr_code_image IS NOT NULL;

-- Step 3: Remove QR code columns from books table
ALTER TABLE public.books 
DROP COLUMN qr_code_image,
DROP COLUMN qr_code_public_url,
DROP COLUMN qr_code_config,
DROP COLUMN qr_code_generated_at;

-- Step 4: Add RLS policy for public QR code access on daily_published
CREATE POLICY "Anyone can view QR code data for active daily published content"
ON public.daily_published
FOR SELECT
USING (
  is_active = true 
  AND (expires_at IS NULL OR expires_at > now())
  AND status = 'active'
);