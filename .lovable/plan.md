
# Faster Next-Page Image Loads

Goal: When you tap the black "Next" button on a published/public book page, the new image should appear instantly instead of fading in slowly.

Three small, targeted changes — all frontend, no business-logic churn.

## 1. Aggressive next-page preloading

File: `src/hooks/usePublicBookImagePreloader.ts` (and its consumer on the public reading view).

- Currently only the first 3 pages are marked `priority` and the rest trickle in via batched preloads. On a 12/28-page book, page N+1 often isn't cached yet when you tap Next.
- Change: in addition to the existing bulk preload, add a small "window" preloader driven by the currently visible page index — force-fetch pages `current+1` and `current+2` at high priority whenever the current page changes.
- Implementation: extend the hook to accept an optional `currentPageIndex` and call `optimizeImageUrl` + `new Image()` for the next 2 URLs immediately. Reuses existing service-worker cache, so no new infra.

## 2. Lower transform size + priority swap for the visible page

File: `src/components/daily-published/PublicPageImage.tsx` and `usePublicBookImagePreloader.ts`.

- Today the preloader requests `width: 1200`, but on mobile (430 CSS px × dpr 3 ≈ 1290, and the image is rendered smaller than full width) 800px is plenty and downloads ~40% faster.
- Change:
  - Lower preloader `width` from 1200 → 800 for the public reader path.
  - In `PublicPageImage`, pass `priority={true}` for the currently active page (not just `isFirstImage`) so `<img fetchpriority="high">` is set on each new page too.

## 3. Keep the previous image visible until the new one decodes

File: `src/components/daily-published/PublicPageImage.tsx`.

- Right now, on page change `imageLoaded` resets, the gradient placeholder fades in, then the new image crossfades in — that's the "slow" feeling even when the fetch itself is fast.
- Change: remove the reset-to-placeholder on page change. Render the previous `<BookImage>` underneath and only swap opacity once the new image's `onLoad` fires. No placeholder flash → perceived load time drops to near zero for cached pages.

## Technical notes

- No changes to edge functions, DB, or the protected image-optimization core (`BookImage`, `optimizeImageUrl`, service worker). We only tune inputs and the local render state.
- Respects `docs/IMAGE_OPTIMIZATION_ARCHITECTURE.md` rules: still routes through `BookImage` + `useImagePreloader`.
- Verification: build passes; manually tap Next on a public book and confirm next image appears without a visible placeholder flash; Network tab shows `width=800` and `fetchpriority=high` on the active page.

## Out of scope

- No changes to book creation, chat, or city validation flows.
- No new dependencies.
