
-- Revised Migration: Add missing cover and educational pages safely
-- Uses a temporary offset strategy to avoid unique constraint violations

DO $$
DECLARE
  book_record RECORD;
  has_cover BOOLEAN;
  has_educational BOOLEAN;
  shift_amount INTEGER;
  temp_offset INTEGER := 10000; -- Temporary offset to avoid conflicts
BEGIN
  -- Loop through all library books
  FOR book_record IN 
    SELECT DISTINCT b.id, b.book_name, b.user_id
    FROM books b
    WHERE b.is_library_book = true
  LOOP
    -- Check if book has cover and educational pages
    SELECT 
      EXISTS(SELECT 1 FROM pages WHERE book_id = book_record.id AND page_type = 'cover') INTO has_cover;
    SELECT 
      EXISTS(SELECT 1 FROM pages WHERE book_id = book_record.id AND page_type = 'educational') INTO has_educational;
    
    -- Determine how many positions to shift existing pages
    shift_amount := 0;
    IF NOT has_cover THEN
      shift_amount := shift_amount + 1;
    END IF;
    IF NOT has_educational THEN
      shift_amount := shift_amount + 1;
    END IF;
    
    -- Only proceed if we need to add pages
    IF shift_amount > 0 THEN
      RAISE NOTICE 'Processing book: % (shifting by %)', book_record.book_name, shift_amount;
      
      -- Phase 1: Add large temporary offset to all existing pages to avoid conflicts
      UPDATE pages 
      SET page_number = page_number + temp_offset
      WHERE book_id = book_record.id;
      
      -- Phase 2: Add cover page if missing (page 0)
      IF NOT has_cover THEN
        INSERT INTO pages (book_id, page_number, page_type, letter, title, description, content)
        VALUES (
          book_record.id,
          0,
          'cover',
          'Cover',
          book_record.book_name,
          'Book cover page',
          jsonb_build_object(
            'mainConcept', 'Cover Page',
            'funFact', '',
            'activity', ''
          )
        );
        RAISE NOTICE 'Added cover page for: %', book_record.book_name;
      END IF;
      
      -- Phase 3: Add educational page if missing (page 1)
      IF NOT has_educational THEN
        INSERT INTO pages (book_id, page_number, page_type, letter, title, description, content)
        VALUES (
          book_record.id,
          1,
          'educational',
          'Introduction',
          'Learning Focus',
          'Educational introduction page',
          jsonb_build_object(
            'mainConcept', 'Welcome to this educational journey!',
            'funFact', 'Learning is an adventure!',
            'activity', 'Get ready to explore and discover new things.'
          )
        );
        RAISE NOTICE 'Added educational page for: %', book_record.book_name;
      END IF;
      
      -- Phase 4: Adjust all shifted pages back down to correct positions
      UPDATE pages 
      SET page_number = page_number - temp_offset + shift_amount
      WHERE book_id = book_record.id 
        AND page_number >= temp_offset;
      
      -- Update book's total_pages
      UPDATE books 
      SET total_pages = (SELECT COUNT(*) FROM pages WHERE book_id = book_record.id),
          updated_at = now()
      WHERE id = book_record.id;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Migration completed successfully!';
END $$;
