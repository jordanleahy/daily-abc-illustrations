

# Fix Plan: Persistent Real-Time Questions for Opposites Agent

## Problem Summary

The `book-creation-opposites` agent has **19 questions** with corrupt `sort_order` values. When you toggle or reorder questions, changes don't persist correctly because:

1. **Duplicate sort_order values**: 4 different questions all have `sort_order: 5`
2. **Reorder fetches ALL questions** (enabled + disabled) but the UI only shows enabled first
3. **Array indices used instead of actual values** when swapping positions

---

## Current Database State (Corrupt)

| Question | Enabled | sort_order | Problem |
|----------|---------|------------|---------|
| character_theme | ✅ | 0 | OK |
| opposites_category | ✅ | 1 | OK |
| grade_level | ✅ | 2 | OK |
| city | ✅ | 3 | OK |
| RESORT | ✅ | 4 | OK |
| **SEASON** | ✅ | **5** | Duplicate! |
| **manner_type** | ❌ | **5** | Duplicate! |
| **CUSTOM_NUMBER_RANGE** | ❌ | **5** | Duplicate! |
| **DIGRAPH_FOCUS** | ❌ | **5** | Duplicate! |
| manner_setting | ❌ | 7 | Gap |
| letter_case | ❌ | 8 | |
| ... | ❌ | 100+ | |

---

## Solution: 3 Files, 1 Migration

### Step 1: Database Cleanup Migration

Normalize all `sort_order` values for the opposites agent:

```sql
-- Re-sequence ENABLED questions to [0, 1, 2, 3, 4, 5]
WITH ranked_enabled AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY sort_order, created_at) - 1 as new_order
  FROM agent_questions
  WHERE agent_type = 'book-creation-opposites' AND is_enabled = true
)
UPDATE agent_questions aq
SET sort_order = r.new_order
FROM ranked_enabled r WHERE aq.id = r.id;

-- Set DISABLED questions to high values [100, 101, 102...]
WITH ranked_disabled AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY sort_order, created_at) + 99 as new_order
  FROM agent_questions
  WHERE agent_type = 'book-creation-opposites' AND is_enabled = false
)
UPDATE agent_questions aq
SET sort_order = r.new_order
FROM ranked_disabled r WHERE aq.id = r.id;
```

**Expected Result:**
| Question | Enabled | sort_order |
|----------|---------|------------|
| character_theme | ✅ | 0 |
| opposites_category | ✅ | 1 |
| grade_level | ✅ | 2 |
| city | ✅ | 3 |
| RESORT | ✅ | 4 |
| SEASON | ✅ | 5 |
| manner_type | ❌ | 100 |
| CUSTOM_NUMBER_RANGE | ❌ | 101 |
| ... | ❌ | 102+ |

---

### Step 2: Fix Reorder Mutation

**File:** `src/hooks/useQuestions.ts`

**Problem (lines 268-276):** Fetches ALL questions, uses array indices.

**Fix:** Filter by `is_enabled = true` and swap actual `sort_order` VALUES:

```typescript
// BEFORE (broken)
const { data: agentQuestions } = await supabase
  .from('agent_questions')
  .select('id, question_id, sort_order')
  .eq('agent_type', agentType)  // Fetches ALL 19 questions
  .order('sort_order', { ascending: true });

// Swap uses array indices
.update({ sort_order: currentIndex })  // ❌ Index 1, not value 1

// AFTER (fixed)
const { data: agentQuestions } = await supabase
  .from('agent_questions')
  .select('id, question_id, sort_order')
  .eq('agent_type', agentType)
  .eq('is_enabled', true)  // ✅ Only 6 enabled questions
  .order('sort_order', { ascending: true });

// Swap uses actual values
const currentSortOrder = currentItem.sort_order;
const targetSortOrder = targetItem.sort_order;
.update({ sort_order: currentSortOrder })  // ✅ Actual value
```

---

### Step 3: Fix UI Button Boundaries

**File:** `src/components/agents/AgentQuestionsManager.tsx`

**Problem (lines 111-112):** Uses global list index for first/last detection, but the list contains both enabled AND disabled questions.

```typescript
// BEFORE (broken)
const isFirst = index === 0;  // Global index
const isLast = index === sortedQuestions.length - 1;  // Global index

// AFTER (fixed)
const enabledQuestions = sortedQuestions.filter(q => q.isEnabled);
const enabledIndex = enabledQuestions.findIndex(q => q.id === question.id);
const isInEnabledGroup = enabledIndex !== -1;

// Reorder only within enabled group
const isFirstEnabled = isInEnabledGroup && enabledIndex === 0;
const isLastEnabled = isInEnabledGroup && enabledIndex === enabledQuestions.length - 1;

// Disabled questions cannot be reordered at all
const canMoveUp = isInEnabledGroup && !isFirstEnabled;
const canMoveDown = isInEnabledGroup && !isLastEnabled;
```

---

### Step 4: Enhance Real-Time Subscription

**File:** `src/hooks/useAgentQuestionsSubscription.ts`

**Problem:** Only invalidates queries on change, causing UI flicker.

**Fix:** Add optimistic cache merge for instant updates:

```typescript
// AFTER subscription receives UPDATE event
if (payload.eventType === 'UPDATE' && payload.new) {
  queryClient.setQueryData(
    ['agent-questions', changedAgentType],
    (old: AgentQuestionWithDetails[] | undefined) => {
      if (!old) return old;
      
      // Merge the updated record immediately
      return old.map(item => 
        item.id === (payload.new as any).id
          ? { 
              ...item, 
              is_enabled: (payload.new as any).is_enabled,
              sort_order: (payload.new as any).sort_order 
            }
          : item
      ).sort((a, b) => {
        // Re-sort: enabled first, then by sort_order
        if (a.is_enabled !== b.is_enabled) return a.is_enabled ? -1 : 1;
        return a.sort_order - b.sort_order;
      });
    }
  );
}

// Then also refetch for consistency
queryClient.invalidateQueries({ queryKey: ['agent-questions', changedAgentType] });
```

---

## Files to Modify

| File | Change |
|------|--------|
| `supabase/migrations/XXXXX_fix_opposites_sort_order.sql` | One-time data normalization |
| `src/hooks/useQuestions.ts` | Filter by `is_enabled`, swap actual values |
| `src/components/agents/AgentQuestionsManager.tsx` | Respect enabled/disabled boundary |
| `src/hooks/useAgentQuestionsSubscription.ts` | Optimistic cache merge |

---

## Expected Behavior After Fix

1. **Toggle persists**: Enable/disable updates correctly, re-sequences enabled to `[0,1,2...]`
2. **Reorder persists**: Moving up/down swaps only within enabled group
3. **Real-time sync**: Changes appear instantly across tabs/users
4. **Disabled questions stay put**: Cannot accidentally swap enabled with disabled
5. **Page refresh**: All settings remain exactly as configured

---

## Testing Checklist

- [ ] Refresh page → enabled questions still in correct order
- [ ] Move "grade_level" up → swaps with "opposites_category", persists on refresh
- [ ] Disable "city" → remaining 5 enabled questions re-sequence to [0,1,2,3,4]
- [ ] Enable "THEME" → appears at end of enabled list with sort_order 6
- [ ] Open in 2 browser tabs → toggle in tab A → tab B updates within 1 second
- [ ] Disabled questions show grayed-out reorder buttons (cannot move)

