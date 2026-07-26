/**
 * Invariants for the book-creation discovery question flow.
 *
 * These rules are enforced against rows from the `agent_questions` table
 * (agent_type, question_id, sort_order, is_enabled).
 */

export interface AgentQuestionRow {
  agent_type: string;
  question_id: string;
  sort_order: number;
  is_enabled: boolean;
}

export const BOOK_CREATION_PREFIX = "book-creation";
export const CITY_QUESTION_ID = "city";
export const COLORS_FOCUS_QUESTION_ID = "colors_focus";
export const COLORS_AGENT_TYPE = "book-creation-colors";

/** Questions that must always close out the flow, in this order. */
export const TRAILING_QUESTION_IDS = ["SEASON", "custom_details"];

/** Baseline opening questions shared by every book type. */
export const BASELINE_OPENING_QUESTION_IDS = [
  CITY_QUESTION_ID,
  "character_theme",
  "grade_level",
];

export function isBookCreationAgent(agentType: string): boolean {
  return agentType === BOOK_CREATION_PREFIX || agentType.startsWith(`${BOOK_CREATION_PREFIX}-`);
}

/** Enabled question ids for one agent type, ordered by sort_order. */
export function getEnabledFlow(rows: AgentQuestionRow[], agentType: string): string[] {
  return rows
    .filter((r) => r.agent_type === agentType && r.is_enabled)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((r) => r.question_id);
}

export function getBookCreationAgentTypes(rows: AgentQuestionRow[]): string[] {
  return Array.from(new Set(rows.map((r) => r.agent_type).filter(isBookCreationAgent))).sort();
}

/**
 * Validates every book-creation flow. Returns a list of human-readable
 * violations; an empty array means all invariants hold.
 */
export function validateQuestionFlows(rows: AgentQuestionRow[]): string[] {
  const errors: string[] = [];
  const agentTypes = getBookCreationAgentTypes(rows);

  if (agentTypes.length === 0) {
    return ["No book-creation agent types found in agent_questions"];
  }

  for (const agentType of agentTypes) {
    const flow = getEnabledFlow(rows, agentType);

    if (flow.length === 0) {
      errors.push(`${agentType}: has no enabled questions`);
      continue;
    }

    // 1. City is always question #1.
    if (flow[0] !== CITY_QUESTION_ID) {
      errors.push(`${agentType}: first question is "${flow[0]}", expected "${CITY_QUESTION_ID}"`);
    }

    const cityRows = rows.filter(
      (r) => r.agent_type === agentType && r.question_id === CITY_QUESTION_ID && r.is_enabled,
    );
    if (cityRows.length !== 1) {
      errors.push(`${agentType}: expected exactly 1 enabled city question, found ${cityRows.length}`);
    } else if (cityRows[0].sort_order !== 0) {
      errors.push(`${agentType}: city sort_order is ${cityRows[0].sort_order}, expected 0`);
    }

    // 2. Shared baseline opening.
    const opening = flow.slice(0, BASELINE_OPENING_QUESTION_IDS.length);
    if (opening.join(">") !== BASELINE_OPENING_QUESTION_IDS.join(">")) {
      errors.push(
        `${agentType}: opening questions are [${opening.join(", ")}], expected [${BASELINE_OPENING_QUESTION_IDS.join(", ")}]`,
      );
    }

    // 3. Trailing questions always close the flow.
    const trailing = flow.slice(-TRAILING_QUESTION_IDS.length);
    if (trailing.join(">") !== TRAILING_QUESTION_IDS.join(">")) {
      errors.push(
        `${agentType}: flow must end with [${TRAILING_QUESTION_IDS.join(", ")}], found [${trailing.join(", ")}]`,
      );
    }

    // 4. No duplicate enabled questions / duplicate sort orders.
    const seen = new Set<string>();
    for (const id of flow) {
      if (seen.has(id)) errors.push(`${agentType}: duplicate enabled question "${id}"`);
      seen.add(id);
    }
    const orders = rows
      .filter((r) => r.agent_type === agentType && r.is_enabled)
      .map((r) => r.sort_order);
    if (new Set(orders).size !== orders.length) {
      errors.push(`${agentType}: duplicate sort_order values among enabled questions`);
    }

    // 5. colors_focus belongs to the colors book type only, and sits between
    //    the baseline opening and the trailing questions.
    const hasColorsFocus = flow.includes(COLORS_FOCUS_QUESTION_ID);
    if (agentType === COLORS_AGENT_TYPE) {
      if (!hasColorsFocus) {
        errors.push(`${agentType}: missing enabled "${COLORS_FOCUS_QUESTION_ID}" question`);
      } else {
        const idx = flow.indexOf(COLORS_FOCUS_QUESTION_ID);
        if (idx !== BASELINE_OPENING_QUESTION_IDS.length) {
          errors.push(
            `${agentType}: "${COLORS_FOCUS_QUESTION_ID}" is at position ${idx + 1}, expected ${BASELINE_OPENING_QUESTION_IDS.length + 1} (right after grade_level)`,
          );
        }
        if (idx >= flow.length - TRAILING_QUESTION_IDS.length) {
          errors.push(`${agentType}: "${COLORS_FOCUS_QUESTION_ID}" must come before SEASON/custom_details`);
        }
      }
      // Colors must not reuse the opposites/resort questions.
      for (const legacy of ["opposites_category", "RESORT"]) {
        if (flow.includes(legacy)) {
          errors.push(`${agentType}: must not reuse "${legacy}"`);
        }
      }
    } else if (hasColorsFocus) {
      errors.push(`${agentType}: "${COLORS_FOCUS_QUESTION_ID}" should only be enabled for ${COLORS_AGENT_TYPE}`);
    }
  }

  return errors;
}
