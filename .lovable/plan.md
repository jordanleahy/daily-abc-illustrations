# Screen-time timer stops enforcing after a video is closed

## What I verified in the code

- The deadline is a single localStorage key `returnHomeAt`, written once on reward purchase (`RewardsCarousel.tsx`, 10 minutes) and read by `useScreenTimeTimer`.
- `useScreenTimeTimer`'s effect runs with an empty dependency array and reads `returnHomeAt` **only on mount**. It never re-reads on route changes within the same mounted tree, storage events, or tab focus.
- `dismissExpiredModal` **deletes** `returnHomeAt`. After the modal is dismissed once, the key is gone, so any later visit to `/videos` has no deadline at all — the timer returns `null` and nothing ever expires.
- The hook is instantiated independently inside `VideoGrid` and `ChannelVideosList`. There is no app-level enforcement, so timing only exists on those two screens.
- On expiry, `VideoGrid`/`ChannelVideosList` show the modal but never clear `playingVideoId`, so the YouTube iframe keeps playing behind the dialog.
- The interval callback closes over a stale `showWarning`, so the warning banner can fail to appear.

## Three ways to fix it

**Option A — Global timer provider (recommended).**
Move screen-time enforcement out of the two video components into a single app-level provider mounted in `App.tsx`. It owns one interval, re-reads the deadline on mount, on route change, on `visibilitychange`, and on the `storage` event, and renders the warning banner and expired modal globally. `VideoGrid`/`ChannelVideosList` just consume `timeRemaining`. This makes the timer independent of which video component is mounted or remounted.

**Option B — Make the deadline the single source of truth (fix the delete).**
Stop removing `returnHomeAt` on dismiss. Instead keep the expired deadline in place and treat "now >= deadline" as the blocked state, clearing it only when new screen time is purchased. Add a guard on `/videos` that immediately shows the expired modal and refuses playback when the deadline has passed, so reopening the page can't grant unlimited watching.

**Option C — Hard-stop playback on expiry.**
On expiry, clear `playingVideoId` and unmount/destroy the YouTube player before showing the modal, and block `handleVideoClick` when no valid remaining time exists. This guarantees the "close out the video and start another" path cannot bypass enforcement even if the modal is dismissed.

I recommend doing all three: A fixes where the timer lives, B fixes the state that gets destroyed, C fixes what actually stops the video.

## Implementation detail (technical)

1. New `src/contexts/ScreenTimeContext.tsx`
   - Reads `returnHomeAt`; exposes `deadline`, `timeRemaining`, `isExpired`, `hasTime`, `refresh()`, `grantTime(ms)`.
   - One `setInterval` (1s) recomputing from the deadline; listeners for `storage`, `visibilitychange`, and `useLocation()` changes so the value is always re-read.
   - Uses a ref for `showWarning` to avoid the stale-closure bug.
   - Renders `ScreenTimeWarningBanner` and `ScreenTimeExpiredModal` once, globally.
2. `App.tsx`: wrap the router content in `ScreenTimeProvider`.
3. `useScreenTimeTimer.ts`: becomes a thin wrapper over the context so existing call sites keep working; remove the per-component interval and the local modal state.
4. Dismiss behavior: keep `returnHomeAt` (expired) rather than deleting it; navigation to `/` or the last book stays as-is.
5. `VideoGrid.tsx` / `ChannelVideosList.tsx`: remove local modal/banner rendering; in `handleVideoClick`, return early and show the expired modal when `!hasTime`; add an effect that sets `playingVideoId` to `null` when `isExpired` flips true.
6. `RewardsCarousel.tsx`: call `grantTime()` from the context instead of writing localStorage directly, so an active session extends correctly.

No database, edge function, or RLS changes are needed — this is entirely client-side timer/state logic.
