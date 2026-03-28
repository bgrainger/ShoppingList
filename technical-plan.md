# Technical Plan

## Tech Stack & Tooling

- **Language**: Vanilla HTML, CSS, JavaScript (ES modules, no bundler)
- **Hosting**: GitHub Pages (static files served from repo)
- **Dev server**: Local file serving (e.g., `npx serve` or Python `http.server`)
- **PWA**: Web App Manifest + Service Worker for offline support and Add to Home Screen on iOS
- **Storage**: `localStorage` — each list is a separate key

## File Structure

```
index.html          — Single-page app shell
style.css           — All styles
app.js              — Application logic (data model, rendering, event handling)
sw.js               — Service worker (cache-first strategy, auto-update)
manifest.json       — PWA manifest (name, icons, theme color, display: standalone)
icons/              — App icons (grocery cart) at required PWA sizes
```

## Data Model

### localStorage Layout

- `shoppingList:<listName>` — JSON blob for each list
- `shoppingList:_meta` — JSON blob storing global metadata (last-used list name, list of all list names with their accent colors)

### List Data Structure

```json
{
  "name": "Groceries",
  "color": "#34C759",
  "categories": [
    {
      "name": "Dairy",
      "collapsed": "expanded",
      "items": [
        {
          "name": "Milk",
          "checked": true,
          "checkedAt": 1711600000000
        }
      ]
    }
  ]
}
```

- `collapsed` is one of: `"collapsed"`, `"expanded"`, `"expanded-all"` (three-state toggle)
- `checkedAt` is a timestamp used to sort checked items (most recent first) and to determine which 3 to show
- Unchecked items have `checked: false` and no `checkedAt`
- Item order in the `items` array is the display order (unchecked first, then checked by `checkedAt` descending)
- Category order in the `categories` array is the display order (drag-and-drop reorderable)

### Autocomplete / History

Autocomplete is derived from the current list data at runtime — all item names across all categories (checked and unchecked) are the "history." Deleting an item or category removes items from autocomplete. No separate history store is needed.

## Color Palette

Offered when creating a new list (8 colors):

| Name     | Hex       |
|----------|-----------|
| Blue     | `#007AFF` |
| Green    | `#34C759` |
| Orange   | `#FF9500` |
| Red      | `#FF3B30` |
| Purple   | `#AF52DE` |
| Teal     | `#5AC8FA` |
| Pink     | `#FF2D55` |
| Yellow   | `#FFCC00` |

Default for new lists: Blue. Default for initial "Groceries" list: Green.

## Key Implementation Decisions

### Rendering

- Direct DOM manipulation (no virtual DOM). The data set is small enough that re-rendering a category or the full list is cheap.
- Each category is a `<section>` with a header and a `<ul>` of items.
- The global input field is a fixed-position element at the bottom of the viewport.

### Swipe-to-Delete

- Implemented via touch event handlers (`touchstart`, `touchmove`, `touchend`) on item and category rows.
- A horizontal swipe beyond a threshold reveals a red "Delete" background and performs the delete on release.
- Requires deliberate horizontal drag (>100px) to prevent accidental deletes.

### Category Drag-and-Drop Reorder

- Implemented via long-press to initiate drag, then touch/pointer move events to reorder.
- Visual feedback: the dragged category is elevated/highlighted and an insertion indicator shows the drop target.
- On drop, the `categories` array is reordered and persisted.

### Category Header Three-State Toggle

- Tap cycles: collapsed → expanded (3 recent checked) → expanded (all checked) → collapsed.
- A small indicator (e.g., chevron + count badge) shows the current state and how many hidden checked items exist.

### Inline Item Editing

- Tapping item text replaces it with an `<input>` pre-filled with the current name.
- On blur or Enter, validate uniqueness across all categories in the list. Show inline error if duplicate.
- On Escape, cancel the edit.

### Add Item Flow

1. User types in the global input at the bottom.
2. As they type, an autocomplete dropdown appears above the input showing matching items from the current list (all categories, checked and unchecked).
3. **Selecting an autocomplete suggestion**: The existing item is unchecked and moved to the top of its category's unchecked list. Input is cleared and keyboard is dismissed.
4. **Pressing Enter with text that matches an existing item exactly**: Same behavior as selecting the autocomplete match.
5. **Pressing Enter with genuinely new text**: A modal sheet slides up showing all existing category names as tappable options, plus a text field for entering a new category name. After category selection, the item is created at the top of that category's unchecked list. Input is cleared and keyboard is dismissed.

### Keyboard Dismissal

- Pressing Enter after adding an item blurs the input, dismissing the keyboard.
- Tapping anywhere outside the input field also blurs it.

### Service Worker Strategy

- **Install**: Pre-cache `index.html`, `style.css`, `app.js`, `manifest.json`, and icons.
- **Fetch**: Cache-first for all app assets. Network requests fall back to cache.
- **Update**: On each page load, the browser checks for an updated `sw.js`. If found, the new service worker installs in the background and activates on the next navigation (standard `skipWaiting` + `clients.claim` for immediate takeover).

### Hamburger Menu

- A slide-out drawer from the left edge, triggered by a hamburger icon in the top-left.
- Contents: list of all lists (tappable to switch), "New List" button, and per-list actions (rename, delete) via a secondary tap or swipe.

## Implementation Phases

### Phase 1: Static Shell & Data Model

- Create `index.html` with the app shell (header, category sections, fixed bottom input).
- Create `style.css` with iOS-inspired styling (rounded checkboxes, clean typography, light mode).
- Define the data model in `app.js`: functions to create, read, update, delete lists, categories, and items in localStorage.
- Seed the default "Groceries" list with all initial categories and items (all checked) on first load.
- Render the list from localStorage on page load.

### Phase 2: Core Interactions

- Toggle item checked state (tap checkbox).
- Checked item sorting and the 3-most-recent display rule.
- Category header three-state collapse toggle.
- Add item via global input (new item flow with category selection modal).
- Item uniqueness validation.
- Keyboard dismissal behavior.

### Phase 3: Autocomplete

- Build autocomplete from current list data.
- Show autocomplete dropdown above the input field as the user types.
- Handle selection of an existing item (uncheck and move to top).
- Handle exact-match-on-Enter (same as autocomplete selection).

### Phase 4: Delete & Edit

- Swipe-to-delete for items and categories.
- Remove deleted items from autocomplete history.
- Inline item rename (tap text → edit → validate uniqueness).

### Phase 5: Category Reorder

- Long-press to drag categories.
- Visual drag feedback and drop indicator.
- Persist reordered category array.

### Phase 6: Multi-List Support

- Hamburger menu with list switcher.
- Create new list (name + color picker).
- Rename and delete lists.
- Persist last-used list in metadata.
- Per-list accent color applied to checkboxes and UI highlights.

### Phase 7: PWA & Offline

- Create `manifest.json` with app name, icons, theme color, `display: standalone`.
- Create `sw.js` with cache-first strategy and auto-update.
- Generate/add grocery cart icons at required sizes (192×192, 512×512).
- Test Add to Home Screen on iOS Safari.
- Verify full offline functionality.
