
## Fix: Etsy Drawer Copy Buttons Causing Unwanted Navigation

### Problem
When tapping copy buttons in the Etsy Listing drawer on mobile, the app navigates to the book view instead of just copying the text and staying on the current page.

### Root Cause
The copy button handlers in `EtsyPostDrawer.tsx` do not prevent event propagation. On mobile devices, touch events can bubble up through the drawer portal or trigger unexpected navigation behavior. The drawer is rendered inside a `UserBookCard` that has an `onClick` handler which navigates to the book view.

While the Drawer uses a Portal (which should isolate clicks), mobile touch events can sometimes behave differently. The existing pattern in `SocialPostTracker.tsx` already uses `e.preventDefault()` and `e.stopPropagation()` to prevent this exact issue.

### Solution
Update the `handleCopy` function in `EtsyPostDrawer.tsx` to accept the React mouse event and call both `e.preventDefault()` and `e.stopPropagation()` before executing the copy logic. This prevents the touch/click event from bubbling up and triggering any parent handlers.

---

### Technical Details

**File to modify:** `src/components/books/EtsyPostDrawer.tsx`

**Changes:**
1. Update the `handleCopy` function signature to accept the event parameter:
   ```typescript
   const handleCopy = async (
     e: React.MouseEvent,
     text: string,
     type: 'title' | 'description' | 'tags'
   ) => {
     e.preventDefault();
     e.stopPropagation();
     // ... rest of existing logic
   };
   ```

2. Update all copy button onClick handlers to pass the event:
   - Title copy button: `onClick={(e) => handleCopy(e, title, 'title')}`
   - Description copy button: `onClick={(e) => handleCopy(e, description, 'description')}`
   - Tags copy button: `onClick={(e) => handleCopy(e, tagsText, 'tags')}`

3. Also add event prevention to the PDF download buttons for consistency:
   - Color PDF button: Add `e.stopPropagation()` to the existing onClick
   - Coloring Book PDF button: Add `e.stopPropagation()` to the existing onClick

4. Add event prevention to the footer buttons:
   - "I've Listed on Etsy" button: Add `e.stopPropagation()`
   - "Close" button: Add `e.stopPropagation()`

This follows the established pattern used in `SocialPostTracker.tsx` for handling mobile touch events in drawer components.
