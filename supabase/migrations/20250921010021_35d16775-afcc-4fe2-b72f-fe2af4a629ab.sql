-- Create book-covers storage bucket for optimized OpenGraph images
INSERT INTO storage.buckets (id, name, public) VALUES ('book-covers', 'book-covers', true);

-- Create RLS policies for book-covers bucket
CREATE POLICY "Anyone can view book cover images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'book-covers');

CREATE POLICY "Users can upload book covers for their own books" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'book-covers' 
  AND EXISTS (
    SELECT 1 FROM books 
    WHERE id::text = (storage.foldername(name))[1] 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can update book covers for their own books" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'book-covers' 
  AND EXISTS (
    SELECT 1 FROM books 
    WHERE id::text = (storage.foldername(name))[1] 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete book covers for their own books" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'book-covers' 
  AND EXISTS (
    SELECT 1 FROM books 
    WHERE id::text = (storage.foldername(name))[1] 
    AND user_id = auth.uid()
  )
);