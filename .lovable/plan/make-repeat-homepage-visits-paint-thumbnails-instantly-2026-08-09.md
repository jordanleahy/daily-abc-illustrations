# Make repeat homepage visits paint thumbnails instantly

The app already ships a service worker (`public/sw.js`) registered from `src/main.tsx`, with a 90-day cache-first image cache. Repeat visits still refetch homepage covers because of how that cache is keyed and warmed:

- Homepage cards now request covers at **width 400 / quality 75**, but `prefetchImagesToCache` warms only the **600 / 800 / 1200 / original** variants. Supabase image-transform URLs differ by query string, and the service worker matches on the exact request URL, so the warmed entries never match what the homepage actually renders — every visit is a cache miss.
- `public/_headers` only tunes `/storage/v1/object/public/book-covers*`. The transformed covers the app requests come from the **render** endpoint (`/storage/v1/render/image/...`) on the Supabase origin, so those rules don't apply to them at all.
- The image cache has no size cap and no storage-persistence request, so on mobile the browser can evict the whole bucket between visits.

## The fix

**1. Warm exactly the variants the UI renders**
Give the prefetcher the same width/quality the cards ask for instead of a fixed 600/800/1200 ladder. The homepage warms 400/75; reading views keep their larger sizes. One warmed variant per image, matching the rendered URL, means a guaranteed hit on the next visit and a third of the prefetch bandwidth.

**2. Add a dedicated cover-thumbnail path in the service worker**
Route Supabase image-transform requests to a `book-covers` cache with:
- cache-first response, so a repeat visit paints from disk with no network wait,
- stale-while-revalidate refresh in the background so covers still update,
- a normalized cache key (path + width + quality, ignoring incidental params like tokens) so near-identical URLs still hit,
- an LRU trim to a fixed entry cap so the bucket can't grow without bound.

**3. Ask the browser to keep the cache**
Call `navigator.storage.persist()` once after the service worker activates, so the cover cache survives storage pressure on mobile. Fall back silently when the browser declines.

**4. Cache-control tuning where it applies**
- Extend `public/_headers` to cover the render/transform paths and the app's own hashed assets.
- Set a long `cacheControl` on cover uploads so Supabase serves `max-age` far above its 1-hour default; covers are content-addressed by book/page, and the service worker's revalidation handles replacements.

**5. Warm the next visit, not just this one**
After the homepage data resolves, warm the remaining category covers during idle time so the *second* visit is fully cached even if the user never swiped that far.

## Technical notes

Files involved:
- `src/utils/imageCaching.ts` — accept width/quality options, warm one matching variant instead of the 4-variant ladder.
- `src/hooks/useImagePreloader.ts` / `useTypedImagePreloader.ts` — pass the caller's width/quality through to the prefetch message.
- `src/hooks/useHomeImagePreloader.ts` — keep 400/75, warm the full list on idle after the priority batch.
- `public/sw.js` — new `dailyabc-covers-v2` cache with normalized keys, stale-while-revalidate, and LRU trim; add it to the activate-time keep list.
- `src/utils/serviceWorker.ts` — request persistent storage; include the new cache in stats and clearing.
- `public/_headers` — add render/transform and hashed-asset rules.

No backend logic, data model, or business-rule changes; this is caching and asset delivery only.

## Verification

- Load the homepage, reload, and confirm cover requests are served from the service worker cache (no network fetch) with covers painted on first frame.
- Confirm the warmed URL and the rendered URL are byte-identical strings.
- Confirm cache entry count stays under the cap after browsing many categories.
