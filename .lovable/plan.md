## Goal

Make the flow explicitly two-step:

1. **Step 1 — Outline.** The chat produces a full page-by-page outline. Nothing is written to the database yet. The user reviews/refines the outline in the editor panel.
2. **Step 2 — Book.** The book record (and its pages) is created automatically the first time the user generates or uploads an image for any page. No separate "Create My Book" action.

## Current state (verified)

- `src/pages/GoogleChat.tsx` already has a single `createBook({ wait })` path exposed as `handleCreateBook` (fire-and-forget) and `handleCreateBookAndWait`.
- `src/components/chat/BookEditorPanel.tsx` already implements the desired behavior for **color-mode generation only**: `handleGenerateWithBookCreation` creates the book via `onCreateBookAndWait()` if `bookId` is missing, then generates the image.
- The explicit create path still exists in two places: the quick-reply action handler in `GoogleChat.tsx` (`action.value === 'create_book' || action.id === 'confirm' || action.id === 'approve'` → `handleCreateBook()`), and the `onCreateBook` prop plumbed into the editor panel.
- B&W generation, text-image generation, "generate all text images", and plain image upload do **not** create the book first — they silently do nothing useful when no book exists.

## Changes

### 1. Single lazy-creation helper in the editor panel
Extract the create-if-missing logic out of `handleGenerateWithBookCreation` into one helper (`ensureBookExists()`) that returns the book id + pages, is idempotent, and is safe to call concurrently (guarded by an in-flight ref so two fast clicks don't create two books).

Wire it as the first step of every image-producing action:
- color generate (existing behavior, refactored)
- B&W generate / regenerate
- text-image generate and "generate all"
- cover upload and manual image upload

Each shows the same "Setting up your book…" toast, then continues with the original action against the newly created page ids.

### 2. Remove the explicit create action
- In `GoogleChat.tsx`, the quick-reply branch for `create_book` / `confirm` / `approve` opens the outline editor panel instead of calling `handleCreateBook()`.
- Drop the now-unused `onCreateBook` prop from `BookEditorPanel`, keeping `onCreateBookAndWait` as the only creation entry point.
- Keep all existing guards inside `createBook` (session, messages, outline-required, already-created) — they now protect the lazy path.

### 3. Labeling so the two steps read clearly
- Outline-stage affordances say **Outline** / **Review outline** (the `InputArea` "Outline" button already does).
- The image panel's generate buttons keep their labels; the pre-generation state for a not-yet-created book shows helper text: "Generating the first image creates your book."
- Any assistant-suggested action label containing "Create Book" maps to the outline-review action, so an older agent prompt can't resurrect a direct create.

### 4. Analytics
Keep the existing `create_book_*` GA4 events and add `source: 'first_image'` plus the triggering mode (`color` / `bw` / `text` / `upload`) so we can see that creation is now driven by image generation.

### 5. Tests
- Unit test for `ensureBookExists`: no-op when `bookId` exists; single creation under two concurrent calls; surfaces creation failure without starting generation.
- Extend `src/utils/bookPrompts.outlineGate.test.ts` coverage: creation is refused when no parsable outline exists, so the first-image path fails loudly rather than making an empty book.

## Technical notes

- No database or edge-function changes. `google-create-book` already requires `bookOutline` and is deterministic.
- Files touched: `src/components/chat/BookEditorPanel.tsx`, `src/pages/GoogleChat.tsx`, and the corresponding test files.
- Books created this way still start as `draft`; publishing remains unchanged.
