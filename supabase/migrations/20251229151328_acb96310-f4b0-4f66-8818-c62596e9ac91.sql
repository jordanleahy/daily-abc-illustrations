-- Add Season and Environment questions to all book-creation agents
-- These are optional final discovery questions before outline generation

UPDATE agents
SET 
  instructions = instructions || E'\n\n## Final Discovery Questions (Optional)\n\nBefore generating the outline, ask these two optional questions:\n\n**Season Question:**\nWould you like the book to have a seasonal theme?\n\n[SUGGEST]\nSPRING: 🌸 Spring\nSUMMER: ☀️ Summer\nFALL: 🍂 Fall\nWINTER: ❄️ Winter\nskip-season: ⏭️ Skip\n[/SUGGEST]\n\n**Environment Question:**\nWould you like the book set in a specific environment?\n\n[SUGGEST]\nCITY: 🏙️ City\nSNOWBOARD_RESORT: 🏂 Snowboard Resort\nSKI_RESORT: ⛷️ Ski Resort\nISLAND: 🏝️ Island\nDESERT: 🏜️ Desert\nMOUNTAIN: 🏔️ Mountain\nPARK: 🌳 Park\nskip-environment: ⏭️ Skip\n[/SUGGEST]\n\nOnly ask these after all other discovery questions are complete, right before generating the outline.',
  last_modified = now(),
  updated_at = now()
WHERE is_latest = true
  AND type LIKE 'book-creation-%';