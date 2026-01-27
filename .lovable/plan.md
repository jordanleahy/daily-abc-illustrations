
# Plan: Remove Hardcoded Audience References from Opposites Agent

## Problem Summary
The opposites book creation agent is responding with hardcoded text like "Opposites are a fundamental concept for toddlers to learn" before any discovery questions are answered. This violates the data-driven approach where audience/age should be determined by the `grade_level` discovery question, not assumed from user input.

## Root Causes Identified
1. The `opposites_complexity` question description contains "(Designed for toddlers and early learners)" - hardcoded text
2. The `grade_level` question is disabled for the opposites agent (should be enabled)
3. The agent instructions lack a directive to NOT assume audience from user messages

## Solution Steps

### Step 1: Update Agent Instructions
Add a "NO HARDCODED AUDIENCE" directive to the opposites agent's system instructions to prevent it from echoing or assuming age/audience context from user messages.

**Add to instructions:**
```text
## CRITICAL: NO HARDCODED AUDIENCE

❌ NEVER assume or reference a specific age group (toddler, preschool, etc.)
❌ NEVER echo age-related terms from user messages in your responses
❌ NEVER say things like "perfect for toddlers" or "great for young children"
✅ Keep initial responses age-neutral
✅ Let the grade_level discovery question determine the target audience
✅ Generic phrases like "age-appropriate" are acceptable only AFTER grade is selected
```

### Step 2: Enable Grade Level Question
Enable the `grade_level` question for the opposites agent so that target audience is properly asked through the data-driven discovery system.

**Database update:**
```sql
UPDATE agent_questions 
SET is_enabled = true, sort_order = 1
WHERE agent_type = 'book-creation-opposites' AND question_id = 'grade_level';
```

### Step 3: Remove Hardcoded Text from Complexity Question
Update the `opposites_complexity` question description to remove the "(Designed for toddlers and early learners)" text.

**Database update:**
```sql
UPDATE questions 
SET description = 'How simple should the opposite pairs be?'
WHERE id = 'opposites_complexity';
```

### Step 4: Re-sequence Discovery Questions
Ensure proper sort order after enabling grade_level:
- `character_theme` (0)
- `grade_level` (1)
- `opposites_category` (2)
- `city` (3)
- `RESORT` (4)
- `SEASON` (5)

---

## Technical Details

### Files Changed
- **Database: `agents` table** - Update instructions for `book-creation-opposites`
- **Database: `agent_questions` table** - Enable and re-order `grade_level`
- **Database: `questions` table** - Remove hardcoded text from `opposites_complexity` description

### Expected Behavior After Fix
1. Agent will NOT say "fundamental concept for toddlers" in opening response
2. Agent will ask grade_level as the 2nd discovery question (after character theme)
3. Age-appropriate content will be determined by the user's grade_level selection
4. The complexity question options (if enabled later) will not reference specific age groups in descriptions
