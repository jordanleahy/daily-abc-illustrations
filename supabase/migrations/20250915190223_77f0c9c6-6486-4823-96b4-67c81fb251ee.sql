-- Create exports table for managing all media exports
CREATE TABLE public.exports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content_type TEXT NOT NULL, -- 'book', 'page', etc.
  content_id UUID NOT NULL,   -- references book.id, page.id, etc.
  export_type TEXT NOT NULL,  -- 'pdf', 'epub', 'image', etc.
  export_status TEXT NOT NULL DEFAULT 'not_started', -- using ProcessStatus enum values
  export_url TEXT,            -- storage URL when complete
  export_config JSONB,        -- format-specific settings (quality, page size, etc.)
  file_size_bytes INTEGER,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE public.exports ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own exports" 
ON public.exports 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own exports" 
ON public.exports 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own exports" 
ON public.exports 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own exports" 
ON public.exports 
FOR DELETE 
USING (auth.uid() = user_id);

-- Admin policies
CREATE POLICY "Admins can view all exports" 
ON public.exports 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all exports" 
ON public.exports 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete all exports" 
ON public.exports 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_exports_updated_at
BEFORE UPDATE ON public.exports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_exports_user_id ON public.exports(user_id);
CREATE INDEX idx_exports_content ON public.exports(content_type, content_id);
CREATE INDEX idx_exports_status ON public.exports(export_status);

-- Create storage bucket for exports
INSERT INTO storage.buckets (id, name, public) VALUES ('exports', 'exports', true);

-- Create storage policies for exports
CREATE POLICY "Users can view their own export files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'exports' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own export files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'exports' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own export files" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'exports' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own export files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'exports' AND auth.uid()::text = (storage.foldername(name))[1]);