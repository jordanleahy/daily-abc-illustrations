-- Fix page_type for the duplicated book (260f0bc3-0d4e-442c-885b-8180bb6750d7)
-- Page 1 should be 'cover', Page 2 should be 'educational', rest are 'content'

UPDATE pages
SET page_type = 'cover'
WHERE book_id = '260f0bc3-0d4e-442c-885b-8180bb6750d7'
  AND page_number = 1;

UPDATE pages
SET page_type = 'educational'
WHERE book_id = '260f0bc3-0d4e-442c-885b-8180bb6750d7'
  AND page_number = 2;