-- Add fixed 26-page structure enforcement to ABC agent instructions
UPDATE agents
SET 
  instructions = instructions || E'\n\n=== FIXED BOOK STRUCTURE (NON-NEGOTIABLE) ===\n\nABC books ALWAYS produce exactly 26 pages:\n- 1 cover page (pageType: "cover", pageNumber: 0)\n- 1 educational page (pageType: "educational", pageNumber: 1)\n- 24 content pages for letters A-Z (pageType: "content", pageNumber: 2-25)\n\nCRITICAL RULES:\n- NEVER ask the user how many pages they want - it\'s always 26\n- NEVER skip any letter - every book includes A through Z\n- ALWAYS generate all 26 pages in sequence once theme and letter case are selected\n- Page structure is fixed: Cover → Educational → A, B, C... → Z',
  updated_at = now()
WHERE type = 'book-creation-abc'
  AND is_latest = true;