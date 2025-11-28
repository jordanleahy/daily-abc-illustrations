-- Update ABC agent instructions to use valid backend age ranges and add skip logic
UPDATE agents
SET 
  instructions = REPLACE(
    instructions,
    E'### Step 2: Age Group Selection\n\nAsk: "What''s the age of the child this book is for?"\n\n[SUGGEST]\nages-1-2: 1-2 years old\nages-2-3: 2-3 years old\nages-3-4: 3-4 years old\nages-4-5: 4-5 years old\n[/SUGGEST]',
    E'### Step 2: Age Group Selection (SKIP IF AGE ALREADY PROVIDED)\n\n**IMPORTANT:** If the child''s age is already in the context (from kid profile), skip this step entirely and proceed directly to Step 3.\n\nIf age is NOT provided, ask: "What''s the age of the child this book is for?"\n\n[SUGGEST]\n0-2: 0-2 years (Babies/Toddlers)\n2-4: 2-4 years (Toddlers/Preschool)\n4-6: 4-6 years (Preschool/Kindergarten)\n[/SUGGEST]'
  ),
  updated_at = now()
WHERE type = 'book-creation-abc' AND is_latest = true;