/**
 * Coverage guard: every active book type in `book_types` must produce a
 * complete, non-placeholder Educational Focus page (page 2).
 *
 * BOOK_TYPES mirrors the live `book_types` table (is_active = true).
 * If a new type is added to the DB, add it here too — the test then fails
 * unless the type has real learning wording in educationalFocus.ts.
 */
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  buildEducationalFocusContent,
  buildEducationalFocusOverlayText,
  getGradeDisplayText,
} from "./educationalFocus.ts";

const BOOK_TYPES = [
  "digraphs",
  "abc",
  "rhyming",
  "numbers",
  "shapes",
  "colors",
  "dr-seuss",
  "opposites",
  "emotions",
  "animals",
  "first-words",
  "bedtime",
  "cvc",
  "sight-words",
  "general",
  "parent-education",
  "song",
  "manners",
] as const;

const GRADES = ["PRE_K", "K", "GRADE_1", "GRADE_2"] as const;

Deno.test("educationalFocus — all 18 active book types get specific, non-empty text", () => {
  assertEquals(BOOK_TYPES.length, 18);

  for (const bookType of BOOK_TYPES) {
    const content = buildEducationalFocusContent({
      bookType,
      gradeLevel: "PRE_K",
      contentPageCount: 10,
    });

    assert(content.mainConcept.length > 0, `${bookType}: empty age line`);
    assert(content.funFact.length > 0, `${bookType}: empty learning type`);
    assert(content.activity.length > 0, `${bookType}: empty skill line`);

    // No generic fallback wording — each type must be explicitly mapped.
    assert(
      content.funFact !== "EARLY LEARNING",
      `${bookType}: falls back to generic learning type`,
    );
    assert(
      !content.activity.startsWith("FOCUS: EDUCATIONAL"),
      `${bookType}: falls back to generic skill`,
    );

    // No unresolved tokens or stray placeholders leak into the page.
    const all = `${content.mainConcept} ${content.funFact} ${content.activity}`;
    assert(!/\{\{|\}\}|undefined|null|_CUSTOM/.test(all), `${bookType}: bad token in "${all}"`);
  }
});

Deno.test("educationalFocus — every grade level renders a readable age line", () => {
  for (const grade of GRADES) {
    const text = getGradeDisplayText(grade);
    assert(/Ages \d/.test(text), `${grade}: no age range in "${text}"`);
  }
  // Unknown grade codes pass through rather than blanking the page.
  assertEquals(getGradeDisplayText("GRADE_3"), "GRADE_3");
  // No grade and no age still yields a default, never an empty string.
  assertEquals(getGradeDisplayText(), "Ages 3-5");
});

Deno.test("educationalFocus — overlay caption is populated and length-safe", () => {
  for (const bookType of BOOK_TYPES) {
    for (const grade of GRADES) {
      const overlay = buildEducationalFocusOverlayText({
        bookType,
        gradeLevel: grade,
        contentPageCount: 10,
      });
      assert(overlay.includes("·"), `${bookType}/${grade}: missing separator`);
      // Page rows sanitize the overlay to 100 chars — must not be truncated.
      assert(
        overlay.length <= 100,
        `${bookType}/${grade}: overlay ${overlay.length} chars would truncate: "${overlay}"`,
      );
    }
  }
});

Deno.test("educationalFocus — page count line matches the book's content pages", () => {
  const twelve = buildEducationalFocusContent({ bookType: "colors", contentPageCount: 10 });
  assert(twelve.activity.endsWith("10 pages to explore together"), twelve.activity);

  // Missing/zero count degrades to the skill line alone, never "0 pages".
  const unknown = buildEducationalFocusContent({ bookType: "colors" });
  assertEquals(unknown.activity, "FOCUS: COLOR LEARNING");
  const zero = buildEducationalFocusContent({ bookType: "colors", contentPageCount: 0 });
  assertEquals(zero.activity, "FOCUS: COLOR LEARNING");
});
