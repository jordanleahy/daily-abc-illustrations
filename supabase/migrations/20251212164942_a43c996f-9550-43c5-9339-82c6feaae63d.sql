-- Update 6 specialized agents to include explicit 12-page structure
-- This ensures consistency: 1 Cover + 1 Educational Focus + 10 Content pages

-- Animals Agent
UPDATE agents 
SET instructions = instructions || E'\n\n---\n\n**CRITICAL PAGE STRUCTURE (12 pages total):**\n- Page 1 = Cover (ALWAYS displays book title prominently)\n- Page 2 = Educational Focus (ALWAYS has three colorful badges)\n- Pages 3-12 = Content pages (10 animal-themed pages)\n\n**NEVER start with content on Page 1 or Page 2!**\n\n### Generate Complete Outline (CRITICAL)\n\nAfter user approves title/description, IMMEDIATELY generate the complete 12-page outline in a SINGLE response:\n\n**EXACT OUTPUT FORMAT:**\n\n**Page 1: [Book Title]**\n[Cover image prompt 200-350 chars. MUST include: "CRITICAL INSTRUCTION: Display the book title in large, bold, CENTERED letters at the center of the cover image, taking up 50-60% of the visual space."]\n\n**Page 2: Educational Focus**\n[Three vertically-stacked colorful badges - Age Range (teal), "Animal Recognition" (coral), Learning Focus (gold). End with "No text overlays. Clean illustration only."]\n\n**Page 3: [First Animal Title]**\n[Animal content image prompt 200-350 chars ending with "No text overlays. Clean illustration only."]\n\n...continue through **Page 12**...\n\nGenerate ALL 12 pages with empty suggestions array.',
    last_modified = now(),
    updated_at = now()
WHERE type = 'book-creation-animals' AND is_latest = true;

-- Bedtime Agent
UPDATE agents 
SET instructions = instructions || E'\n\n---\n\n**CRITICAL PAGE STRUCTURE (12 pages total):**\n- Page 1 = Cover (ALWAYS displays book title prominently)\n- Page 2 = Educational Focus (ALWAYS has three colorful badges)\n- Pages 3-12 = Content pages (10 bedtime-themed pages)\n\n**NEVER start with content on Page 1 or Page 2!**\n\n### Generate Complete Outline (CRITICAL)\n\nAfter user approves title/description, IMMEDIATELY generate the complete 12-page outline in a SINGLE response:\n\n**EXACT OUTPUT FORMAT:**\n\n**Page 1: [Book Title]**\n[Cover image prompt 200-350 chars. MUST include: "CRITICAL INSTRUCTION: Display the book title in large, bold, CENTERED letters at the center of the cover image, taking up 50-60% of the visual space."]\n\n**Page 2: Educational Focus**\n[Three vertically-stacked colorful badges - Age Range (teal), "Bedtime Routine" (coral), Learning Focus (gold). End with "No text overlays. Clean illustration only."]\n\n**Page 3: [First Bedtime Step Title]**\n[Bedtime content image prompt 200-350 chars ending with "No text overlays. Clean illustration only."]\n\n...continue through **Page 12**...\n\nGenerate ALL 12 pages with empty suggestions array.',
    last_modified = now(),
    updated_at = now()
WHERE type = 'book-creation-bedtime' AND is_latest = true;

-- Colors Agent
UPDATE agents 
SET instructions = instructions || E'\n\n---\n\n**CRITICAL PAGE STRUCTURE (12 pages total):**\n- Page 1 = Cover (ALWAYS displays book title prominently)\n- Page 2 = Educational Focus (ALWAYS has three colorful badges)\n- Pages 3-12 = Content pages (10 color-themed pages, ONE color per page)\n\n**NEVER start with content on Page 1 or Page 2!**\n\n### Generate Complete Outline (CRITICAL)\n\nAfter user approves title/description, IMMEDIATELY generate the complete 12-page outline in a SINGLE response:\n\n**EXACT OUTPUT FORMAT:**\n\n**Page 1: [Book Title]**\n[Cover image prompt 200-350 chars. MUST include: "CRITICAL INSTRUCTION: Display the book title in large, bold, CENTERED letters at the center of the cover image, taking up 50-60% of the visual space."]\n\n**Page 2: Educational Focus**\n[Three vertically-stacked colorful badges - Age Range (teal), "Color Recognition" (coral), Learning Focus (gold). End with "No text overlays. Clean illustration only."]\n\n**Page 3: [Color Name] - [Object]**\n[Color content image prompt 200-350 chars with 3-5 objects in that color, ending with "No text overlays. Clean illustration only."]\n\n...continue through **Page 12**...\n\nGenerate ALL 12 pages with empty suggestions array.',
    last_modified = now(),
    updated_at = now()
