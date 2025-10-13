-- Phase 1: Gemini Chat-to-Image System - Complete Database Isolation
-- Purpose: Create isolated tables for Gemini-only chat interface
-- Zero risk to existing OpenAI-based books system

-- ============================================================================
-- 1. Create gemini_books table
-- ============================================================================
CREATE TABLE public.gemini_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  book_name TEXT NOT NULL,
  book_description TEXT,
  category TEXT,
  total_pages INTEGER DEFAULT 26,
  status publication_status DEFAULT 'draft'::publication_status,
  is_highlighted BOOLEAN DEFAULT false,
  product_description TEXT,
  pdf_url TEXT,
  current_system_prompt_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.gemini_books IS 'Books created via Gemini-only chat interface - completely isolated from OpenAI books';

CREATE INDEX idx_gemini_books_user_id ON public.gemini_books(user_id);
CREATE INDEX idx_gemini_books_status ON public.gemini_books(status);

CREATE TRIGGER update_gemini_books_updated_at 
  BEFORE UPDATE ON public.gemini_books 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 2. Create gemini_pages table
-- ============================================================================
CREATE TABLE public.gemini_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES public.gemini_books(id) ON DELETE CASCADE,
  letter TEXT NOT NULL,
  page_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  content JSONB,
  current_system_prompt_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(book_id, letter),
  UNIQUE(book_id, page_number)
);

COMMENT ON TABLE public.gemini_pages IS 'Pages for Gemini-generated books - isolated from OpenAI pages';

CREATE INDEX idx_gemini_pages_book_id ON public.gemini_pages(book_id);
CREATE INDEX idx_gemini_pages_letter ON public.gemini_pages(letter);

CREATE TRIGGER update_gemini_pages_updated_at 
  BEFORE UPDATE ON public.gemini_pages 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 3. Create gemini_page_images table
-- ============================================================================
CREATE TABLE public.gemini_page_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES public.gemini_pages(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.gemini_books(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  image_url TEXT,
  version_number INTEGER NOT NULL DEFAULT 1,
  is_latest BOOLEAN NOT NULL DEFAULT true,
  generation_status TEXT NOT NULL DEFAULT 'not_started',
  generation_started_at TIMESTAMPTZ,
  generation_completed_at TIMESTAMPTZ,
  generation_duration_ms INTEGER,
  error_message TEXT,
  prompt_used TEXT,
  source_type TEXT NOT NULL DEFAULT 'gemini_generated',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.gemini_page_images IS 'Images generated via Gemini Flash-Image-Preview model';

CREATE INDEX idx_gemini_page_images_page_id ON public.gemini_page_images(page_id);
CREATE INDEX idx_gemini_page_images_book_id ON public.gemini_page_images(book_id);
CREATE INDEX idx_gemini_page_images_user_id ON public.gemini_page_images(user_id);
CREATE INDEX idx_gemini_page_images_latest ON public.gemini_page_images(page_id, is_latest) WHERE is_latest = true;

CREATE TRIGGER update_gemini_page_images_updated_at 
  BEFORE UPDATE ON public.gemini_page_images 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to manage is_latest flag
CREATE OR REPLACE FUNCTION handle_gemini_image_version()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.is_latest = true THEN
    UPDATE public.gemini_page_images 
    SET is_latest = false 
    WHERE page_id = NEW.page_id 
    AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER manage_gemini_image_latest 
  BEFORE INSERT OR UPDATE ON public.gemini_page_images 
  FOR EACH ROW 
  EXECUTE FUNCTION handle_gemini_image_version();

-- ============================================================================
-- 4. Create gemini_chat_sessions table
-- ============================================================================
CREATE TABLE public.gemini_chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_name TEXT,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  agent_id UUID,
  model_used TEXT DEFAULT 'google/gemini-2.5-flash',
  total_tokens_used INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  last_message_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.gemini_chat_sessions IS 'Chat conversation history for Gemini-only chat interface';

CREATE INDEX idx_gemini_chat_sessions_user_id ON public.gemini_chat_sessions(user_id);
CREATE INDEX idx_gemini_chat_sessions_active ON public.gemini_chat_sessions(user_id, is_active) WHERE is_active = true;

CREATE TRIGGER update_gemini_chat_sessions_updated_at 
  BEFORE UPDATE ON public.gemini_chat_sessions 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 5. Helper function for version numbering
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_next_gemini_image_version_number(p_page_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_version INTEGER;
BEGIN
  SELECT COALESCE(MAX(version_number), 0) + 1
  INTO next_version
  FROM public.gemini_page_images
  WHERE page_id = p_page_id;
  
  RETURN next_version;
END;
$$;

-- ============================================================================
-- 6. Enable RLS on all Gemini tables
-- ============================================================================
ALTER TABLE public.gemini_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gemini_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gemini_page_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gemini_chat_sessions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 7. RLS Policies for gemini_books
-- ============================================================================
CREATE POLICY "Users can view their own gemini books"
  ON public.gemini_books FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own gemini books"
  ON public.gemini_books FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own gemini books"
  ON public.gemini_books FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own gemini books"
  ON public.gemini_books FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all gemini books"
  ON public.gemini_books FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all gemini books"
  ON public.gemini_books FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete all gemini books"
  ON public.gemini_books FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- ============================================================================
-- 8. RLS Policies for gemini_pages
-- ============================================================================
CREATE POLICY "Users can view pages of their own gemini books"
  ON public.gemini_pages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.gemini_books 
    WHERE gemini_books.id = gemini_pages.book_id 
    AND gemini_books.user_id = auth.uid()
  ));

CREATE POLICY "Users can create pages for their own gemini books"
  ON public.gemini_pages FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.gemini_books 
    WHERE gemini_books.id = gemini_pages.book_id 
    AND gemini_books.user_id = auth.uid()
  ));

