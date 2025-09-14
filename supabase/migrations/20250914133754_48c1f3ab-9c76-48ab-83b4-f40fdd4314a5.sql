-- Create storage bucket for page images
INSERT INTO storage.buckets (id, name, public) VALUES ('page-images', 'page-images', true);

-- Create storage policies for page images
CREATE POLICY "Users can view page images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'page-images');

CREATE POLICY "Users can upload page images for their books" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'page-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their page images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'page-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their page images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'page-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create page_image_urls table
CREATE TABLE public.page_image_urls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id UUID NOT NULL,
  book_id UUID NOT NULL,
  user_id UUID NOT NULL,
  version_number INTEGER NOT NULL DEFAULT 1,
  image_url TEXT,
  generation_status TEXT NOT NULL DEFAULT 'not_started',
  generation_started_at TIMESTAMP WITH TIME ZONE,
  generation_completed_at TIMESTAMP WITH TIME ZONE,
  generation_duration_ms INTEGER,
  prompt_used TEXT,
  error_message TEXT,
  is_latest BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.page_image_urls ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for page_image_urls
CREATE POLICY "Users can view images for their own pages" 
ON public.page_image_urls 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM books b
  JOIN pages p ON p.book_id = b.id
  WHERE p.id = page_image_urls.page_id AND b.user_id = auth.uid()
));

CREATE POLICY "Users can create images for their own pages" 
ON public.page_image_urls 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM books b
  JOIN pages p ON p.book_id = b.id
  WHERE p.id = page_image_urls.page_id AND b.user_id = auth.uid()
) AND auth.uid() = user_id);

CREATE POLICY "Users can update images for their own pages" 
ON public.page_image_urls 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM books b
  JOIN pages p ON p.book_id = b.id
  WHERE p.id = page_image_urls.page_id AND b.user_id = auth.uid()
));

CREATE POLICY "Users can delete images for their own pages" 
ON public.page_image_urls 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM books b
  JOIN pages p ON p.book_id = b.id
  WHERE p.id = page_image_urls.page_id AND b.user_id = auth.uid()
));

-- Admin policies
CREATE POLICY "Admins can view all page images" 
ON public.page_image_urls 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all page images" 
ON public.page_image_urls 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete all page images" 
ON public.page_image_urls 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create function to get next version number for page images
CREATE OR REPLACE FUNCTION public.get_next_page_image_version_number(p_page_id uuid)
RETURNS integer
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  RETURN COALESCE(
    (SELECT MAX(version_number) + 1 FROM public.page_image_urls WHERE page_id = p_page_id),
    1
  );
END;
$$;

-- Create function to handle page image version management
CREATE OR REPLACE FUNCTION public.handle_page_image_version()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  -- If this is being set as latest, mark all others as not latest for this page
  IF NEW.is_latest = true THEN
    UPDATE public.page_image_urls 
    SET is_latest = false 
    WHERE page_id = NEW.page_id 
    AND id != NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for page image version management
CREATE TRIGGER handle_page_image_version_trigger
  BEFORE UPDATE ON public.page_image_urls
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_page_image_version();

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_page_image_urls_updated_at
  BEFORE UPDATE ON public.page_image_urls
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_page_image_urls_page_id ON public.page_image_urls(page_id);
CREATE INDEX idx_page_image_urls_latest ON public.page_image_urls(page_id, is_latest) WHERE is_latest = true;