## How it works today

- Allowed channels live in one shared `youtube_channels` table. Any signed-in user can add/remove rows; everyone sees all rows where `is_active = true` (verified in the table's access rules).
- The kid-facing `/videos` page (`VideoGrid`) loads active channels, then pulls up to 6 recent videos per channel via the `youtube-video` edge function. No channels = no videos.
- The only UI is the admin page `/admin/youtube-channels`, where you paste a URL / `@handle` / `UC…` ID.
- Separately, `video_content` holds hand-picked individual videos (`VideoManagement`), and `ChannelBrowser.tsx` is dead code hardcoded to Google's channel.

## Confirmed bug in the add flow

`useYouTubeChannels.extractChannelId` strips the `@` from handles and returns the handle text, and after the edge function resolves it, the code saves the **input string** as `channel_id` instead of the resolved `channelInfo.channelId`. `get-channel-videos` passes `channelId` straight to the YouTube API with no handle resolution — so any channel added by handle or custom URL saves a non-`UC…` ID and returns zero videos.

## Plan

Keep the shared list and the admin-only page; make adding channels fast and correct.

1. **Fix ID resolution** (`src/hooks/useYouTubeChannels.ts`)
   - Preserve `@` for handles when extracting.
   - Save `channelInfo.channelId` (the resolved `UC…` ID) as `channel_id`, never the raw input.
   - Surface a clear error when the channel can't be resolved.

2. **Add search-and-add** (`src/pages/admin/YouTubeChannels.tsx`)
   - The edge function already supports `action=search-channels`. Add a search box: type a channel name → debounced search → results grid with thumbnail, title, subscriber count, and an "Add" button per result.
   - Keep the paste-a-URL input as a secondary option.
   - Disable/mark results already in the list.

3. **Bulk add**
   - Textarea accepting one URL/handle/ID per line, resolving and inserting each with a per-line success/failure summary.

4. **Cleanup**
   - Add a link to `/admin/youtube-channels` from the admin nav so it's reachable without typing the URL.
   - Delete the unused `ChannelBrowser.tsx` (hardcoded Google channel).

5. **Verify**
   - Add a channel by `@handle`, confirm a `UC…` ID is stored, and confirm its videos appear on `/videos`.

## Technical notes

- No schema or access-rule changes; the existing shared-list rules already allow signed-in users to manage rows, and the page stays wrapped in `AdminOnly`.
- Search results are cached 7 days by the edge function, so repeated searches don't burn YouTube API quota.
