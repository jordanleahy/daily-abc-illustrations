-- Create book_qr_codes table for managing QR code metadata
CREATE TABLE public.book_qr_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  daily_published_id UUID REFERENCES public.daily_published(id) ON DELETE CASCADE,
  public_url TEXT NOT NULL,
  qr_code_config JSONB DEFAULT '{}'::jsonb,
  generation_status TEXT DEFAULT 'complete' CHECK (generation_status IN ('pending', 'complete', 'error')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.book_qr_codes ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX idx_book_qr_codes_book_id ON public.book_qr_codes(book_id);
CREATE INDEX idx_book_qr_codes_daily_published_id ON public.book_qr_codes(daily_published_id);
CREATE INDEX idx_book_qr_codes_user_id ON public.book_qr_codes(user_id);

-- RLS Policies
CREATE POLICY "Users can view QR codes for their own books" 
ON public.book_qr_codes 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM books 
  WHERE books.id = book_qr_codes.book_id 
  AND books.user_id = auth.uid()
));

CREATE POLICY "Users can create QR codes for their own books" 
ON public.book_qr_codes 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM books 
  WHERE books.id = book_qr_codes.book_id 
  AND books.user_id = auth.uid()
) AND auth.uid() = user_id);

CREATE POLICY "Users can update QR codes for their own books" 
ON public.book_qr_codes 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM books 
  WHERE books.id = book_qr_codes.book_id 
  AND books.user_id = auth.uid()
));

CREATE POLICY "Users can delete QR codes for their own books" 
ON public.book_qr_codes 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM books 
  WHERE books.id = book_qr_codes.book_id 
  AND books.user_id = auth.uid()
));

CREATE POLICY "Anyone can view QR codes for active daily published books" 
ON public.book_qr_codes 
FOR SELECT 
USING (is_active = true AND EXISTS (
  SELECT 1 FROM daily_published dp 
  WHERE dp.id = book_qr_codes.daily_published_id 
  AND dp.is_active = true 
  AND (dp.expires_at IS NULL OR dp.expires_at > now())
));

CREATE POLICY "Admins can view all QR codes" 
ON public.book_qr_codes 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all QR codes" 
ON public.book_qr_codes 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete all QR codes" 
ON public.book_qr_codes 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_book_qr_codes_updated_at
    BEFORE UPDATE ON public.book_qr_codes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();