# Homepage: swipe through every book, like the Library

Right now the homepage and the Library render the same component (`CategorizedBookSections`) from the same data source (the `get_library_books_by_completion` RPC), but the homepage narrows it twice:

- It slices the book list to the first 30 books before grouping them into categories.
- It passes `maxBooksPerCategory={5}`, so each carousel stops after 5 slides.

QA of the live data confirms the impact: the RPC returns 93 published library books across 11 categories (digraphs 39, rhyming 15, sight words 11, ABC 8, emotions 6, opposites 4, manners 3, CVC 3, shapes 2, animals 1, other 1). The homepage keeps only the first 30 of those and then shows at most 5 per category — so a signed-in user typically sees roughly a dozen cards across a handful of categories, not 30, and any category whose books all sit outside the top 30 is missing from the homepage entirely.

The Library passes neither limit, which is why swiping there keeps going and swiping on the homepage stops early.


## What changes

1. Remove the 30-book slice on the homepage and feed the full personalized list into the sections.
2. Remove the per-category cap so every category carousel holds all of its books, exactly like the Library.
3. Keep the personalized ordering (most recently completed first) and keep the "View all" links, so a category can still be opened as a full grid page.
4. Keep the existing image behavior: card-sized 400px covers, the first few marked priority, the rest eager — so swiping right reveals covers already loaded rather than letter placeholders.

## Ensuring it stays fast

- Only the first two category sections mount immediately; later sections still mount when scrolled to, so the initial paint cost does not grow with the number of categories.
- The image preloader warms the first batch of covers at card size; remaining covers load as normal lazy images inside their carousel.
- No new network requests: the homepage already fetches the full list and was throwing most of it away.

## Technical notes

- `src/pages/Index.tsx`: drop `limitedLibraryItems` (the `slice(0, 30)`) and the `maxBooksPerCategory={5}` prop; pass `libraryItems` directly.
- `src/components/library/CategorizedBookSections.tsx` and `CategoryBookCarousel.tsx` already handle an absent `maxBooks` — no change needed there.
- No backend, data, or business-logic changes; presentation only.
