import { describe, it, expect } from "vitest";
import {
  validateQuestionFlows,
  getEnabledFlow,
  getBookCreationAgentTypes,
  type AgentQuestionRow,
} from "./questionFlowInvariants";

/**
 * Snapshot of the enabled discovery question flow per book-creation agent type.
 * Mirrors the `agent_questions` table. Update this when the flow changes on
 * purpose — a failing test here means the flow drifted.
 */
const LIVE_FLOWS: Record<string, string[]> = {
  "book-creation": ["city", "character_theme", "grade_level", "THEME", "SEASON", "custom_details"],
  "book-creation-abc": ["city", "character_theme", "grade_level", "letter_case", "THEME", "SEASON", "custom_details"],
  "book-creation-animals": ["city", "character_theme", "grade_level", "SEASON", "custom_details"],
  "book-creation-bedtime": ["city", "character_theme", "grade_level", "THEME", "SEASON", "custom_details"],
  "book-creation-colors": ["city", "character_theme", "grade_level", "colors_focus", "SEASON", "custom_details"],
  "book-creation-cvc": ["city", "character_theme", "grade_level", "SEASON", "custom_details"],
  "book-creation-digraphs": [
    "city",
    "character_theme",
    "grade_level",
    "DIGRAPH_FOCUS",
    "DIGRAPH_SELECTION",
    "THEME",
    "RESORT",
    "SEASON",
    "custom_details",
  ],
  "book-creation-dr-seuss": ["city", "character_theme", "grade_level", "THEME", "SEASON", "custom_details"],
  "book-creation-emotions": ["city", "character_theme", "grade_level", "SEASON", "custom_details"],
  "book-creation-first-words": ["city", "character_theme", "grade_level", "SEASON", "custom_details"],
  "book-creation-general": ["city", "character_theme", "grade_level", "THEME", "SEASON", "custom_details"],
  "book-creation-manners": [
    "city",
    "character_theme",
    "grade_level",
    "manner_type",
    "manner_setting",
    "SEASON",
    "custom_details",
  ],
  "book-creation-numbers": [
    "city",
    "character_theme",
    "grade_level",
    "NUMBER_RANGE",
    "CUSTOM_NUMBER_RANGE",
    "SEASON",
    "custom_details",
  ],
  "book-creation-opposites": [
    "city",
    "character_theme",
    "grade_level",
    "opposites_category",
    "RESORT",
    "SEASON",
    "custom_details",
  ],
  "book-creation-parent-education": ["city", "character_theme", "grade_level", "SEASON", "custom_details"],
  "book-creation-rhyming": ["city", "character_theme", "grade_level", "THEME", "RESORT", "SEASON", "custom_details"],
  "book-creation-shapes": ["city", "character_theme", "grade_level", "SEASON", "custom_details"],
  "book-creation-sight-words": ["city", "character_theme", "grade_level", "SEASON", "custom_details"],
};

function toRows(flows: Record<string, string[]>): AgentQuestionRow[] {
  return Object.entries(flows).flatMap(([agent_type, ids]) =>
    ids.map((question_id, i) => ({ agent_type, question_id, sort_order: i, is_enabled: true })),
  );
}

const LIVE_ROWS = toRows(LIVE_FLOWS);

