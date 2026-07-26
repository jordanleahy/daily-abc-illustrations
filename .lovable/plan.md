## What is supposed to happen

Clicking **Create My Book!** should:
1. Track `create_book_click`, then check a city is resolved.
2. Parse the approved outline out of the chat transcript (`parseBookOutline` → `buildOutlinePayload`).
3. Call the `google-create-book` edge function with that outline, which deterministically writes the book + all pages.
4. Link the book to the chat session, rename the session to the book title, and switch the UI into "book created" state.

Right now the click produces no visible change at all.

## Three likely reasons (in order of probability)

**1. No page-by-page outline in the transcript (most likely).**
In the screenshot the assistant only produced a **Title** and **Description** — never the numbered page outline. `buildOutlinePayload` returns `undefined` when there is no parsed cover/outline, and `google-create-book` now hard-rejects requests without `bookOutline` (`OUTLINE_REQUIRED`, non-2xx). So the request either never carries an outline or the function 400s, and the user sees nothing.

**2. The pre-flight guards return silently.**
`createBook` bails with only `console.warn` for: no active session, no messages, book already created for this session, and creation already in progress. Guard 3 in particular ("Book already exists for this session") is a common no-op path after a retry — zero UI feedback.

**3. The city gate / error path is invisible.**
If `activeCity` doesn't resolve, the handler shows a toast and scrolls to `#city-validation-error`; if that element isn't mounted or the toast is clipped, it also looks like "nothing happened". Similarly, edge-function failures are only surfaced by the mutation's toast — which is easy to miss.

## Plan

**A. Make every exit path visible (frontend)**
- In `src/pages/GoogleChat.tsx` `createBook`, replace each silent `console.warn` guard with a toast that states the actual reason ("Book already created for this chat — opening it", "Creation already in progress", "Start a conversation first").
- For guard 3, navigate/scroll to the existing book instead of dead-ending.
- Add a `create_book_blocked` analytics event with a `reason` for each guard so the failure is measurable.

**B. Handle the missing-outline case explicitly**
- Before calling the mutation, if `buildOutlinePayload(outline)` is `undefined`, do not fire the request. Instead show a clear message ("I still need the page-by-page outline — asking the assistant to generate it") and auto-send a chat turn requesting the outline in the strict format the parser expects.
- Track `create_book_blocked` with `reason: 'no_outline'`.

**C. Surface the real edge-function error**
- In the `catch` block, show the mapped error message + code (reuse the existing `ErrorDetailsPanel` / `lovableAiErrors` details) rather than relying solely on the mutation's generic toast.

**D. Verify**
- Add unit tests around the guard/outline decision so a click with no outline produces the "request outline" path, and a click with an outline produces the mutation call.
- Check `google-create-book` logs after a live click to confirm whether requests are arriving at all and whether `OUTLINE_REQUIRED` is being hit — this confirms reason #1 vs #2 for this specific session.

### Technical notes
- Files: `src/pages/GoogleChat.tsx` (guards + outline pre-check), `src/utils/bookPrompts.ts` (no change expected, but confirm `parseBookOutline` tolerance for the "Title/Description only" transcript shape), edge function `supabase/functions/google-create-book/index.ts` (unchanged — it should keep rejecting outline-less requests).
- No database or schema changes.
