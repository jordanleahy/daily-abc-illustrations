-- Fix security issue: Set explicit search_path for insert_page_at_position function
CREATE OR REPLACE FUNCTION insert_page_at_position(
  p_book_id UUID,
  p_insert_after_page_number INTEGER,
  p_title TEXT,
  p_description TEXT
) RETURNS pages AS $$
DECLARE
  v_new_page_number INTEGER;
  v_new_letter TEXT;
  v_new_page pages;
  v_alphabet TEXT[] := ARRAY['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];
  v_page_to_update RECORD;
BEGIN
  -- Calculate new page number (insert after the specified page)
  v_new_page_number := p_insert_after_page_number + 1;
  
  -- Shift all subsequent pages up by 1 (process in reverse order to avoid conflicts)
  FOR v_page_to_update IN 
    SELECT id, page_number 
    FROM pages 
    WHERE book_id = p_book_id 
      AND page_number >= v_new_page_number
    ORDER BY page_number DESC
  LOOP
    UPDATE pages
    SET 
      page_number = v_page_to_update.page_number + 1,
      letter = v_alphabet[((v_page_to_update.page_number) % 26) + 1]
    WHERE id = v_page_to_update.id;
  END LOOP;
  
  -- Calculate letter for new page
  v_new_letter := v_alphabet[((v_new_page_number - 1) % 26) + 1];
  
  -- Insert the new page
  INSERT INTO pages (
    book_id,
    page_number,
    letter,
    title,
    description,
    content
  ) VALUES (
    p_book_id,
    v_new_page_number,
    v_new_letter,
    p_title,
    NULLIF(p_description, ''),
    jsonb_build_object('mainConcept', '', 'funFact', '', 'activity', '')
  )
  RETURNING * INTO v_new_page;
  
  RETURN v_new_page;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';