// Register the service worker
if ('serviceWorker' in navigator) {
	window.addEventListener('load', () => {
	  navigator.serviceWorker.register('/service-worker.js')
		.then(registration => {
		  console.log('Service Worker registered:', registration);
		})
		.catch(error => {
		  console.log('Service Worker registration failed:', error);
		});
	});
  }

const itemInput = document.getElementById('itemInput');
const addButton = document.getElementById('addButton');
const shoppingList = document.getElementById('shoppingList');

let items = [];

// Load items from local storage
const loadItems = () => {
  const storedItems = localStorage.getItem('shoppingListItems');
  if (storedItems) {
    items = JSON.parse(storedItems);
    renderItems();
  }
};

// Save items to local storage and sync with server
const saveItems = () => {
	localStorage.setItem('shoppingListItems', JSON.stringify(items));
	syncWithServer();
  };

// Render items on the page
const renderItems = () => {
  shoppingList.innerHTML = '';

  const categories = {};
  items.forEach(item => {
    if (!categories[item.category]) {
      categories[item.category] = [];
    }
    categories[item.category].push(item);
  });

  for (const category in categories) {
    const categoryElement = document.createElement('div');
    categoryElement.className = 'category';
    const heading = document.createElement('h3');
    heading.textContent = category;
    categoryElement.appendChild(heading);

    categories[category].forEach(item => {
      const itemElement = document.createElement('div');
      itemElement.className = 'item';
      if (item.checked) {
        itemElement.classList.add('checked');
      }

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = item.checked;
      checkbox.addEventListener('change', () => {
        item.checked = checkbox.checked;
        saveItems();
        renderItems();
      });

      const label = document.createElement('label');
      label.textContent = item.name;

      itemElement.appendChild(checkbox);
      itemElement.appendChild(label);
      categoryElement.appendChild(itemElement);
    });

    shoppingList.appendChild(categoryElement);
  }
};

// Add a new item
const addItem = () => {
  const itemName = itemInput.value.trim();
  if (itemName !== '') {
    const category = 'Uncategorized'; // Default category
    const item = {
      name: itemName,
      category: category,
      checked: false
    };
    items.push(item);
    itemInput.value = '';
    saveItems();
    renderItems();
  }
};

// Sync items with server
const syncWithServer = () => {
  // Simulate an API call to sync items with the server
  setTimeout(() => {
    console.log('Items synced with server:', items);
  }, 1000);
};

// Event listeners
addButton.addEventListener('click', addItem);
itemInput.addEventListener('keypress', event => {
  if (event.key === 'Enter') {
    addItem();
  }
});

// Load items on page load
loadItems();
