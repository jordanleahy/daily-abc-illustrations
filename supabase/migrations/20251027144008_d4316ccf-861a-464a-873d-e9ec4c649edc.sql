-- Optimize insert_page_at_position function to update all pages in a single query
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
BEGIN
  -- Calculate new page number (insert after the specified page)
  v_new_page_number := p_insert_after_page_number + 1;
  
  -- Shift all subsequent pages up by 1 in a single UPDATE statement
  UPDATE pages
  SET 
    page_number = page_number + 1,
    letter = v_alphabet[((page_number) % 26) + 1]
  WHERE book_id = p_book_id 
    AND page_number >= v_new_page_number;
  
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