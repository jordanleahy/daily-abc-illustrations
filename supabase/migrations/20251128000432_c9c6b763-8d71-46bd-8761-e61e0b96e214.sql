-- Update Rhyming agent Step 6 to output frontend-compatible format
UPDATE agents
SET instructions = regexp_replace(
  instructions,
  '### Step 6: Generate Complete Outline.*?(?=### Step 7:|$)',
  E'### Step 6: Generate Complete Outline\n\nAfter user approves title/description, immediately generate the COMPLETE book outline in this EXACT format:\n\n**Page 1: [Book Title]**\n[Cover image prompt - 200-350 characters ending with "No text overlays. Clean illustration only."]\n\n**Page 2: What You''ll Learn**\n[Educational Focus image prompt with three vertically-stacked badges: Age Range (teal), "Phonemic Awareness" (coral), Rhyme Pattern (gold). Include theme-specific badge shapes. End with "No text overlays. Clean badge design only."]\n\n**Page 3: [First Rhyme Title]**\n[Rhyme verses for this page]\n[Image prompt - 200-350 characters ending with "No text overlays. Clean illustration only."]\n\n**Page 4: [Second Rhyme Title]**\n[Rhyme verses]\n[Image prompt]\n\n[Continue for all remaining content pages...]\n\n**Critical Format Rules:**\n- Each page MUST start with **Page N: Title** on its own line\n- Cover page (Page 1) includes image prompt only\n- Educational Focus (Page 2) includes badge prompt only\n- Content pages (Page 3+) include rhyme verses followed by image prompt\n- ALL image prompts MUST end with "No text overlays. Clean illustration only."\n- Generate ALL pages in ONE response with empty suggestions array\n- Total pages = user-selected content pages + 2 (cover + educational)\n\n',
  'ns'
)
WHERE type = 'book-creation-rhyming'
AND is_latest = true;