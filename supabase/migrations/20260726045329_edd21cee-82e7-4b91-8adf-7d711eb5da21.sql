-- =========================================================
-- 1. Fix mutable search_path
-- =========================================================
ALTER FUNCTION public.extract_colors_from_style_guide(uuid, uuid, text) SET search_path = public;

-- =========================================================
-- 2. Lock down SECURITY DEFINER function EXECUTE privileges
--    Revoke from anon/authenticated on every non-extension
--    SECURITY DEFINER function, then grant back only what
--    the application actually calls.
-- =========================================================
DO $$
DECLARE
  fn record;
BEGIN
  FOR fn IN
    SELECT p.oid::regprocedure::text AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef
      AND NOT EXISTS (
        SELECT 1 FROM pg_depend d WHERE d.objid = p.oid AND d.deptype = 'e'
      )
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon, authenticated', fn.sig);
  END LOOP;
END $$;

-- Functions required by RLS policies (must stay executable by both roles)
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_feature_access(uuid, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_active_subscription(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_book_published(uuid) TO anon, authenticated;

-- Public (unauthenticated) book lookup
GRANT EXECUTE ON FUNCTION public.resolve_public_book_by_slug(text) TO anon, authenticated;

-- Functions invoked by the signed-in application
GRANT EXECUTE ON FUNCTION public.archive_book(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_habit_completion_unified(uuid, uuid, uuid, date, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_switch_goal_from_regular(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_trick_completion_unified(uuid, integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_kid_coins(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_habit_completion_safe(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_kids_with_activity() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_users_with_activity() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_kid_reading_activity(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_library_books_by_completion(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_next_page_image_version_number(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_next_seo_version_number(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_kids() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_reading_activity(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_book_completion(uuid, uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.insert_page_at_position(uuid, integer, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.skip_habit_completion(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_reading_progress(uuid, uuid, integer, boolean, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_reading_progress(uuid, uuid, uuid, integer, boolean) TO authenticated;

-- =========================================================
-- 3. embeddings: remove blanket authenticated read
-- =========================================================
DROP POLICY IF EXISTS "Authenticated users can read embeddings" ON public.embeddings;

CREATE POLICY "Admins can read embeddings"
ON public.embeddings
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- =========================================================
-- 4. page_image_urls: remove unconditional public SELECT
-- =========================================================
DROP POLICY IF EXISTS "Anyone can view all page images" ON public.page_image_urls;

CREATE POLICY "Users can view images for their own pages"
ON public.page_image_urls
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1
    FROM public.books b
    JOIN public.pages p ON p.book_id = b.id
    WHERE p.id = page_image_urls.page_id
      AND b.user_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "Public can view images of published or library books"
ON public.page_image_urls
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.books b
    JOIN public.pages p ON p.book_id = b.id
    WHERE p.id = page_image_urls.page_id
      AND (
        b.is_library_book IS TRUE
        OR b.status = 'published'::publication_status
        OR public.is_book_published(b.id)
      )
  )
);

-- =========================================================
-- 5. Reference catalogs: admin-only writes
-- =========================================================
DROP POLICY IF EXISTS "Authenticated users can insert resorts" ON public.resorts;
DROP POLICY IF EXISTS "Authenticated users can update resorts" ON public.resorts;
DROP POLICY IF EXISTS "Authenticated users can delete resorts" ON public.resorts;

CREATE POLICY "Admins can manage resorts"
ON public.resorts
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Authenticated users can manage brands" ON public.brands;

CREATE POLICY "Admins can manage brands"
ON public.brands
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- =========================================================
-- 6. Storage: book-pdfs ownership enforcement
--    Path convention: <book_id>/<book_id>[-coloring].pdf
-- =========================================================
DROP POLICY IF EXISTS "Authenticated users can upload book PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their book PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their book PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Public can read book PDFs" ON storage.objects;

CREATE POLICY "Book owners can upload their book PDFs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'book-pdfs'
  AND (
    EXISTS (
      SELECT 1 FROM public.books b
      WHERE b.id::text = (storage.foldername(name))[1]
        AND b.user_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  )
);

CREATE POLICY "Book owners can update their book PDFs"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'book-pdfs'
  AND (
    EXISTS (
      SELECT 1 FROM public.books b
      WHERE b.id::text = (storage.foldername(name))[1]
        AND b.user_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  )
);

CREATE POLICY "Book owners can delete their book PDFs"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'book-pdfs'
  AND (
    EXISTS (
      SELECT 1 FROM public.books b
      WHERE b.id::text = (storage.foldername(name))[1]
        AND b.user_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  )
);

CREATE POLICY "Book owners can list their book PDFs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'book-pdfs'
  AND (
    EXISTS (
      SELECT 1 FROM public.books b
      WHERE b.id::text = (storage.foldername(name))[1]
        AND b.user_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  )
);

-- =========================================================
-- 7. Public buckets: stop anonymous listing of all objects.
--    Public CDN URLs remain unaffected (they bypass RLS);
--    only the listing/API SELECT path is scoped to owners.
-- =========================================================
DROP POLICY IF EXISTS "Anyone can view book cover images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view character thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view gemini book covers" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view gemini page images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view page images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view page images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view product images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view videos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view PNG images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view blog images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view all trick photos" ON storage.objects;

-- Owner-folder scoped listing (path convention: <user_id>/...)
CREATE POLICY "Owners can list their own files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id IN (
    'page-images',
    'page-images-png',
    'gemini-page-images',
    'gemini-book-covers',
    'kid-rewards-images',
    'blog-images',
    'trick-photos',
    'videos'
  )
  AND (
    (auth.uid())::text = (storage.foldername(name))[1]
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  )
);

-- Book-folder scoped listing (path convention: <book_id>/...)
CREATE POLICY "Book owners can list their book covers"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'book-covers'
  AND (
    EXISTS (
      SELECT 1 FROM public.books b
      WHERE b.id::text = (storage.foldername(name))[1]
        AND b.user_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  )
);

-- Character thumbnails are shared catalog assets managed by admins
CREATE POLICY "Admins can list character thumbnails"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'character-thumbnails'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);