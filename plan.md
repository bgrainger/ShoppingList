# Shopping List Mobile Website

A simple mobile-friendly website that can be installed to the Home Screen on iOS.
It allows users to maintain multiple shopping lists and quickly add items and check them off on the go.

Design is inspired heavily by the iOS Reminders app, with a clean and minimal interface.

Top level items are categories with items nested underneath. No nested hierarchy.
There's a + button or just an always-visible input field to add new items.
Within each category, items can be checked off and deleted. Categories themselves can also be deleted.
Within a category, the unchecked items are shown first. Checking an item crosses it off and moves it below all unchecked items, to the top of the list of checked items. Only the three most recently checked items are shown. Older checked items are hidden.
Unchecking an item (e.g., undoing an accidental check) moves it to the bottom of the list of unchecked items, above all checked items.

Storage is local only right now but should be designed in a way that could be easily extended to sync across devices in the future. Data is stored in localStorage as JSON.

The page should be designed to load instantly from cache after the first load, with all assets cached by a service worker. It should be fully functional offline.

The app remembers all historical items. Entering text shows an autocomplete of all historical items that match the input. We can assume there are less than 500 or so so a simple in-memory search is sufficient.
Selecting an existing item from the autocomplete unchecks it within its current category. In this case (text entry) it goes to the top of the unchecked list, i.e., first in that category.
Typing out a new item in full and pressing Enter/Return/Accept creates a new item. For now, it should prompt for the category to add it to, showing all existing categories and allowing the user to enter a new one.
In the future, I'd like to invoke an AI model to guess the best category based on the item text and historical data, but for now we can just prompt the user to select or enter a category.

There's some kind of drop down to select between different lists. This is probably hidden behind a hamburger menu because it's not common functionality. The user can also create new lists and delete existing ones. Each list is stored separately in localStorage, and the app loads the last list on startup.

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

For readability, checked items are not crossed out but are instead shown with a lighter text color (still readable). The iOS rounded checkboxes are used if possible, empty for unchecked items and filled for checked items. Tapping the checkbox toggles the checked state.

Each category is collapsible to save space. Tapping the category name toggles the visibility of the items within it. The collapsed/expanded state of each category is also persisted in localStorage.

It's easy to dismiss the keyboard (or it dismisses automatically) after adding an item, so it doesn't get in the way of checking off items. Tapping outside the input field or pressing Enter/Return/Accept should dismiss the keyboard.

