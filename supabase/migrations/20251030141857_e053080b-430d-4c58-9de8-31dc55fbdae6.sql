-- Add color_palettes table for structured color storage
CREATE TABLE IF NOT EXISTS public.color_palettes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  style_guide_id UUID REFERENCES public.book_system_prompts(id) ON DELETE SET NULL,
  
  -- Color values in both formats for consistency
  primary_hex TEXT NOT NULL,
  primary_hsl TEXT NOT NULL,
  primary_usage TEXT,
  
  secondary_hex TEXT NOT NULL,
  secondary_hsl TEXT NOT NULL,
  secondary_usage TEXT,
  
  accent_hex TEXT NOT NULL,
  accent_hsl TEXT NOT NULL,
  accent_usage TEXT,
  
  supporting_hex TEXT,
  supporting_hsl TEXT,
  supporting_usage TEXT,
  
  background_hex TEXT NOT NULL,
  background_hsl TEXT NOT NULL,
  background_usage TEXT,
  
  text_hex TEXT NOT NULL,
  text_hsl TEXT NOT NULL,
  text_usage TEXT,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for quick lookups
CREATE INDEX idx_color_palettes_book_active ON public.color_palettes(book_id, is_active);

-- Only one active palette per book
CREATE UNIQUE INDEX idx_color_palettes_unique_active ON public.color_palettes(book_id) 
WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.color_palettes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view color palettes for their own books"
  ON public.color_palettes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.books
      WHERE books.id = color_palettes.book_id
      AND books.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create color palettes for their own books"
  ON public.color_palettes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.books
      WHERE books.id = color_palettes.book_id
      AND books.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update color palettes for their own books"
  ON public.color_palettes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.books
      WHERE books.id = color_palettes.book_id
      AND books.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete color palettes for their own books"
  ON public.color_palettes FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.books
      WHERE books.id = color_palettes.book_id
      AND books.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all color palettes"
  ON public.color_palettes FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Teachers can view all color palettes"
  ON public.color_palettes FOR SELECT
  USING (has_role(auth.uid(), 'teacher'));

-- Add reference images table for character persistence
CREATE TABLE IF NOT EXISTS public.page_reference_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id UUID NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  image_url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Only one active reference per page
  UNIQUE(page_id, is_active)
);

-- Index for quick lookups
CREATE INDEX idx_page_reference_images_page_active ON public.page_reference_images(page_id, is_active);

-- Enable RLS
ALTER TABLE public.page_reference_images ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reference images
CREATE POLICY "Users can view reference images for their own pages"
  ON public.page_reference_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.books b
      JOIN public.pages p ON p.book_id = b.id
      WHERE p.id = page_reference_images.page_id
      AND b.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create reference images for their own pages"
  ON public.page_reference_images FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.books b
      JOIN public.pages p ON p.book_id = b.id
      WHERE p.id = page_reference_images.page_id
      AND b.user_id = auth.uid()
    )
    AND auth.uid() = user_id
  );

CREATE POLICY "Users can update reference images for their own pages"
  ON public.page_reference_images FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.books b
      JOIN public.pages p ON p.book_id = b.id
      WHERE p.id = page_reference_images.page_id
      AND b.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all reference images"
  ON public.page_reference_images FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Function to extract and store colors from style guide
CREATE OR REPLACE FUNCTION public.extract_colors_from_style_guide(
  p_book_id UUID,
  p_style_guide_id UUID,
  p_style_guide_content TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_style_guide_json JSONB;
  v_color_palette_id UUID;
  v_palette JSONB;
BEGIN
  -- Try to parse the style guide as JSON
  BEGIN
    v_style_guide_json := p_style_guide_content::JSONB;
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Style guide content is not valid JSON';
  END;
  
  -- Extract color palette
  v_palette := v_style_guide_json -> 'colorPalette';
  
  IF v_palette IS NULL THEN
    RAISE EXCEPTION 'No colorPalette found in style guide JSON';
  END IF;
  
  -- Deactivate existing palettes for this book
  UPDATE public.color_palettes
  SET is_active = false, updated_at = NOW()
  WHERE book_id = p_book_id AND is_active = true;
  
  -- Insert new color palette
  INSERT INTO public.color_palettes (
    book_id,
    style_guide_id,
    primary_hex,
    primary_hsl,
    primary_usage,
    secondary_hex,
    secondary_hsl,
    secondary_usage,
    accent_hex,
    accent_hsl,
    accent_usage,
    supporting_hex,
    supporting_hsl,
    supporting_usage,
    background_hex,
    background_hsl,
    background_usage,
    text_hex,
    text_hsl,
    text_usage,
    is_active
  ) VALUES (
    p_book_id,
    p_style_guide_id,
    COALESCE(v_palette -> 'primary' ->> 'hex', '#000000'),
    COALESCE(v_palette -> 'primary' ->> 'hsl', 'hsl(0, 0%, 0%)'),
    v_palette -> 'primary' ->> 'usage',
    COALESCE(v_palette -> 'secondary' ->> 'hex', '#666666'),
    COALESCE(v_palette -> 'secondary' ->> 'hsl', 'hsl(0, 0%, 40%)'),
    v_palette -> 'secondary' ->> 'usage',
    COALESCE(v_palette -> 'accent' ->> 'hex', '#FF5733'),
    COALESCE(v_palette -> 'accent' ->> 'hsl', 'hsl(9, 100%, 60%)'),
    v_palette -> 'accent' ->> 'usage',
    v_palette -> 'supporting' ->> 'hex',
    v_palette -> 'supporting' ->> 'hsl',
    v_palette -> 'supporting' ->> 'usage',
    COALESCE(v_palette -> 'background' ->> 'hex', '#FFFFFF'),
    COALESCE(v_palette -> 'background' ->> 'hsl', 'hsl(0, 0%, 100%)'),
    v_palette -> 'background' ->> 'usage',
    COALESCE(v_palette -> 'text' ->> 'hex', '#000000'),
    COALESCE(v_palette -> 'text' ->> 'hsl', 'hsl(0, 0%, 0%)'),
    v_palette -> 'text' ->> 'usage',
    true
  )
  RETURNING id INTO v_color_palette_id;
  
  RETURN v_color_palette_id;
END;
$$;