-- Fix existing books where total_pages doesn't match actual page count
UPDATE books 
SET total_pages = subquery.actual_count
FROM (
  SELECT book_id, COUNT(*) as actual_count 
  FROM pages 
  GROUP BY book_id
) AS subquery
WHERE books.id = subquery.book_id 
  AND books.total_pages != subquery.actual_count;