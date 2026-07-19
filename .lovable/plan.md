## Goal
Lock down the "Create My Book!" flow so the regression we just fixed (chip tap → no city resolved → silent block) can't return. The click path involves too much of `GoogleChat.tsx` (2100+ lines, mutations, sessions) to mount end-to-end cheaply, so we test the exact gate that failed as a pure unit — the same way `useResolvedCity` is already covered.

## Changes

### 1. Extract the proceed-gate into a pure helper
New file `src/utils/resolveProceedCity.ts`. Move the "last-chance inference + block decision" block from `handleQuickReply` (currently `src/pages/GoogleChat.tsx` lines ~1147–1168) into:

```ts
resolveProceedCity({ action, activeCity, cities, matchCityInText })
  → { status: 'ok', city } | { status: 'inferred', city } | { status: 'blocked' }
```

Rules (unchanged behavior):
- If `activeCity` set → `ok`.
- Else try `matchCityInText(action.label)` then `matchCityInText(action.value)` with `allowReverseInclude:true, minMatchLen:3` → `inferred`.
- Else `blocked`.

Update `GoogleChat.tsx` `handleQuickReply` to call the helper and keep the existing side effects (setSelectedCity on `inferred`, toast + scroll on `blocked`, `handleCreateBook()` on `ok`/`inferred`). No behavior change.

### 2. Regression tests
New file `src/utils/resolveProceedCity.test.ts` covering the exact cases that broke:

- Chip carries explicit `cityId` and `activeCity` already set → `ok`, no inference.
- Chip has no `cityId` but its label is "New York City" → `inferred`, returns `NEW_YORK_CITY`.
- Chip label is "NYC" / "New York" (looser typed forms) → `inferred`, returns `NEW_YORK_CITY`.
- Chip label carries no city, `activeCity` null, no match in cities → `blocked`.
- Longest-label-first: label "New York City bridges" resolves to `NEW_YORK_CITY`, not `YORK`.
- Chip value (not label) contains the city → `inferred`.
- `activeCity` set + irrelevant chip label → `ok`, does NOT overwrite with an inferred value.

Uses the real `matchCityInText` from `useResolvedCity.ts` and a hand-rolled `cities` fixture (same shape as the existing hook test) so no network or React tree is needed.

### 3. Light integration smoke test (optional, keep small)
Also in `resolveProceedCity.test.ts`: verify the helper's contract matches what `GoogleChat.tsx` needs by constructing an action object shaped like `SuggestedAction` (`{ id, label, value, cityId? }`) so a future rename of those fields breaks the test.

## Out of scope
- No changes to `useResolvedCity` or its tests.
- No RTL mount of `GoogleChat.tsx` — too heavy and would need mocking Supabase, sessions, and mutations; the pure-helper test covers the exact failure mode.
- No edge-function or DB changes.

## Files touched
- add `src/utils/resolveProceedCity.ts`
- add `src/utils/resolveProceedCity.test.ts`
- edit `src/pages/GoogleChat.tsx` (replace ~20 lines in `handleQuickReply` with a call to the helper)
