## Root cause
Clicking "Create My Book!" hits `handleQuickReply` in `src/pages/GoogleChat.tsx`, which blocks when `activeCity` is null and only sets an inline banner. On mobile that banner is off-screen, so the tap looks dead. `activeCity` is null in your session because none of the three resolution paths caught the city you picked:

- Chip taps only set `selectedCity` when the chip action carries `action.cityId`. If the offered chip omitted `cityId`, tapping it sends a canned reply and no city state is saved.
- `useResolvedCity` only scans **user** messages, so a city grounded in the assistant's title/outline doesn't count.
- The typed-city fuzzy match is strict (`===` or `includes(label)`), so replies like "let's do NYC" or "New York" (vs. "New York City") don't match.

## Fix — frontend only, three small changes

### 1. `src/hooks/useResolvedCity.ts` — smarter resolution
- Add a second pass that scans **assistant** messages for any known city label; return the matching city id. Iterate cities longest-label-first so "New York City" wins over "York".
- Loosen the user-message match: also match when the message text includes any city label, or the normalized label includes the message (min 3 chars) — same longest-first ordering.
- Explicit `selectedCity` still wins over both passes.

### 2. `src/pages/GoogleChat.tsx` — infer city from chip taps and never silently block
- In `handleQuickReply`, before the `isProceedAction` gate, if `action.cityId` is missing, try to infer it from `action.label`/`action.value` against `cities[]` (using the same normalize helper) and call `setSelectedCity(...)` when a match is found. Covers chips the agent produced without a `cityId`.
- If `!activeCity` when proceeding:
  - Keep `setCityValidationError(...)`.
  - Also `toast.error("Please pick a city before creating your book.")` via `sonner`.
  - Scroll the banner into view: add `id="city-validation-error"` to the existing error element and call `document.getElementById('city-validation-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' })` after a `setTimeout(..., 0)`.

### 3. Tests — `src/hooks/useResolvedCity.test.ts`
Add cases:
- Assistant message mentions "New York City", no user city reply → returns `NEW_YORK_CITY`.
- User typed "NYC" or "New York" → resolves to `NEW_YORK_CITY`.
- Explicit `selectedCity = JERSEY_CITY` while assistant text mentions NYC → still `JERSEY_CITY`.
- Longest-label-first: "New York" and "York" both present → `NEW_YORK_CITY`, not a shorter accidental match.

## Out of scope
- No edge-function, agent-prompt, or DB changes.
- No change to the "city is required" rule — resolution gets smarter, and the block becomes visible instead of silent.
