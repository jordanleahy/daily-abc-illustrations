-- Restore ABC agent instructions to generate exactly 28 pages (Cover + Education + 26 letters A-Z)
UPDATE agents
SET 
  instructions = regexp_replace(
    instructions,
    'PAGE COUNT RULES:.*?(?=BOOK STRUCTURE|CRITICAL:|$)',
    E'PAGE COUNT RULES:\n- ABC books MUST have exactly 28 pages total\n- Page 0: Cover page (pageType: "cover")\n- Page 1: Educational Focus page (pageType: "educational")\n- Pages 2-27: Content pages for letters A-Z (pageType: "content")\n- Each letter of the alphabet gets exactly ONE page\n- Letters must appear in sequential order: A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z\n\n',
    'gs'
  ),
  updated_at = now(),
  what_changed = 'Restored 28-page structure: Cover + Education + 26 letters A-Z'
WHERE type = 'abc' 
  AND is_latest = true;