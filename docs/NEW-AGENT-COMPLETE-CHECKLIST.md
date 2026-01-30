# New Book Agent Creation - Complete Checklist

This is a comprehensive, step-by-step operational checklist for creating a new book-creation agent. Follow every section to avoid missing files or database entries.

---

## Pre-Creation Planning

Before writing any code, answer these questions:

| Question | Your Answer |
|----------|-------------|
| Agent type ID (e.g., `manners`, `dr-seuss`) | |
| Display label (e.g., "Manners Book") | |
| Expected page count | |
| Does it need optional discovery questions? | Yes / No |
| Does it need new prefixed IDs? | Yes / No |
| Does it need custom edge function logic? | Yes / No |

### ID Collision Prevention Planning

If your agent introduces new selection options, determine if they need prefixes:

**Need Prefixes When:**
- The ID word could match another domain (e.g., "WINTER" as season vs location)
- Multiple option types exist for the same agent (e.g., manner type + manner setting)
- The ID is a common word that might appear in book titles

**Standard Prefix Patterns:**
| Domain | Prefix | Example |
|--------|--------|---------|
| Seasons | `SEASON_` | `SEASON_WINTER`, `SEASON_SPRING` |
| Locations | `LOCATION_` | `LOCATION_VAIL_RESORT`, `LOCATION_PARK_CITY` |
| Cities | `CITY_` | `CITY_JERSEY_CITY`, `CITY_DENVER` |
| Environments | `ENV_` | `ENV_mountain`, `ENV_beach` |
| Clothing Brands | `BRAND_` | `BRAND_patagonia`, `BRAND_northface` |
| Manner Types | `MANNER_` | `MANNER_eating-habits`, `MANNER_respect` |
| Manner Settings | `SETTING_` | `SETTING_home`, `SETTING_school` |
| Themes | `THEME_` | `THEME_adventure`, `THEME_friendship` |

---

## Phase 1: Database Setup

### 1.1 Create Agent in `agents` Table

```sql
INSERT INTO agents (
  name,
  type,
  intent,
  instructions,
  model,
  max_completion_tokens,
  top_p,
  provider,
  operational_status,
  version,
  is_latest,
  user_id
) VALUES (
  'Your Agent Name',
  'book-creation-{typename}',  -- e.g., 'book-creation-manners'
  'Your agent intent description',
  'Full agent instructions here...',
  'gpt-5-2025-08-07',
  16000,
  1,
  'openai',
  'online',
  'v1.0.0',
  true,
  'your-user-id'
);
```

### 1.2 Add Discovery Questions (If Needed)

Only if your agent needs optional questions before title approval:

```sql
INSERT INTO type_specific_discoveries (
  agent_type,
  question_key,
  question_text,
  sort_order,
  options,
  is_required,
  is_active
) VALUES (
  'book-creation-{typename}',
  'your_question_key',
  'Your question text to ask the user?',
  1,  -- Order in which to ask
  '[{"key": "PREFIX_option1", "label": "Option 1 Label"}, {"key": "PREFIX_option2", "label": "Option 2 Label"}]',
  false,  -- true if required, false if optional
  true
);
```

**CRITICAL:** Use prefixed keys in options to prevent ID collisions!

---

## Phase 2: Type Definitions (Frontend)

### 2.1 Create Type Definition File

Create `src/types/{newType}.ts`:

```typescript
/**
 * {NewType} Types and Constants
 * 
 * IDs use the {PREFIX_} prefix to prevent collisions with other option types.
 * See src/types/idRegistry.ts for the central ID registry.
 */

/**
 * Valid {NewType} IDs - all prefixed with {PREFIX_}
 */
export type {NewType}Id = 
  | '{PREFIX_}option1'
  | '{PREFIX_}option2'
  | '{PREFIX_}option3';

/**
 * Display labels for {NewType} options
 */
export const {NEW_TYPE}_LABELS: Record<{NewType}Id, string> = {
  '{PREFIX_}option1': 'Option 1 Label',
  '{PREFIX_}option2': 'Option 2 Label',
  '{PREFIX_}option3': 'Option 3 Label',
};

/**
 * Type guard to check if a string is a valid {NewType}Id
 */
export function isValid{NewType}(value: string): value is {NewType}Id {
  return value in {NEW_TYPE}_LABELS;
}

/**
 * Get display label for a {NewType}Id
 */
export function get{NewType}Label(id: {NewType}Id): string {
  return {NEW_TYPE}_LABELS[id] || id;
}
```

