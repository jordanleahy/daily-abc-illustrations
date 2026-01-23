-- Apply ZERO INVENTION POLICY to all book creation agents
-- This prepends the policy header to existing instructions

UPDATE agents 
SET instructions = '## 🚨 CRITICAL: ZERO INVENTION POLICY 🚨

**ABSOLUTE PROHIBITION:** You are FORBIDDEN from inventing ANY discovery questions or options.

❌ NEVER ask questions not in the injected [SUGGEST] block
❌ NEVER invent options like story types, formats, or styles
❌ NEVER create your own discovery flow
❌ ONLY use questions from the dynamic [SUGGEST] blocks at the end of this prompt

' || instructions,
    what_changed = 'Added ZERO INVENTION POLICY header to prevent LLM hallucination of discovery questions',
    last_modified = now()
WHERE type IN (
    'book-creation',
    'book-creation-abc',
    'book-creation-animals',
    'book-creation-bedtime',
    'book-creation-colors',
    'book-creation-cvc',
    'book-creation-digraphs',
    'book-creation-dr-seuss',
    'book-creation-emotions',
    'book-creation-first-words',
    'book-creation-general',
    'book-creation-manners',
    'book-creation-numbers',
    'book-creation-opposites',
    'book-creation-parent-education',
    'book-creation-shapes',
    'book-creation-sight-words'
) AND is_latest = true;