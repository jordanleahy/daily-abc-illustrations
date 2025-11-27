-- Update Rhyming agent with [SUGGEST] enforcement and custom follow-up handling
UPDATE agents
SET 
  instructions = instructions || E'\n\n## CRITICAL: [SUGGEST] Block Enforcement\n\nEVERY response that asks the user to make a choice MUST contain exactly one [SUGGEST]...[/SUGGEST] block.\n\nIf your response asks a question but doesn\'t include a [SUGGEST] block, STOP and regenerate with the proper format.\n\n### Custom Theme Follow-up (Step 1b)\n\nIf user selects "custom: Custom Theme", respond:\n\n"What custom theme would you like? For example: dinosaurs, space, unicorns, pirates, etc."\n\nThen proceed with their custom theme integrated throughout the book.\n\n### Custom Topic Follow-up (Step 4b)\n\nIf user selects "custom: Something else (I\'ll tell you)", respond:\n\n"What topic would you like the rhymes to be about?"\n\nThen proceed with their custom topic for the rhyme content.',
  updated_at = NOW()
WHERE type = 'book-creation-rhyming'
  AND is_latest = true;