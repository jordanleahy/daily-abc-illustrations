# Fill available vertical height in the image preview

## Problem
In `BookEditorPanel` the current image sits inside `aspect-square`, so it renders as a 1:1 box regardless of how tall the drawer is. On a phone in landscape or on a tall drawer, large empty bands appear above/below the image (visible in the screenshot).

## Change
Convert the image container from a fixed aspect ratio to a flex child that grows to fill the drawer's remaining height, while the title bar, action toolbar, and footer buttons stay pinned.

### Files
- `src/components/chat/BookEditorPanel.tsx`

### Edits
1. Make the scrollable content region a flex column (`flex flex-col` in place of the current `space-y-4` stack) so children can claim remaining height.
2. Replace `aspect-square` on the image container (line 834) with `flex-1 min-h-[50vh]`:
   - `flex-1` — grow to fill leftover vertical space in the drawer.
   - `min-h-[50vh]` — guarantees a usable size on very short viewports (fallback so the image never collapses).
   - Keep `overflow-hidden rounded-lg border-2 border-dashed border-primary/30 bg-muted/30`.
3. Keep the inner `<BookImage className="w-full h-full object-contain" />` — `object-contain` already preserves the image's aspect ratio inside whatever box it's given, so the picture scales up to the taller container without cropping or stretching.
4. Verify overlays (Westin loader, text overlay, action buttons) still position correctly since they use `absolute inset-0` / `bottom-0` inside the same wrapper — no changes needed there.
5. Keep the rest of the panel (title, `Text/Color` chips, Back/Next footer) outside the growing region so they don't shrink.

### Out of scope
- No change to `PageImageSection.tsx` (different surface — reader view, not editor).
- No change to image generation, prompts, or `BookImage`.
- No layout changes to the outer sheet/drawer chrome.

## Technical notes
`object-contain` letterboxes rather than crops, so an image that's square-ish will still show side padding when the box becomes tall + narrow — this is desired (no cropping of illustrations). If the user later wants the image to also expand horizontally by cropping, that's a separate `object-cover` decision.
