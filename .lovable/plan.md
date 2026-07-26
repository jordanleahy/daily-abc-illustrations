## What's happening

Page 2 of every 12-page book is the "Educational Focus" page (age range, learning type, skill focus). Today it is created with no real text — only the words "Educational Focus".

Verified against the most recent book (`SEASON_SUMMER Opposites Book in New York City`, page 2, identifier `FOCUS`):

- `content.mainConcept` = "Educational Focus"
- `content.funFact` = "" and `content.activity` = ""
- `content.textOverlay.text` = "Educational Focus"
- Its image prompt asks for three badges ("Age Range", "Opposites & Contrasts", "10 Opposite Pairs") but ends with "No text overlays. Clean illustration only." — so the badges render as empty colored shapes.

## Root cause (three places, all confirmed)

1. `src/utils/pageHelpers.ts:44-64` — the chat outline parser only captures a page's **title** and **image description**. The outline markdown has no age/learning body text for page 2, so nothing is available downstream.
2. `supabase/functions/google-create-book/outlineToBook.ts:118-127` — the deterministic adapter hardcodes `mainConcept: title`, `funFact: ''`, `activity: ''` for every non-cover page. The educational page gets no special treatment even though it already knows `pageType === 'educational'` and sets letter `FOCUS`.
3. `supabase/functions/_shared/promptTemplates.ts:209-232` — the badge text (age, learning type, skill focus) exists only inside the *image* prompt, and the "no text in image" mode strips it. There is no text-side equivalent, so the data never lands in the page record.

Display is not the bug: `src/components/reading/ReadingPageDisplay.tsx:129` deliberately skips the word carousel for `cover`/`educational` pages and falls back to a plain bottom overlay that renders whatever `pageText` holds — it will show real text as soon as the record has it.

## The fix

**1. Build the focus text deterministically in the adapter**

Extend `outlineToBook.ts` with a small pure helper `buildEducationalFocusContent()` that composes the page-2 text from data the create-book request already carries (`gradeLevel` / `targetAge`, `bookType` / `category`, page count, and the outline's own description):

- `title`: "Educational Focus" (unchanged)
- `mainConcept`: age/grade line, e.g. `Ages 3-5 (Pre-K)`
- `funFact`: learning type line, e.g. `Opposites & Contrasts`
- `activity`: skill/scope line, e.g. `10 opposite pairs to explore together`

Reuse the existing learning-type/skill mapping in `promptTemplates.ts` (`getLearningDetails`, `getGradeDisplayText`) by extracting it into a shared module so the text and image prompts stay in sync instead of drifting.

**2. Pass the needed context into the adapter**

`supabase/functions/google-create-book/index.ts` already validates `gradeLevel`, `targetAge`, `bookType`, `category`, and `characterTheme`; thread them into the `outlineToBook` input so the helper can use them. Adapter stays pure — no network, no AI.

**3. Set the text overlay for page 2**

Where `textOverlay` is written during page insertion, set the focus page's overlay text to the composed age/learning line (currently it copies the title) and enable it, so the age line is visible over the badge illustration.

**4. Keep the image prompt honest**

The focus-page image prompt should keep rendering the badges as colored shapes and stop promising badge text when overlays are off — the age/learning wording now comes from the page text layer.

**5. Tests**

Add cases to `supabase/functions/google-create-book/outlineToBook.test.ts`:
- educational page gets non-empty `mainConcept`, `funFact`, `activity`
- age line reflects the supplied grade level, with a sensible fallback when it's absent
- content pages and the cover are unchanged (no regressions)
- ABC (28-page) books still have no page-2 educational page

## Technical notes

- Only the deterministic path is touched; `google-create-book` already rejects requests without a `bookOutline`.
- Existing books are not backfilled by this change. If you want the ~92 library books' page 2 fixed too, that's a separate one-off backfill I can add after this lands.
