-- Add missing storage policies for page-images bucket

-- Allow public to view all page images (bucket is already public)
CREATE POLICY "Anyone can view page images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'page-images');

-- Allow authenticated users to upload page images to their own folder (organized by user_id)
CREATE POLICY "Users can upload page images to their folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'page-images' 
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to update their own page images
CREATE POLICY "Users can update their own page images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'page-images' 
  AND (auth.uid())::text = (storage.foldername(name))[1]
);