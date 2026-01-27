

# Plan: Remove Hardcoded Age/Grade Mentions from Book-Creation Agents

## Objective
Update 4 book-creation agents to remove specific audience assumptions, making them fully data-driven. Generic phrases like "age-appropriate" will be retained since they adapt based on discovery question responses.

---

## Agents Requiring Updates

### 1. book-creation-abc

**Current (line ~92, 123, 157):**
```
You are a specialized AI agent for creating educational ABC illustrations for young children.
```
```
Use bright, engaging colors appropriate for early learners
```

**Updated:**
```
You are a specialized AI agent for creating educational ABC illustrations.
```
```
Use bright, engaging colors
```

---

### 2. book-creation-cvc

**Current (line ~186):**
```
Your role is to guide parents through creating personalized phonics books that help early readers distinguish between similar CVC words.
```

**Updated:**
```
Your role is to guide parents through creating personalized phonics books that help distinguish between similar CVC words.
```

---

### 3. book-creation-rhyming

**Current (line ~39):**
```
You are a specialized AI agent for creating engaging rhyming illustrations for children in Pre-K through 2nd Grade.
```

**Updated:**
```
You are a specialized AI agent for creating engaging rhyming illustrations.
```

---

## Implementation Steps

### Step 1: Update book-creation-abc Agent
Execute SQL to update the instructions field:
- Remove "for young children" from role description
- Remove "appropriate for early learners" from image prompt requirements

### Step 2: Update book-creation-cvc Agent
Execute SQL to update the instructions field:
- Remove "early readers" from role description

### Step 3: Update book-creation-rhyming Agent
Execute SQL to update the instructions field:
- Remove "for children in Pre-K through 2nd Grade" from role description

### Step 4: Verify Updates
Query the agents table to confirm all 4 agents no longer contain hardcoded audience mentions.

---

## SQL Migration

```sql
-- Update ABC agent
UPDATE public.agents 
SET instructions = REPLACE(
  REPLACE(instructions, 
    'for young children', ''),
  'appropriate for early learners', '')
WHERE type = 'book-creation-abc' AND is_latest = true;

-- Update CVC agent  
UPDATE public.agents
SET instructions = REPLACE(instructions,
  'that help early readers distinguish',
  'that help distinguish')
WHERE type = 'book-creation-cvc' AND is_latest = true;

-- Update Rhyming agent
UPDATE public.agents
SET instructions = REPLACE(instructions,
  'for children in Pre-K through 2nd Grade',
  '')
WHERE type = 'book-creation-rhyming' AND is_latest = true;
```

---

## Validation

After migration, verify with:
```sql
SELECT type, name
FROM agents 
WHERE type LIKE 'book-creation%' 
  AND is_latest = true
  AND (
    LOWER(instructions) LIKE '%young children%' OR
    LOWER(instructions) LIKE '%early reader%' OR
    LOWER(instructions) LIKE '%pre-k%' OR
    LOWER(instructions) LIKE '%kindergarten%'
  );
-- Should return 0 rows
```

---

## What Stays Unchanged

The following generic phrases will be preserved as they adapt based on discovery context:
- "age-appropriate content" (adapts to selected grade)
- "child-friendly" (generic safety term)
- "Age-appropriate vocabulary" (adapts to grade level)

---

## Expected Outcome

After this update:
1. No agent assumes a specific audience level in its base instructions
2. Audience context flows exclusively from:
   - Selected child profile (calculated age)
   - `grade_level` discovery question (when enabled)
   - User's explicit input during chat
3. Agents remain flexible and adapt to whatever audience context is provided via the data-driven discovery system

