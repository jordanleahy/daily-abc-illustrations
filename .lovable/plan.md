# 3 potential reasons the image generation is failing

Screenshot shows the generic toast **"Generation failed / Could not generate image"** on a content page ("Play rhymes with Day"). That exact wording is the *default fallback* in `src/utils/lovableAiErrors.ts:37` — returned only when the error doesn't match credits (402), rate-limit (429), or "no image" (422). So whatever went wrong, it's an unclassified failure — most likely one of these three.

---

## Reason 1 — The image prompt was rejected by content moderation (character IP)

The page prompt starts with *"Whimsical children's book style. Bluey and Bingo…"*. OpenAI's `gpt-image` models (used for content pages via `IMAGE_GENERATION_MODEL` in `generate-color-image/index.ts:62`) return `content_policy_violation` on prompts that name copyrighted characters like Bluey. That error string doesn't contain "credits", "rate limit", or "couldn't generate", so `parseLovableAiError` falls through to the generic message.

**How to verify:** check `supabase--edge_function_logs` for `generate-color-image` around the failure timestamp — look for `content_policy_violation` / `moderation_blocked` / 400 from the AI Gateway.

**Fix direction:** either scrub character names from the outgoing prompt (analogous to what we now do for cover *titles*), or route Bluey-themed content pages to a Gemini image model, which has a different policy.

---

## Reason 2 — The prompt failed schema validation before reaching the model

`generate-color-image/index.ts:43` early-returns `errors.badRequest(...)` if `pageId`, `bookId`, or `prompt` is missing/empty. The client calls `getCurrentPagePrompt(currentPageNumber)` (`BookEditorPanel.tsx:331`) — if the DB row's `content.imagePrompt` is empty (e.g. the book was created before prompts were generated, or `generate-page-system-prompts` failed silently at book create — see `google-create-book/index.ts:1110–1118` where prompt generation errors are swallowed), the call goes out with `prompt=""` and gets a 400. The frontend `getLovableAiErrorMessage` doesn't recognize "Missing required parameters" either, so → generic "Could not generate image".

**How to verify:** query `pages` for this book and check `content->>'imagePrompt'` for the failing page. Also check `book_system_prompts` / edge logs to see if prompts were ever generated.

**Fix direction:** show the real error message from the edge function (drop the fallback wrapper when a specific message is present), and add a page-level "regenerate prompt" affordance when `content.imagePrompt` is empty.

---

## Reason 3 — Upstream Gateway timeout or transient 5xx that's being masked

Image generation runs through the Lovable AI Gateway with `stream: true`. If the upstream provider times out, drops the connection, or returns a 5xx *after* the SSE stream opens, the edge function catches it and returns `{ success: false, error: "..." }`. Because that error string doesn't match any of the three patterns in `lovableAiErrors.ts`, the UI shows the generic message and hides the actual cause (e.g. `"Stream ended without image_generation.completed"` or `"Upstream 502"`).

**How to verify:** `supabase--edge_function_logs` for `generate-color-image` — look for stream-abort or non-2xx upstream status. If the function itself never logged the invocation, it was a client-side network failure (also shows the same toast).

**Fix direction:** surface the real underlying message in the toast, and add one automatic retry inside `handleGenerateColorImage` for transient upstream failures.

---

## Recommendation for next step

The single most valuable move is to **stop swallowing the real error**: change `getLovableAiErrorMessage` to prefer any specific message from `data?.error` / `error?.message` over the "Could not generate image" fallback. That instantly tells us which of the three above (or something else) is actually happening on this book/page, so the real fix is targeted rather than guessed.

Want me to build that logging fix, or investigate one specific reason first (I can pull the edge-function logs and the row's `content.imagePrompt` in build mode)?
