# Homepage: show every library thumbnail, instantly

Today, homepage book covers are gated three times before they can paint: whole category sections wait for a `LazyCategorySection` observer, each card waits for its own intersection observer (`100px` margin, `triggerOnce`), and the preloader warms images at 800px wide even though a card renders roughly 160-200px. Cards that sit off to the right inside a horizontal carousel are never "in view", so their thumbnails stay as letter placeholders until the user scrolls them into the viewport.

## Three ways to fix it

### 1. Load by carousel position, not viewport intersection (recommended)
Inside a horizontal carousel, "in viewport" is the wrong signal. Render the image for every card in a category once that category section is mounted, instead of per-card observers. Keep the observer only as a fallback for very large categories (e.g. render the first 8 eagerly, the rest after the section is visible). This alone makes the full row of thumbnails appear as the user swipes, with no pop-in.

### 2. Match preload size to render size and prioritize above-the-fold covers
- Preload homepage covers at ~400px / quality 75 rather than 800px / 85, so the bytes actually match what the card displays and arrive several times faster on mobile.
- Mark the first row's images `priority` (eager + `fetchpriority="high"`), and let the rest stay `loading="lazy"` with `decoding="async"`.
- Widen the preloader's priority batch from 3 to cover the first visible row per category.

### 3. Remove the section-level lazy gate and the loading blocker
- Render the first two category sections immediately, lazy-mounting only later sections.
- The homepage currently returns a full-page "Loading..." state while books load, which delays every image request. Render the section skeletons instead so image fetches can start as soon as data arrives.

## Technical notes

Files involved:
- `src/components/library/LibraryBookCard.tsx` — replace the per-card `useIntersectionObserver` gate with an `eager`/`priority` prop supplied by the carousel; keep the placeholder only for missing covers.
- `src/components/library/CategoryBookCarousel.tsx` — pass `priority` for the first N slides and `eager` for the rest.
- `src/components/library/CategorizedBookSections.tsx` / `LazyCategorySection` — mount the first sections without the observer gate.
- `src/hooks/useHomeImagePreloader.ts` — width 400, quality 75, larger priority count.
- `src/components/ui/book-image.tsx` — accept a `width`/`sizes` override so cards request card-sized images, and add `fetchpriority` when `priority` is set.
- `src/pages/Index.tsx` — drop the blocking full-page loader for books.

No backend, data, or business-logic changes; this is presentation and loading behavior only.
