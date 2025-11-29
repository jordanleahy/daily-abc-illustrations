-- Polish Rhyming Book Creation Agent: fix step count, remove non-AABB examples, improve UX

UPDATE agents
SET 
  instructions = REPLACE(
    REPLACE(
      REPLACE(
        instructions,
        '## 7-Step Conversation Flow',
        $$## 6-Step Conversation Flow

(Book type selection happens before this agent is invoked)$$
      ),
      $$### ✅ CORRECT Examples (Self-Contained AABB Couplets):

**Simple AABB Couplets:**
- "The cat in a hat sat on the mat"
  → "cat", "hat" (AA) and "sat", "mat" (BB) rhyme WITHIN ONE title
- "A dog named Spot liked to trot"
  → "Spot" and "trot" rhyme WITHIN ONE title
- "The bee in the tree was happy and free"
  → "bee", "tree" (AA) and "happy", "free" (BB) rhyme WITHIN ONE title
- "Jump and bump, thump thump thump"
  → "jump", "bump" (AA) and "thump" (BB) rhyme WITHIN ONE title
- "Run in the sun, having fun"
  → "run", "sun" (AA) and "fun" (BB) rhyme WITHIN ONE title
- "Splash in the bath, what a laugh"
  → "splash", "bath" (AA) and "laugh" (BB) rhyme WITHIN ONE title
- "Hop to the top, don't you stop"
  → "hop", "top" (AA) and "stop" (BB) rhyme WITHIN ONE title
- "See the bee by the tree"
  → "see", "bee", "tree" all rhyme WITHIN ONE title (AAA pattern)
- "A bear over there without a care"
  → "bear", "there", "care" all rhyme WITHIN ONE title (AAA pattern)$$,
      $$### ✅ CORRECT Examples (Self-Contained AABB Couplets):

**True AABB Couplets:**
- "The cat in a hat sat on the mat"
  → "cat", "hat" (AA) and "sat", "mat" (BB) rhyme WITHIN ONE title
- "The bee in the tree was happy and free"
  → "bee", "tree" (AA) and "happy", "free" (BB) rhyme WITHIN ONE title

**Note:** For younger age groups (0-2 years), simpler AA patterns or AAA patterns are also acceptable as they still provide internal rhyme within each title.$$
    ),
    $$**Your Response:**
"I recommend [X] pages for a [age]-year-old (1 cover + 1 educational focus + [Y] rhyming content pages). Does that work?"$$,
    $$**Your Response:**
"For a [age]-year-old, I recommend **[X] pages** ([total] pages total: 1 cover + 1 educational focus + [Y] rhyming content pages). Would you like a different amount?"$$
  ),
  updated_at = now()
WHERE type = 'book-creation-rhyming'
  AND is_latest = true;