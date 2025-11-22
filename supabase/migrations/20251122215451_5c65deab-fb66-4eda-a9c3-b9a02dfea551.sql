-- Create storage bucket for trick photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'trick-photos',
  'trick-photos',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
);

-- RLS policies for trick photos
CREATE POLICY "Users can view all trick photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'trick-photos');

CREATE POLICY "Authenticated users can upload trick photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'trick-photos' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own trick photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'trick-photos'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own trick photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'trick-photos'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);