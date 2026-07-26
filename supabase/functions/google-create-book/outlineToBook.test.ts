import { assertEquals, assertThrows } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { outlineToBook, extractLetter } from "./outlineToBook.ts";

Deno.test("extractLetter — parses '(a) is for apple'", () => {
  assertEquals(extractLetter("(a) is for apple"), "a");
});

Deno.test("extractLetter — parses '**A:** Apple'", () => {
  assertEquals(extractLetter("**A:** Apple"), "a");
});

Deno.test("extractLetter — parses 'B is for Ball'", () => {
  assertEquals(extractLetter("B is for Ball"), "b");
});

Deno.test("extractLetter — returns undefined for non-ABC titles", () => {
  assertEquals(extractLetter(""), undefined);
});

Deno.test("outlineToBook — throws when bookName missing", () => {
  assertThrows(() => outlineToBook({ bookName: "", pages: [] }), Error, "bookName");
});

Deno.test("outlineToBook — throws when pages empty", () => {
  assertThrows(() => outlineToBook({ bookName: "Test", pages: [] }), Error, "at least one page");
});

Deno.test("outlineToBook — throws on duplicate pageNumber", () => {
  assertThrows(
    () => outlineToBook({
      bookName: "Test",
      pages: [
        { pageNumber: 1, title: "Cover" },
        { pageNumber: 1, title: "Cover Again" },
      ],
    }),
    Error,
    "duplicate",
  );
});

Deno.test("outlineToBook — assigns cover/educational/content for 12-page book", () => {
  const result = outlineToBook({
    bookName: "Rhyme Time in Jersey City",
    bookType: "rhymes",
    pages: [
      { pageNumber: 1, title: "Cover" },
      { pageNumber: 2, title: "Educational Focus" },
      ...Array.from({ length: 10 }, (_, i) => ({
        pageNumber: i + 3,
        title: `Page ${i + 3}`,
      })),
    ],
  });
  assertEquals(result.pages.length, 12);
  assertEquals(result.pages[0].pageType, "cover");
  assertEquals(result.pages[1].pageType, "educational");
  assertEquals(result.pages[2].pageType, "content");
  assertEquals(result.pages[0].title, "Rhyme Time in Jersey City");
});

Deno.test("outlineToBook — ABC book: no educational at page 2, letters extracted", () => {
  const pages = [
    { pageNumber: 1, title: "My ABC Book" },
    ...Array.from({ length: 26 }, (_, i) => ({
      pageNumber: i + 2,
      title: `${String.fromCharCode(65 + i)} is for ${String.fromCharCode(65 + i)}pple`,
    })),
    { pageNumber: 28, title: "The End" },
  ];
  const result = outlineToBook({ bookName: "My ABC Book", bookType: "abc", pages });
  assertEquals(result.pages.length, 28);
  assertEquals(result.pages[0].pageType, "cover");
  assertEquals(result.pages[1].pageType, "content"); // Not educational for ABC
  assertEquals(result.pages[1].letter, "a");
  assertEquals(result.pages[2].letter, "b");
});

Deno.test("outlineToBook — respects explicit pageType", () => {
  const result = outlineToBook({
    bookName: "Test",
    pages: [
      { pageNumber: 1, pageType: "cover", title: "Cover" },
      { pageNumber: 2, pageType: "content", title: "Weird Content Page 2" },
    ],
  });
  assertEquals(result.pages[1].pageType, "content");
});

Deno.test("outlineToBook — cover title is always bookName even if outline cover title differs", () => {
  const result = outlineToBook({
    bookName: "Real Book Title",
    bookDescription: "A lovely book",
    pages: [
      { pageNumber: 1, title: "Some Placeholder" },
      { pageNumber: 2, title: "Page 2" },
    ],
  });
  assertEquals(result.pages[0].title, "Real Book Title");
  assertEquals(result.pages[0].content.funFact, "A lovely book");
});

Deno.test("outlineToBook — educational page 2 gets age/learning/skill text", () => {
  const result = outlineToBook({
    bookName: "Rhyme Time in Jersey City",
    bookType: "rhyming",
    gradeLevel: "PRE_K",
    pages: [
      { pageNumber: 1, title: "Cover" },
      { pageNumber: 2, title: "Educational Focus" },
      ...Array.from({ length: 10 }, (_, i) => ({
        pageNumber: i + 3,
        title: `Page ${i + 3}`,
      })),
    ],
  });
  const focus = result.pages[1];
  assertEquals(focus.pageType, "educational");
  assertEquals(focus.letter, "FOCUS");
  assertEquals(focus.content.mainConcept, "Pre-K (Ages 3-4)");
  assertEquals(focus.content.funFact, "PHONOLOGICAL AWARENESS");
  assertEquals(
    focus.content.activity,
    "FOCUS: RHYMING WORDS · 10 pages to explore together",
  );
});

Deno.test("outlineToBook — educational page falls back to targetAge and generic skill", () => {
  const result = outlineToBook({
    bookName: "Mystery Book",
    bookType: "unknown-type",
    targetAge: "4-6",
    pages: [
      { pageNumber: 1, title: "Cover" },
      { pageNumber: 2, pageType: "educational", title: "Educational Focus" },
      { pageNumber: 3, title: "Page 3" },
    ],
  });
  assertEquals(result.pages[1].content.mainConcept, "Ages 4-6");
  assertEquals(result.pages[1].content.funFact, "EARLY LEARNING");
  assertEquals(
    result.pages[1].content.activity,
    "FOCUS: EDUCATIONAL · 1 pages to explore together",
  );
});

Deno.test("outlineToBook — content pages keep empty funFact/activity", () => {
  const result = outlineToBook({
    bookName: "Rhyme Time",
    bookType: "rhyming",
    pages: [
      { pageNumber: 1, title: "Cover" },
      { pageNumber: 2, title: "Educational Focus" },
      ...Array.from({ length: 10 }, (_, i) => ({ pageNumber: i + 3, title: `Page ${i + 3}` })),
    ],
  });
  assertEquals(result.pages[2].content.funFact, "");
  assertEquals(result.pages[2].content.activity, "");
  assertEquals(result.pages[2].content.mainConcept, "Page 3");
});