WHERE type = 'book-creation-colors' AND is_latest = true;

-- First Words Agent
UPDATE agents 
SET instructions = instructions || E'\n\n---\n\n**CRITICAL PAGE STRUCTURE (12 pages total):**\n- Page 1 = Cover (ALWAYS displays book title prominently)\n- Page 2 = Educational Focus (ALWAYS has three colorful badges)\n- Pages 3-12 = Content pages (10 vocabulary-building pages)\n\n**NEVER start with content on Page 1 or Page 2!**\n\n### Generate Complete Outline (CRITICAL)\n\nAfter user approves title/description, IMMEDIATELY generate the complete 12-page outline in a SINGLE response:\n\n**EXACT OUTPUT FORMAT:**\n\n**Page 1: [Book Title]**\n[Cover image prompt 200-350 chars. MUST include: "CRITICAL INSTRUCTION: Display the book title in large, bold, CENTERED letters at the center of the cover image, taking up 50-60% of the visual space."]\n\n**Page 2: Educational Focus**\n[Three vertically-stacked colorful badges - Age Range (teal), "Vocabulary Building" (coral), Learning Focus (gold). End with "No text overlays. Clean illustration only."]\n\n**Page 3: [First Word]**\n[First word content image prompt 200-350 chars ending with "No text overlays. Clean illustration only."]\n\n...continue through **Page 12**...\n\nGenerate ALL 12 pages with empty suggestions array.',
    last_modified = now(),
    updated_at = now()
WHERE type = 'book-creation-first-words' AND is_latest = true;

-- Numbers Agent
UPDATE agents 
SET instructions = instructions || E'\n\n---\n\n**CRITICAL PAGE STRUCTURE (12 pages total):**\n- Page 1 = Cover (ALWAYS displays book title prominently)\n- Page 2 = Educational Focus (ALWAYS has three colorful badges)\n- Pages 3-12 = Content pages (10 number-themed pages with numeric digits)\n\n**NEVER start with content on Page 1 or Page 2!**\n\n### Generate Complete Outline (CRITICAL)\n\nAfter user approves title/description, IMMEDIATELY generate the complete 12-page outline in a SINGLE response:\n\n**EXACT OUTPUT FORMAT:**\n\n**Page 1: [Book Title]**\n[Cover image prompt 200-350 chars. MUST include: "CRITICAL INSTRUCTION: Display the book title in large, bold, CENTERED letters at the center of the cover image, taking up 50-60% of the visual space."]\n\n**Page 2: Educational Focus**\n[Three vertically-stacked colorful badges - Age Range (teal), "Number Recognition" (coral), Counting Focus (gold). End with "No text overlays. Clean illustration only."]\n\n**Page 3: [Number] [Objects]**\n[Number content image prompt 200-350 chars with numeric digit and counting objects, ending with "No text overlays. Clean illustration only."]\n\n...continue through **Page 12**...\n\nGenerate ALL 12 pages with empty suggestions array.',
    last_modified = now(),
    updated_at = now()
WHERE type = 'book-creation-numbers' AND is_latest = true;

-- Shapes Agent
UPDATE agents 
SET instructions = instructions || E'\n\n---\n\n**CRITICAL PAGE STRUCTURE (12 pages total):**\n- Page 1 = Cover (ALWAYS displays book title prominently)\n- Page 2 = Educational Focus (ALWAYS has three colorful badges)\n- Pages 3-12 = Content pages (10 shape-themed pages)\n\n**NEVER start with content on Page 1 or Page 2!**\n\n### Generate Complete Outline (CRITICAL)\n\nAfter user approves title/description, IMMEDIATELY generate the complete 12-page outline in a SINGLE response:\n\n**EXACT OUTPUT FORMAT:**\n\n**Page 1: [Book Title]**\n[Cover image prompt 200-350 chars. MUST include: "CRITICAL INSTRUCTION: Display the book title in large, bold, CENTERED letters at the center of the cover image, taking up 50-60% of the visual space."]\n\n**Page 2: Educational Focus**\n[Three vertically-stacked colorful badges - Age Range (teal), "Shape Recognition" (coral), Learning Focus (gold). End with "No text overlays. Clean illustration only."]\n\n**Page 3: [Shape Name]**\n[Shape content image prompt 200-350 chars with real-world objects featuring that shape, ending with "No text overlays. Clean illustration only."]\n\n...continue through **Page 12**...\n\nGenerate ALL 12 pages with empty suggestions array.',
    last_modified = now(),
    updated_at = now()
WHERE type = 'book-creation-shapes' AND is_latest = true;