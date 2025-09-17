-- Create SEO metadata table with versioning
CREATE TABLE public.seo_metadata (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  daily_published_id UUID NOT NULL,
  user_id UUID NOT NULL,
  version_number INTEGER NOT NULL DEFAULT 1,
  is_latest BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  seo_title TEXT,
  seo_description TEXT,
  og_image_url TEXT,
  source_data JSONB,
  generation_metadata JSONB,
  optimization_status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  optimized_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE public.seo_metadata ENABLE ROW LEVEL SECURITY;

-- Create function to get next version number
CREATE OR REPLACE FUNCTION public.get_next_seo_version_number(p_daily_published_id uuid)
RETURNS integer
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  RETURN COALESCE(
    (SELECT MAX(version_number) + 1 FROM public.seo_metadata WHERE daily_published_id = p_daily_published_id),
    1
  );
END;
$$;

-- Create function to handle SEO metadata versioning
CREATE OR REPLACE FUNCTION public.handle_seo_metadata_version()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  -- If this is being set as latest, mark all others as not latest for this daily_published_id
  IF NEW.is_latest = true THEN
    UPDATE public.seo_metadata 
    SET is_latest = false 
    WHERE daily_published_id = NEW.daily_published_id 
    AND id != NEW.id;
  END IF;
  
  -- Set optimized_at timestamp when status changes to complete
  IF NEW.optimization_status = 'complete' AND (OLD.optimization_status IS NULL OR OLD.optimization_status != 'complete') THEN
    NEW.optimized_at = now();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for SEO metadata versioning
CREATE TRIGGER seo_metadata_version_trigger
  BEFORE INSERT OR UPDATE ON public.seo_metadata
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_seo_metadata_version();

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_seo_metadata_updated_at
  BEFORE UPDATE ON public.seo_metadata
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create RLS policies
CREATE POLICY "Users can create SEO metadata for their own daily publications" 
ON public.seo_metadata 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM daily_published dp
    JOIN books b ON b.id = dp.book_id
    WHERE dp.id = seo_metadata.daily_published_id 
    AND b.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view SEO metadata for their own daily publications" 
ON public.seo_metadata 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM daily_published dp
    JOIN books b ON b.id = dp.book_id
    WHERE dp.id = seo_metadata.daily_published_id 
    AND b.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update SEO metadata for their own daily publications" 
ON public.seo_metadata 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM daily_published dp
    JOIN books b ON b.id = dp.book_id
    WHERE dp.id = seo_metadata.daily_published_id 
    AND b.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete SEO metadata for their own daily publications" 
ON public.seo_metadata 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM daily_published dp
    JOIN books b ON b.id = dp.book_id
    WHERE dp.id = seo_metadata.daily_published_id 
    AND b.user_id = auth.uid()
  )
);

CREATE POLICY "Anyone can view active, completed SEO metadata for public content" 
ON public.seo_metadata 
FOR SELECT 
USING (
  is_active = true AND 
  optimization_status = 'complete' AND
  EXISTS (
    SELECT 1 FROM daily_published dp
    WHERE dp.id = seo_metadata.daily_published_id 
    AND dp.is_active = true 
    AND (dp.expires_at IS NULL OR dp.expires_at > now())
  )
);

-- Admin policies
CREATE POLICY "Admins can view all SEO metadata" 
ON public.seo_metadata 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all SEO metadata" 
ON public.seo_metadata 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete all SEO metadata" 
ON public.seo_metadata 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for performance
CREATE INDEX idx_seo_metadata_daily_published_id ON public.seo_metadata(daily_published_id);
CREATE INDEX idx_seo_metadata_user_id ON public.seo_metadata(user_id);
CREATE INDEX idx_seo_metadata_is_latest ON public.seo_metadata(daily_published_id, is_latest) WHERE is_latest = true;
CREATE INDEX idx_seo_metadata_status ON public.seo_metadata(optimization_status);