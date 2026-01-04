-- First, ensure 'archived' exists in the publication_status enum
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'archived' 
    AND enumtypid = 'public.publication_status'::regtype
  ) THEN
    ALTER TYPE public.publication_status ADD VALUE 'archived';
  END IF;
END $$;

-- Create the archive_book RPC function
CREATE OR REPLACE FUNCTION public.archive_book(p_book_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_updated_count INTEGER;
  v_is_admin BOOLEAN;
BEGIN
  -- Check if user is admin
  v_is_admin := public.has_role(auth.uid(), 'admin'::app_role);
  
  -- Atomically update the book (ownership check in WHERE clause)
  UPDATE public.books
  SET 
    status = 'archived',
    is_library_book = false,
    updated_at = now()
  WHERE id = p_book_id
    AND (user_id = auth.uid() OR v_is_admin);
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  
  -- If no rows updated, either book doesn't exist or user doesn't have permission
  IF v_updated_count = 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Book not found or permission denied'
    );
  END IF;
  
  -- Remove from daily_published queue (if exists)
  DELETE FROM public.daily_published
  WHERE book_id = p_book_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'book_id', p_book_id,
    'archived_at', now()
  );
END;
$$;