### 2.2 Update ID Registry

Edit `src/types/idRegistry.ts`:

```typescript
// Add to ID_PREFIX object (around line 17)
export const ID_PREFIX = {
  // ... existing prefixes
  {NEW_TYPE}: '{PREFIX_}',
} as const;

// Add type guard export (around line 77)
export const is{NewType}Id = (id: string): boolean => hasPrefix(id, ID_PREFIX.{NEW_TYPE});
```

### 2.3 Update Shared Agent Types

Edit `src/types/shared/agent.ts`:

Add a row to the `book_types` database table (via admin UI or migration):

```sql
INSERT INTO book_types (id, label, icon_name, expected_page_count, agent_type_suffix, is_active)
VALUES ('{typename}', 'Type Display Name', 'BookIcon', 12, '{typename}', true);
```

The agent type is automatically derived as `'book-creation-' + agent_type_suffix`.
No code changes needed - the database is the single source of truth.

### 2.4 Update Book Types Config

Edit `src/config/bookTypes.ts`:

```typescript
// Add to BOOK_TYPES array
{
  id: '{typename}',
  label: 'Your Book Type Label',
  icon: 'IconName',  // From lucide-react
  prompt: 'Description shown to user when selecting this book type',
  description: 'Longer description for the book type',
  color: 'from-amber-500 to-orange-600',  // Gradient colors
  expectedPageCount: 12,  // Or 28 for ABC books
},
```

---

## Phase 3: Edge Function Updates

Edit `supabase/functions/google-chat/index.ts`:

### 3.1 Add Type Detection (Near Top of Handler)

```typescript
// Around line 166, after other book type checks
const is{NewType}Book = bookType === '{typename}';
```

### 3.2 Add State Variables from Request

```typescript
// Around line 180, in request parsing section
const {newTypeField} = requestBody.{newTypeField} || null;
const {newTypeField2} = requestBody.{newTypeField2} || null;
```

### 3.3 Add Labels Constant

```typescript
// Near other label constants (around line 100)
const {NEW_TYPE}_LABELS: Record<string, string> = {
  '{PREFIX_}option1': 'Option 1 Label',
  '{PREFIX_}option2': 'Option 2 Label',
  '{PREFIX_}option3': 'Option 3 Label',
};
```

### 3.4 Add Context Builders

```typescript
// After other context builders
let {newType}Context = '';
if (is{NewType}Book && {newTypeField}) {
  const label = {NEW_TYPE}_LABELS[{newTypeField}] || {newTypeField};
  {newType}Context = `\n\n📚 Selected {NewType}: ${label}`;
}
```

### 3.5 Add Discovery Question Injection (If Using Optional Questions)

```typescript
// Around line 380, in the discovery questions section
let {newType}DiscoveryQuestionsContext = '';

if (is{NewType}Book) {
  // Determine which questions are already answered
  const answeredQuestions: string[] = [];
  if ({field1}) answeredQuestions.push('question_key_1');
  if ({field2}) answeredQuestions.push('question_key_2');
  
  // Fetch unanswered discovery questions
  const discoveries = await fetchTypeDiscoveries('book-creation-{typename}');
  const unansweredDiscoveries = discoveries.filter(d => !answeredQuestions.includes(d.question_key));
  
  if (unansweredDiscoveries.length > 0) {
    const nextQuestion = unansweredDiscoveries[0];
    const remainingCount = unansweredDiscoveries.length;
    
    {newType}DiscoveryQuestionsContext = `\n\n🚫 HARD BLOCK - DO NOT GENERATE OUTLINE YET 🚫
There are still ${remainingCount} optional question(s) to ask before you can propose a title or generate the outline.

📋 YOU MUST ASK THIS QUESTION NOW:
${nextQuestion.question_text}

[SUGGEST]
${nextQuestion.options.map(opt => `${opt.key}: ${opt.label}`).join('\n')}
[/SUGGEST]

⚠️ CRITICAL RULES:
1. DO NOT propose a book title yet
2. DO NOT generate any page outline or content
3. DO NOT show "✅ Create My Book!" button
4. ASK the above question and WAIT for user response
5. After user responds, check for the NEXT optional question

This is Step 4 in the conversation flow. Step 5 (Title Approval) comes AFTER all optional questions.`;
    
    console.log(`📋 {NewType} discovery: Asking "${nextQuestion.question_key}" (${remainingCount} remaining)`);
  }
}
```

