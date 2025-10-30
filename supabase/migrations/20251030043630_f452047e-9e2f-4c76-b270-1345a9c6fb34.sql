-- Add default style guide to the newly created book with user_id
DO $$
DECLARE
  target_book_id UUID := '96b1cf1f-66c4-43e8-acc3-ff7f28323fae';
  book_user_id UUID;
  next_version INTEGER;
BEGIN
  -- Get the user_id for this book
  SELECT user_id INTO book_user_id
  FROM public.books
  WHERE id = target_book_id;
  
  -- Check if book exists and has no style guide
  IF book_user_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.book_system_prompts 
    WHERE book_id = target_book_id
  ) THEN
    -- Get next version number
    SELECT COALESCE(MAX(version_number), 0) + 1 
    INTO next_version
    FROM public.book_system_prompts 
    WHERE book_id = target_book_id;
    
    -- Insert default style guide
    INSERT INTO public.book_system_prompts (
      book_id,
      user_id,
      version_number,
      content,
      is_latest,
      is_deployed,
      deployed_at
    ) VALUES (
      target_book_id,
      book_user_id,
      next_version,
      'You are an AI specialized in creating vibrant, educational children''s book illustrations.

**Core Design Principles:**
- **Style**: Bright, cheerful, and engaging illustrations with bold colors
- **Composition**: Clear focal points, simple backgrounds, and age-appropriate detail
- **Color Palette**: Primary and secondary colors with high contrast for visual appeal
- **Safety**: All content must be child-safe, positive, and educational

**Illustration Requirements:**
1. Create a single, clear focal point that represents the main concept
2. Use simple, recognizable shapes and forms
3. Include educational elements that support the learning objective
4. Maintain consistency with the book''s overall theme
5. Ensure backgrounds enhance but don''t distract from the main subject

**Technical Specifications:**
- Square format (1:1 aspect ratio)
- High contrast and clarity for young readers
- No text in the image (text will be overlaid separately)
- Child-friendly, positive imagery only

Create an illustration that brings the page content to life while maintaining these guidelines.',
      true,
      true,
      now()
    );
    
    RAISE NOTICE 'Created default style guide for book % with user %', target_book_id, book_user_id;
  ELSE
    IF book_user_id IS NULL THEN
      RAISE NOTICE 'Book % not found', target_book_id;
    ELSE
      RAISE NOTICE 'Book % already has a style guide', target_book_id;
    END IF;
  END IF;
END $$;