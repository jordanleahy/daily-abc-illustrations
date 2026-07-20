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