describe("book-creation question flow invariants", () => {
  it("has no violations for the current flow snapshot", () => {
    expect(validateQuestionFlows(LIVE_ROWS)).toEqual([]);
  });

  it("covers every book-creation agent type", () => {
    expect(getBookCreationAgentTypes(LIVE_ROWS)).toHaveLength(Object.keys(LIVE_FLOWS).length);
  });

  it.each(Object.keys(LIVE_FLOWS))("city is question #1 for %s", (agentType) => {
    expect(getEnabledFlow(LIVE_ROWS, agentType)[0]).toBe("city");
  });

  it.each(Object.keys(LIVE_FLOWS))("%s ends with SEASON then custom_details", (agentType) => {
    expect(getEnabledFlow(LIVE_ROWS, agentType).slice(-2)).toEqual(["SEASON", "custom_details"]);
  });

  it("places colors_focus immediately after grade_level for colors books", () => {
    expect(getEnabledFlow(LIVE_ROWS, "book-creation-colors")).toEqual([
      "city",
      "character_theme",
      "grade_level",
      "colors_focus",
      "SEASON",
      "custom_details",
    ]);
  });

  it("does not enable colors_focus for any other book type", () => {
    const others = Object.entries(LIVE_FLOWS).filter(([t]) => t !== "book-creation-colors");
    for (const [, ids] of others) {
      expect(ids).not.toContain("colors_focus");
    }
  });

  it("does not reuse opposites_category or RESORT for colors books", () => {
    const flow = getEnabledFlow(LIVE_ROWS, "book-creation-colors");
    expect(flow).not.toContain("opposites_category");
    expect(flow).not.toContain("RESORT");
  });
});

describe("validateQuestionFlows detects regressions", () => {
  it("flags a book type where city is not first", () => {
    const broken = toRows({
      ...LIVE_FLOWS,
      "book-creation-shapes": ["character_theme", "city", "grade_level", "SEASON", "custom_details"],
    });
    const errors = validateQuestionFlows(broken);
    expect(errors.join("\n")).toContain("book-creation-shapes");
    expect(errors.some((e) => e.includes('expected "city"'))).toBe(true);
  });

  it("flags a missing city question", () => {
    const broken = toRows({
      ...LIVE_FLOWS,
      "book-creation-animals": ["character_theme", "grade_level", "SEASON", "custom_details"],
    });
    expect(validateQuestionFlows(broken).some((e) => e.includes("book-creation-animals"))).toBe(true);
  });

  it("flags colors_focus in the wrong position", () => {
    const broken = toRows({
      ...LIVE_FLOWS,
      "book-creation-colors": ["city", "character_theme", "grade_level", "THEME", "colors_focus", "SEASON", "custom_details"],
    });
    expect(
      validateQuestionFlows(broken).some((e) => e.includes("colors_focus") && e.includes("position")),
    ).toBe(true);
  });

  it("flags colors_focus leaking into another book type", () => {
    const broken = toRows({
      ...LIVE_FLOWS,
      "book-creation-shapes": ["city", "character_theme", "grade_level", "colors_focus", "SEASON", "custom_details"],
    });
    expect(
      validateQuestionFlows(broken).some(
        (e) => e.includes("book-creation-shapes") && e.includes("colors_focus"),
      ),
    ).toBe(true);
  });

  it("flags colors reusing opposites_category", () => {
    const broken = toRows({
      ...LIVE_FLOWS,
      "book-creation-colors": [
        "city",
        "character_theme",
        "grade_level",
        "colors_focus",
        "opposites_category",
        "SEASON",
        "custom_details",
      ],
    });
    expect(validateQuestionFlows(broken).some((e) => e.includes("must not reuse"))).toBe(true);
  });

  it("flags missing colors_focus on the colors book type", () => {
    const broken = toRows({
      ...LIVE_FLOWS,
      "book-creation-colors": ["city", "character_theme", "grade_level", "SEASON", "custom_details"],
    });
    expect(validateQuestionFlows(broken).some((e) => e.includes("missing enabled"))).toBe(true);
  });

  it("flags duplicate enabled questions", () => {
    const broken = toRows({
      ...LIVE_FLOWS,
      "book-creation-cvc": ["city", "character_theme", "grade_level", "grade_level", "SEASON", "custom_details"],
    });
    expect(validateQuestionFlows(broken).some((e) => e.includes("duplicate"))).toBe(true);
  });

  it("flags a flow that does not end with SEASON then custom_details", () => {
    const broken = toRows({
      ...LIVE_FLOWS,
      "book-creation-general": ["city", "character_theme", "grade_level", "SEASON", "custom_details", "THEME"],
    });
    expect(validateQuestionFlows(broken).some((e) => e.includes("must end with"))).toBe(true);
  });
});
