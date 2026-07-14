# Three ways to improve the cover title (never include character names)

Goal: Cover titles like **"Summer ABCs in Jersey City"** or **"Winter Rhymes at Stowe"** — driven by book type + season + location, never the character theme (Bluey, Paw Patrol, etc.).

Today the title (`bookName`) is whatever the creation agent returns in `google-create-book` (line ~778), and character names often leak in. There's already a well-built deterministic composer at `supabase/functions/_shared/coverPromptConstants.ts` → `buildCoverTitle()` that ignores character names, but nothing actually calls it for the saved title.

Below are three approaches, ordered from smallest/safest to most thorough. They can also stack.

---

## Option 1 — Deterministic override at save time (smallest, safest)

Compute the title ourselves right before insert, ignoring whatever the agent produced.

- In `supabase/functions/google-create-book/index.ts`, just before `book_name: sanitizeText(bookData.bookName, 200)` (~line 778), call the existing `buildCoverTitle({ bookType, gradeLevel, season })` and append location:
  - `[Grade] [Season] [BookTypeDisplay] [in <City> | at <Resort>]`
- Use the discovery attributes already passed into this function (`season`, `city`, `resort`/`location`, `gradeLevel`).
- Fall back to the agent's `bookName` only when no season *and* no location are known.

Pros: one-file change, deterministic, character names are structurally impossible.
Cons: less "creative" phrasing.

## Option 2 — Sanitizer that strips character names from the agent title (defense-in-depth)

Keep the agent's creative title, but scrub it.

- New helper `sanitizeCoverTitle(bookName, { characterTheme, selectedCharacterIds })` in `supabase/functions/_shared/coverPromptConstants.ts`.
- Build a blocklist from `characterThemes.ts` (theme label + known character names per theme, e.g. Bluey → [Bluey, Bingo, Bandit, Chilli]).
- Regex-remove those tokens (case-insensitive, word-boundary), collapse whitespace, and if the result is empty/too short, fall back to `buildCoverTitle(...)` from Option 1.
- Apply at the same insert point in `google-create-book/index.ts`.

Pros: preserves creative phrasing when safe; catches character leaks even in edge paths (duplication, re-runs).
Cons: needs a maintained blocklist per theme.

## Option 3 — Constrain the agent up front + validate (prompt-side fix)

Prevent the model from ever writing a character-named title.

- In `google-create-book/index.ts` where the JSON structure prompt is assembled (~line 340), add explicit rules to the `CRITICAL INSTRUCTIONS`:
  - "`bookName` MUST follow the pattern `[Season?] [BookType] [in <City> | at <Resort>]?`."
  - "`bookName` MUST NOT contain any character names, franchise names, or theme names (e.g. Bluey, Paw Patrol, Frozen)."
  - Give 2-3 examples: `"Summer ABCs in Jersey City"`, `"Winter Rhymes at Stowe"`, `"Spring Colors Book"`.
- Add a lightweight post-check: if the returned `bookName` matches the character blocklist from Option 2, replace it with `buildCoverTitle(...)` before insert.

Pros: fixes the source, keeps agent flexibility for new book types.
Cons: LLM compliance isn't 100% — must be paired with the post-check to be safe.

---

## Recommendation

Ship **Option 1 + Option 2** together: deterministic composer as the primary path, sanitizer as the fallback for legacy/edge flows. Option 3 is a nice add-on later if you want the agent to keep authoring creative titles.

## Technical notes

- All three keep changes inside `supabase/functions/google-create-book/index.ts` and `supabase/functions/_shared/coverPromptConstants.ts` — no DB schema, no frontend changes, no new deps.
- `buildCoverTitle()` already exists and already excludes character names by design — we just need to actually use it.
- Location wiring: `city` is already passed in; `resort` isn't currently a parameter of `google-create-book` and would need to be threaded through from `useGoogleCreateBook` (small addition) if we want "at <Resort>" support.
- Respects existing memory rules: ABC = 28 pages, no hardcoded audience, character-name discipline.

Which option (or combination) should I build?
