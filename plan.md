# Shopping List Mobile Website

A simple mobile-friendly website that can be installed to the Home Screen on iOS.
It allows users to maintain multiple shopping lists and quickly add items and check them off on the go.
Built with plain HTML/CSS/JS (no framework) for simplicity, fast loading, and minimal dependencies. Hosted on GitHub Pages.

Design is inspired heavily by the iOS Reminders app, with a clean and minimal interface. Light mode only. Uses a simple grocery cart icon for the app icon and favicon.

Each list has a custom accent color chosen from a palette of 5–10 attractive colors when the list is created (default: blue). The accent color is used for checkboxes and other highlights. The default "Groceries" list uses green.

Top level items are categories with items nested underneath. No nested hierarchy.
Categories are ordered as specified in the initial data load; users can drag-and-drop to reorder categories, and that order is persisted. New categories are added at the bottom.

There is a single global input field at the bottom of the screen (near the onscreen keyboard) to add items.
Within each category, items can be checked off, renamed, and deleted. Categories themselves can also be deleted.
Deleting a category deletes all items in it, including their autocomplete history. Deleting an individual item also removes it from autocomplete history.
Delete is triggered by swipe-to-delete (iOS-style); no confirmation dialog, but the swipe gesture should require deliberate effort.

Within a category, the unchecked items are shown first. Checking an item moves it below all unchecked items, to the top of the list of checked items. Only the three most recently checked items are shown by default. Tapping the category header cycles through three states: collapsed, expanded with recent checked items, and expanded with all checked items.
Unchecking an item (e.g., undoing an accidental check) moves it to the bottom of the list of unchecked items, above all checked items.
Unchecked item order within a category is fixed (not manually reorderable).

Tapping an item's text (not the checkbox) puts it into inline edit mode, allowing the user to rename it. An item name must be unique within the list (across all categories); attempting to rename to a duplicate shows an error.

Storage is local only right now but should be designed in a way that could be easily extended to sync across devices in the future. Data is stored in localStorage as JSON.

The page should be designed to load instantly from cache after the first load, with all assets cached by a service worker. It should be fully functional offline.

The app remembers all historical items within the current list. Entering text in the global input shows an autocomplete of historical items from the current list that match the input. We can assume there are less than 500 or so so a simple in-memory search is sufficient.
Selecting an existing item from the autocomplete unchecks it within its current category and moves it to the top of the unchecked list in that category.
If the user types a name that exactly matches an existing item (checked or unchecked) and presses Enter, it behaves the same as selecting the autocomplete match — the existing item is unchecked and moved to the top.
Typing out a genuinely new item name and pressing Enter creates a new item at the top of the unchecked list in the chosen category. A modal sheet appears showing all existing categories and a text box to enter a new category name.
In the future, I'd like to invoke an AI model to guess the best category based on the item text and historical data, but for now we can just prompt the user to select or enter a category.

There's some kind of drop down to select between different lists. This is probably hidden behind a hamburger menu because it's not common functionality. The user can also create new lists, rename existing lists, and delete existing ones. Each list is stored as its own key in localStorage, with the list name as the key and the JSON data as the value. Users can create as many lists as they want (limited only by browser localStorage capacity). The app loads the last-used list on startup.

When the app loads for the first time, it creates a "Groceries" list. That list has the following categories and items, all checked off by default.

Breads & Cereals: Bread, Cheerios, Tortillas
Dairy: Milk, Eggs, Butter
Meat: Chicken breasts, Ground beef, Bacon
Produce: Bananas, Carrots, Potatoes
Frozen Foods: Ice cream, Chicken nuggets, Frozen peas
Snacks & Candy: Oreos, Potato chips, Fruit cups
Pasta, Rice & Beans: Rice, Pasta, Pinto beans
Beverages: Coffee, Tea, Orange juice
Household Items: Wax paper, Aluminum foil, CR2032 batteries
Baking Items: Flour, Sugar, Chocolate chips
Sauces & Condiments: Ketchup, Mustard, BBQ sauce
Spices & Seasonings: Garlic powder, Thyme, Salt
Canned Foods & Soups: Canned tomatoes, Chicken broth, 15oz black beans
Oils & Dressings: Olive oil, Vegetable oil, Balsamic vinegar
Personal Care & Health: Toothpaste, Shampoo, Ibuprofen
Seafood: Salmon, Shrimp, Tilapia

That gets written into localStorage as the initial data structure for the "Groceries" list. The user can then modify it as they like, and all changes are persisted in localStorage.

For readability, checked items are not crossed out but are instead shown with a lighter text color (still readable). The iOS rounded checkboxes are used, empty for unchecked items and filled (in the list's accent color) for checked items. Tapping the checkbox toggles the checked state.

Each category is collapsible to save space. Tapping the category name cycles through: collapsed → expanded (showing up to 3 recent checked items) → expanded (showing all checked items) → collapsed. The collapse state of each category is persisted in localStorage. All categories default to expanded on first load.

It's easy to dismiss the keyboard (or it dismisses automatically) after adding an item, so it doesn't get in the way of checking off items. Tapping outside the input field or pressing Enter/Return/Accept should dismiss the keyboard.

The page should be designed to load instantly from cache after the first load, with all assets cached by a service worker. It should be fully functional offline. The service worker auto-updates on the next visit when a new version is deployed.

