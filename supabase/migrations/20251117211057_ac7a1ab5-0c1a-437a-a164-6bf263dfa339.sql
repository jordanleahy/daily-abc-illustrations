-- Update Bear Family Counts to Ten book to be a library book
UPDATE books 
SET is_library_book = true,
    updated_at = NOW()
WHERE id = '1b8cc2b6-2c25-4b64-a318-21a3ad2d06d0';