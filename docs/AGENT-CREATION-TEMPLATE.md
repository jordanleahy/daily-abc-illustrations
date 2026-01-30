# Agent Creation Quick Reference Template

Copy this checklist when creating a new book agent. Fill in `{typename}` with your agent name.

---

## Agent Details

| Field | Value |
|-------|-------|
| Agent Type ID | `{typename}` |
| Agent Type (DB) | `book-creation-{typename}` |
| Display Label | |
| Expected Pages | |
| Has Optional Questions | Yes / No |
| Needs New Prefixed IDs | Yes / No |

---

## Files to Create

- [ ] `src/types/{typename}.ts` - Type definitions, labels, type guards

---

## Files to Update

### Database (Single Source of Truth)
- [ ] `book_types` table - Add row with id, label, icon_name, agent_type_suffix

### Configuration
- [ ] `src/config/bookTypes.ts` - Add book type entry

### Frontend
- [ ] `src/hooks/useGoogleChat.ts` - Import types, add context handling, ID detection
- [ ] `src/pages/GoogleChat.tsx` - Add state variables, handlers, pass context

### Backend
- [ ] `supabase/functions/google-chat/index.ts`:
  - [ ] Add type detection (`const is{Typename}Book = ...`)
  - [ ] Add state variables from request
  - [ ] Add labels constant
  - [ ] Add context builder
  - [ ] Add discovery question injection (if applicable)
  - [ ] Inject context into systemMessage

---

## Database Changes

### agents table
```sql
INSERT INTO agents (
  name, type, intent, instructions, model,
  max_completion_tokens, top_p, provider,
  operational_status, version, is_latest, user_id
) VALUES (
  '{Agent Name}',
  'book-creation-{typename}',
  '{Intent}',
  '{Instructions}',
  'gpt-5-2025-08-07',
  16000, 1, 'openai',
  'online', 'v1.0.0', true, '{user_id}'
);
```

### type_specific_discoveries table (if needed)
```sql
INSERT INTO type_specific_discoveries (
  agent_type, question_key, question_text,
  sort_order, options, is_required, is_active
) VALUES (
  'book-creation-{typename}',
  '{question_key}',
  '{Question text?}',
  1,
  '[{"key": "PREFIX_opt1", "label": "Label 1"}]',
  false, true
);
```

---

## Testing Checklist

### Conversation Flow
- [ ] Book type selectable from menu
- [ ] Character theme question appears (Step 2)
- [ ] Grade level question appears (Step 3)
- [ ] Optional questions appear one at a time (Step 4)
- [ ] Title proposal only after all questions (Step 5)
- [ ] Outline generation after approval (Step 6)
- [ ] "Create My Book!" button at correct time

### Verification Commands
```bash
# Edge function logs
supabase functions logs google-chat | grep "{typename}"

# Database checks
SELECT * FROM agents WHERE type = 'book-creation-{typename}';
SELECT * FROM type_specific_discoveries WHERE agent_type = 'book-creation-{typename}';
```

---

## ID Prefix Reference

| Domain | Prefix | Example |
|--------|--------|---------|
| Seasons | `SEASON_` | `SEASON_WINTER` |
| Locations | `LOCATION_` | `LOCATION_VAIL_RESORT` |
| Cities | `CITY_` | `CITY_JERSEY_CITY` |
| Environments | `ENV_` | `ENV_mountain` |
| Clothing Brands | `BRAND_` | `BRAND_patagonia` |
| Manner Types | `MANNER_` | `MANNER_eating-habits` |
| Manner Settings | `SETTING_` | `SETTING_home` |
| Themes | `THEME_` | `THEME_adventure` |

---

## Deployment Steps

1. [ ] Run database migrations
2. [ ] Deploy edge function: `supabase functions deploy google-chat`
3. [ ] Test conversation flow end-to-end
4. [ ] Verify all buttons and selections work
5. [ ] Check logs for errors
