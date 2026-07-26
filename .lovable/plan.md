# DMD — Create Book Flow: Hardening & Prompt Performance

## 1. How the flow works today (verified)

```text
CLIENT                                          SERVER
GoogleChat.tsx (2186 lines)
  handleQuickReply  ──► useGoogleChat.sendMessage ──► google-chat (1111 lines)
    ~20 useState discovery fields                     - selectChatAgent() reads `agents` row
    parseSuggestions() re-parses [SUGGEST]            - system prompt = 22 concatenated blocks
    hardcoded fallback buttons (abc, digraphs)        - 1 streamed AI call, no retry/timeout
  parseBookOutline(messages) ──► BookEditorPanel (1262 lines) QA
  handleCreateBook / handleCreateBookAndWait (2 near-identical ~230-line fns)
       └─ useGoogleCreateBook ──► google-create-book (1406 lines)
                                    - Zod parse
                                    - FAST PATH: outlineToBook.ts (0 AI calls)
                                    - LEGACY PATH: 2nd AI call (schema drift risk)
                                    - ABC=28 / other=12 validation (12-page check inlined,
                                      duplicating unused validateBookStructure)
                                    - insert book + N pages (N sequential DB round-trips)
                                    - fan-out: generate-page-system-prompts (0 AI, N×2 DB),
                                      generate-seo-metadata
Per page, client-triggered: generate-color-image / generate-coloring-image (1 AI call each,
inconsistent retry: 2 retries vs none)
```

## 2. Confirmed problems

**Prompt extraction is implemented 5 times** for the same `**Page N: Title**` markdown:
`pageHelpers.ts:45,67` (canonical) · `chatHelpers.ts:50` (marked deprecated, still imported at `GoogleChat.tsx:23`) · `GoogleChat.tsx:830,850` · `GoogleChat.tsx:624` (edit mode) · `useGoogleCreateBook.ts:97-109`. Two of these five never call `sanitizeImagePrompt`, so prompt text differs by path.

**Cover "centered title" logic exists 3× with 2 different wordings** — `GoogleChat.tsx:390-403` (`DISPLAY TITLE:`), `838-844` and `1452-1463` (`CRITICAL INSTRUCTION:`). Stored-at-QA and sent-at-create prompts can disagree.

**`handleCreateBook` and `handleCreateBookAndWait`** are ~230-line near-duplicates (same guards, same fallback extraction, same params, same GA4 calls).

**Server duplication**: AI gateway fetch hand-rolled in 5+ functions despite `_shared/aiProviders.ts:callAIProvider`; `_shared/validation.ts:167-263 validateBookStructure` is unused while `google-create-book/index.ts:658-725` reimplements it; CORS literals redeclared in 6 files; `qa-theme-agent` and `google-create-book` bypass `_shared/handler.ts` and `_shared/auth.ts:verifyAuth`; `qa-theme-agent:136` uses ad-hoc regex instead of `_shared/jsonExtractor.ts`.

**Prompt-generation cost**: `google-chat`'s system prompt is 22 concatenated context blocks with only a `console.log` of character length — no token counting, no budget, no trimming of blocks irrelevant to the current book type. Non-ABC pages skip `validateImagePrompt` entirely.

## 3. Plan

### Phase 1 — One prompt pipeline (client)
- New `src/utils/bookPrompts.ts` as the single source: `extractOutlinePrompts(messages)`, `finalizeCoverPrompt(prompt, title)`, `getPagePrompt(...)`. All prompts sanitized exactly once, at extraction.
- Delete the 4 duplicate extraction blocks; delete `parsePageDetailsFromMessages` and its import after a repo-wide grep confirms it is unreachable.
- Single cover instruction constant, used by QA read, editor open, and create.
- Merge the two create handlers into one `createBook({ wait }: { wait?: boolean })`.

### Phase 2 — Deterministic-only creation (server)
- Make the `bookOutline` fast path the sole route: return an explicit 400 (`OUTLINE_REQUIRED`) instead of falling back to the second LLM call, removing the schema-drift class of failure and 3–15s of latency per book.
- Replace the inlined 12-page checks with the existing `validateBookStructure`; extend `validateImagePrompt` to non-ABC pages so all book types get the same length/suffix guarantees.
- Batch the per-page inserts into one multi-row insert plus one version-number call instead of N sequential round-trips.

### Phase 3 — Prompt budget & shared plumbing
- `_shared/promptBudget.ts`: assemble the system prompt from a block list, drop blocks not relevant to the active book type, log an estimated token count per block, and hard-cap total size with a warning.
- Route `google-chat`, `google-create-book`, `qa-theme-agent`, `generate-color-image`, `generate-coloring-image` through `callAIProvider` (uniform retry, 429/402 mapping, timeout); switch `qa-theme-agent` to `extractJSON`, `_shared/cors.ts`, and `_shared/handler.ts`.

### Phase 4 — Regression tests
- Unit tests for `bookPrompts.ts`: cover/educational/content extraction, sanitize-once, cover title finalization, edit-mode `<qa_page_N>` shape.
- Extend `outlineToBook.test.ts` with the outline-required error path and non-ABC 12-page validation.

## 4. Expected outcome
- One AI call for creation instead of two on the legacy path (3–15s faster, drift eliminated).
- ~350–450 lines removed from `GoogleChat.tsx`, ~150 from the edge functions.
- Identical prompt text across Copy Prompt, Generate, and book creation.
- Token-visible, book-type-scoped system prompts instead of a fixed 22-block blob.

## 5. Not included
No UI redesign, no model changes, no changes to the `agents`/`agent_questions` tables or city-resolution behavior.