CREATE POLICY "Users can update pages of their own gemini books"
  ON public.gemini_pages FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.gemini_books 
    WHERE gemini_books.id = gemini_pages.book_id 
    AND gemini_books.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete pages of their own gemini books"
  ON public.gemini_pages FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.gemini_books 
    WHERE gemini_books.id = gemini_pages.book_id 
    AND gemini_books.user_id = auth.uid()
  ));

CREATE POLICY "Admins can view all gemini pages"
  ON public.gemini_pages FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all gemini pages"
  ON public.gemini_pages FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete all gemini pages"
  ON public.gemini_pages FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- ============================================================================
-- 9. RLS Policies for gemini_page_images
-- ============================================================================
CREATE POLICY "Users can view images for their own gemini pages"
  ON public.gemini_page_images FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.gemini_books b
    JOIN public.gemini_pages p ON p.book_id = b.id
    WHERE p.id = gemini_page_images.page_id 
    AND b.user_id = auth.uid()
  ));

CREATE POLICY "Users can create images for their own gemini pages"
  ON public.gemini_page_images FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.gemini_books b
      JOIN public.gemini_pages p ON p.book_id = b.id
      WHERE p.id = gemini_page_images.page_id 
      AND b.user_id = auth.uid()
    )
    AND auth.uid() = user_id
  );

CREATE POLICY "Users can update images for their own gemini pages"
  ON public.gemini_page_images FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.gemini_books b
    JOIN public.gemini_pages p ON p.book_id = b.id
    WHERE p.id = gemini_page_images.page_id 
    AND b.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete images for their own gemini pages"
  ON public.gemini_page_images FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.gemini_books b
    JOIN public.gemini_pages p ON p.book_id = b.id
    WHERE p.id = gemini_page_images.page_id 
    AND b.user_id = auth.uid()
  ));

CREATE POLICY "Admins can view all gemini images"
  ON public.gemini_page_images FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all gemini images"
  ON public.gemini_page_images FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete all gemini images"
  ON public.gemini_page_images FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- ============================================================================
-- 10. RLS Policies for gemini_chat_sessions
-- ============================================================================
CREATE POLICY "Users can view their own gemini chat sessions"
  ON public.gemini_chat_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own gemini chat sessions"
  ON public.gemini_chat_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own gemini chat sessions"
  ON public.gemini_chat_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own gemini chat sessions"
  ON public.gemini_chat_sessions FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all gemini chat sessions"
  ON public.gemini_chat_sessions FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- ============================================================================
-- 11. Create storage buckets for Gemini system
-- ============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('gemini-page-images', 'gemini-page-images', true),
  ('gemini-book-covers', 'gemini-book-covers', true);

-- ============================================================================
-- 12. Storage RLS Policies for gemini-page-images
-- ============================================================================
CREATE POLICY "Users can upload their own gemini page images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'gemini-page-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own gemini page images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'gemini-page-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own gemini page images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'gemini-page-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Anyone can view gemini page images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'gemini-page-images');

-- ============================================================================
-- 13. Storage RLS Policies for gemini-book-covers
-- ============================================================================
CREATE POLICY "Users can upload their own gemini book covers"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'gemini-book-covers' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own gemini book covers"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'gemini-book-covers' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own gemini book covers"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'gemini-book-covers' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Anyone can view gemini book covers"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'gemini-book-covers');