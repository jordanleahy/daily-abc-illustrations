Confirming intent: city should be treated as a mandatory discovery question in every book creation conversation, regardless of the `city` toggle in the AgentQuestionsManager.

## Implementation Plan

### 1. Modify `supabase/functions/google-chat/index.ts`

#### a) Force city to always be an enabled question
- Remove the `isCityEnabled` check for the `city` context block.
- Always render the city status context:
  - If `city` is already selected: show the selected city and instruct the agent NOT to ask again.
  - If `city` is not yet selected: add a firm instruction that the agent MUST ask the user to choose a city before moving on.

#### b) Ensure the dynamic discovery block includes city
- The dynamic discovery block currently only builds from `enabledQuestionsWithDetails`.
- Augment the list so that `city` is always present as a required question if not already answered, even when the database-driven `enabledQuestions` list does not include it.
- Alternatively, keep the database list and prepend a synthetic city question before it.

#### c) Make city a blocker for the "proceed to title" stage
- Update `allOptionalQuestionsComplete` / `allDynamicQuestionsComplete` so that `city` is treated as mandatory.
- Do not allow the system prompt to present the title/approval block until `city` is present in `existingContextKeys` or `answeredQuestionIds`.

#### d) Update `titleExamples` and fallback city prompt
- Keep the existing city-aware title formatting.
- Ensure the fallback when no city is selected does not use an arbitrary default; instead, it must wait until the user chooses one.

### 2. Frontend impact

- No changes needed in `src/pages/GoogleChat.tsx` or `src/hooks/useGoogleChat.ts` for the core flow, because the existing city selection UI and `action.cityId` parsing already work.
- Optionally, update the city search drawer copy to make it clear this step is required, not optional.

### 3. Verification

- Deploy the updated `google-chat` edge function.
- Start a new book creation conversation with the `city` toggle disabled in the database and confirm the agent still asks for a city.
- Verify that the agent cannot proceed to title suggestions until a city is selected.

## Out of scope
- No changes to the database schema or `agent_questions` toggles.
- No changes to other edge functions (e.g., book creation, image generation).