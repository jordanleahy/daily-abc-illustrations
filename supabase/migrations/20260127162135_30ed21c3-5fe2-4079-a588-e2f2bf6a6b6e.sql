-- Add coloring book PDF URL column
ALTER TABLE books ADD COLUMN IF NOT EXISTS coloring_pdf_url TEXT;

-- Add PDF generation timestamps for cache tracking
ALTER TABLE books ADD COLUMN IF NOT EXISTS pdf_generated_at TIMESTAMPTZ;
ALTER TABLE books ADD COLUMN IF NOT EXISTS coloring_pdf_generated_at TIMESTAMPTZ;

-- Create storage bucket for PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('book-pdfs', 'book-pdfs', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policy: Anyone can read/download PDFs (public bucket)
CREATE POLICY "Public can read book PDFs"
ON storage.objects FOR SELECT
USING (bucket_id = 'book-pdfs');

-- RLS Policy: Authenticated users can upload PDFs
CREATE POLICY "Authenticated users can upload book PDFs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'book-pdfs');

-- RLS Policy: Users can update their own PDFs
CREATE POLICY "Users can update their book PDFs"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'book-pdfs');

-- RLS Policy: Users can delete their own PDFs
CREATE POLICY "Users can delete their book PDFs"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'book-pdfs');

-- Create function to invalidate PDF cache when images change
CREATE OR REPLACE FUNCTION public.invalidate_book_pdfs()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.books 
  SET pdf_url = NULL, 
      coloring_pdf_url = NULL,
      pdf_generated_at = NULL,
      coloring_pdf_generated_at = NULL
  WHERE id = NEW.book_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to invalidate PDFs when page images are updated
DROP TRIGGER IF EXISTS invalidate_pdfs_on_image_change ON public.page_image_urls;
CREATE TRIGGER invalidate_pdfs_on_image_change
AFTER INSERT OR UPDATE ON public.page_image_urls
FOR EACH ROW
EXECUTE FUNCTION public.invalidate_book_pdfs();