### 3.6 Inject Context Into System Message

```typescript
// Around line 480, where systemMessage is constructed
const systemMessage = baseSystemPrompt
  // ... other contexts
  + {newType}Context
  + {newType}DiscoveryQuestionsContext;
```

---

## Phase 4: Frontend Hook Updates

Edit `src/hooks/useGoogleChat.ts`:

### 4.1 Import New Types

```typescript
import { {NewType}Id, isValid{NewType} } from '@/types/{newType}';
import { hasPrefix, ID_PREFIX } from '@/types/idRegistry';
```

### 4.2 Add to Context Interface

```typescript
// In the sendMessage context parameter type
interface MessageContext {
  // ... existing fields
  {newTypeField}?: {NewType}Id | null;
}
```

### 4.3 Add ID Detection in Action Parsing

```typescript
// In the action parsing section (around line 300)
if (hasPrefix(actionId, ID_PREFIX.{NEW_TYPE})) {
  // Handle {newType} selection
  context.{newTypeField} = actionId as {NewType}Id;
}
```

---

## Phase 5: Page Component Updates

Edit `src/pages/GoogleChat.tsx`:

### 5.1 Add State Variables

```typescript
const [selected{NewType}, setSelected{NewType}] = useState<{NewType}Id | null>(null);
```

### 5.2 Import Types

```typescript
import { {NewType}Id } from '@/types/{newType}';
```

### 5.3 Add Button Click Handler

```typescript
// In handleButtonClick or handleSuggestionClick
if (hasPrefix(actionId, ID_PREFIX.{NEW_TYPE})) {
  setSelected{NewType}(actionId as {NewType}Id);
}
```

### 5.4 Pass Context to sendMessage

```typescript
// When calling sendMessage
await sendMessage(content, undefined, messages, {
  // ... other context
  {newTypeField}: selected{NewType},
});
```

---

## Phase 6: Testing Checklist

### Conversation Flow Testing

- [ ] User can select the new book type from the main menu
- [ ] Agent asks character theme question (Step 2)
- [ ] Agent asks grade level question (Step 3)
- [ ] Agent asks all optional questions ONE at a time (Step 4)
- [ ] Agent does NOT propose title until all optional questions answered
- [ ] Agent proposes title with approval buttons (Step 5)
- [ ] Agent generates outline only after title approval (Step 6)
- [ ] "Create My Book!" button appears at correct time

### Edge Function Testing

```bash
# Check logs for discovery question flow
supabase functions logs google-chat | grep "discovery"
```

### Database Verification

```sql
-- Verify agent exists
SELECT id, type, name FROM agents WHERE type = 'book-creation-{typename}';

-- Verify discovery questions
SELECT * FROM type_specific_discoveries WHERE agent_type = 'book-creation-{typename}';
```

---

## Common Issues and Debugging

### Issue: Optional questions not appearing
- Check `type_specific_discoveries` table has correct `agent_type`
- Verify `is_active = true` for questions
- Check edge function logs for discovery fetch errors

### Issue: Questions appearing at wrong time
- Verify the "HARD BLOCK" context is being injected
- Check that `answeredQuestions` array correctly tracks selections
- Ensure `fetchTypeDiscoveries()` is called for your agent type

### Issue: ID not recognized
- Verify prefix is registered in `idRegistry.ts`
- Check `hasPrefix()` is using correct prefix constant
- Ensure database options use prefixed keys

### Issue: Context not passed to AI
- Verify context variable is added to `systemMessage` concatenation
- Check request parsing extracts the field from `requestBody`
- Ensure frontend sends the field in the context object

---

## Files Changed Summary

| File | Action | Purpose |
|------|--------|---------|
| `src/types/{newType}.ts` | CREATE | Type definitions and labels |
| `src/types/idRegistry.ts` | UPDATE | Register ID prefix |
| `src/types/shared/agent.ts` | UPDATE | Add agent type |
| `src/config/bookTypes.ts` | UPDATE | Add book type config |
| `src/hooks/useGoogleChat.ts` | UPDATE | Add context handling |
| `src/pages/GoogleChat.tsx` | UPDATE | Add state and handlers |
| `supabase/functions/google-chat/index.ts` | UPDATE | Add all backend logic |
| `agents` table | INSERT | Create agent record |
| `type_specific_discoveries` table | INSERT | Add optional questions |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-15 | Initial version based on Manners agent learnings |
