// ============================================================
// Shopping List App
// ============================================================

// ---------- Constants ----------

const COLORS = [
  { name: 'Blue',   hex: '#007AFF' },
  { name: 'Green',  hex: '#34C759' },
  { name: 'Orange', hex: '#FF9500' },
  { name: 'Red',    hex: '#FF3B30' },
  { name: 'Purple', hex: '#AF52DE' },
  { name: 'Teal',   hex: '#5AC8FA' },
  { name: 'Pink',   hex: '#FF2D55' },
  { name: 'Yellow', hex: '#FFCC00' },
];

const DEFAULT_COLOR = '#007AFF';
const GROCERIES_COLOR = '#34C759';
const STORAGE_PREFIX = 'shoppingList:';
const META_KEY = STORAGE_PREFIX + '_meta';
const RECENT_CHECKED_LIMIT = 3;
const SWIPE_THRESHOLD = 100;
const CHECK_ANIM_MS = 250;
const UNCHECK_ANIM_MS = 250;

// ---------- Data helpers ----------

function getMeta() {
  const raw = localStorage.getItem(META_KEY);
  if (raw) return JSON.parse(raw);
  return { lastList: null, lists: [] };
}

function saveMeta(meta) {
  localStorage.setItem(META_KEY, JSON.stringify(meta));
}

function getList(name) {
  const raw = localStorage.getItem(STORAGE_PREFIX + name);
  return raw ? JSON.parse(raw) : null;
}

function saveList(list) {
  localStorage.setItem(STORAGE_PREFIX + list.name, JSON.stringify(list));
}

function deleteListStorage(name) {
  localStorage.removeItem(STORAGE_PREFIX + name);
}

function renameListStorage(oldName, newName) {
  const list = getList(oldName);
  if (!list) return;
  deleteListStorage(oldName);
  list.name = newName;
  saveList(list);
}

// ---------- Default Groceries data ----------

function createDefaultGroceries() {
  const now = Date.now();
  const categories = [
    { name: 'Breads & Cereals', items: ['Bread', 'Cheerios', 'Tortillas'] },
    { name: 'Dairy', items: ['Milk', 'Eggs', 'Butter'] },
    { name: 'Meat', items: ['Chicken breasts', 'Ground beef', 'Bacon'] },
    { name: 'Produce', items: ['Bananas', 'Carrots', 'Potatoes'] },
    { name: 'Frozen Foods', items: ['Ice cream', 'Chicken nuggets', 'Frozen peas'] },
    { name: 'Snacks & Candy', items: ['Oreos', 'Potato chips', 'Fruit cups'] },
    { name: 'Pasta, Rice & Beans', items: ['Rice', 'Pasta', 'Pinto beans'] },
    { name: 'Beverages', items: ['Coffee', 'Tea', 'Orange juice'] },
    { name: 'Household Items', items: ['Wax paper', 'Aluminum foil', 'CR2032 batteries'] },
    { name: 'Baking Items', items: ['Flour', 'Sugar', 'Chocolate chips'] },
    { name: 'Sauces & Condiments', items: ['Ketchup', 'Mustard', 'BBQ sauce'] },
    { name: 'Spices & Seasonings', items: ['Garlic powder', 'Thyme', 'Salt'] },
    { name: 'Canned Foods & Soups', items: ['Canned tomatoes', 'Chicken broth', '15oz black beans'] },
    { name: 'Oils & Dressings', items: ['Olive oil', 'Vegetable oil', 'Balsamic vinegar'] },
    { name: 'Personal Care & Health', items: ['Toothpaste', 'Shampoo', 'Ibuprofen'] },
    { name: 'Seafood', items: ['Salmon', 'Shrimp', 'Tilapia'] },
  ];

  return {
    name: 'Groceries',
    color: GROCERIES_COLOR,
    categories: categories.map((cat, ci) => ({
      name: cat.name,
      collapsed: 'expanded',
      items: cat.items.map((item, ii) => ({
        name: item,
        checked: true,
        checkedAt: now - (ci * 100 + ii),
      })),
    })),
  };
}

// ---------- App State ----------

let currentList = null;
let pendingItemName = null; // for the category modal
let filterMode = false;
let filteredCategoryNames = new Set();

// ---------- DOM references ----------

const listContainer = document.getElementById('list-container');
const listTitle = document.getElementById('list-title');
const addInput = document.getElementById('add-input');
const autocompleteList = document.getElementById('autocomplete-list');

const categoryModal = document.getElementById('category-modal');
const modalCategories = document.getElementById('modal-categories');
const modalCancel = document.getElementById('modal-cancel');
const newCategoryInput = document.getElementById('new-category-input');
const newCategoryBtn = document.getElementById('new-category-btn');

const menuBtn = document.getElementById('menu-btn');
const filterBtn = document.getElementById('filter-btn');
const filterIconEye = document.getElementById('filter-icon-eye');
const filterIconEyeOff = document.getElementById('filter-icon-eye-off');
const menuDrawer = document.getElementById('menu-drawer');
const menuOverlay = document.getElementById('menu-overlay');
const menuClose = document.getElementById('menu-close');
const menuListItems = document.getElementById('menu-list-items');
const menuNewList = document.getElementById('menu-new-list');

const newListModal = document.getElementById('new-list-modal');
const newListModalTitle = document.getElementById('new-list-modal-title');
const newListName = document.getElementById('new-list-name');
const newListCancel = document.getElementById('new-list-cancel');
const newListSave = document.getElementById('new-list-save');
const colorPicker = document.getElementById('color-picker');

// ---------- Initialization ----------

function init() {
  let meta = getMeta();
  if (meta.lists.length === 0) {
    const groceries = createDefaultGroceries();
    saveList(groceries);
    meta = { lastList: 'Groceries', lists: [{ name: 'Groceries', color: GROCERIES_COLOR }] };
    saveMeta(meta);
  }

  const listName = meta.lastList || meta.lists[0].name;
  loadList(listName);
  setupEventListeners();
}

function loadList(name) {
  currentList = getList(name);
  if (!currentList) {
    const meta = getMeta();
    if (meta.lists.length > 0) {
      currentList = getList(meta.lists[0].name);
      name = meta.lists[0].name;
    } else {
      return;
    }
  }

  const meta = getMeta();
  meta.lastList = name;
  saveMeta(meta);

  document.documentElement.style.setProperty('--accent', currentList.color);
  listTitle.textContent = currentList.name;
  filterMode = false;
  filteredCategoryNames = new Set();
  updateFilterIcon();
  renderList();
}

// ---------- Rendering ----------

function renderList() {
  listContainer.innerHTML = '';
  if (!currentList) return;

  currentList.categories.forEach((cat, catIndex) => {
    if (filterMode && !filteredCategoryNames.has(cat.name)) return;
    const section = document.createElement('section');
    section.className = 'category-section';
    section.dataset.catIndex = catIndex;

    // Header
    const header = document.createElement('div');
    header.className = 'category-header';
    header.innerHTML = `
      <span class="drag-handle">☰</span>
      <span class="chevron ${cat.collapsed === 'collapsed' ? 'collapsed' : 'expanded'}">▼</span>
      <span class="category-name">${escapeHtml(cat.name)}</span>
      ${buildCheckedCountBadge(cat)}
      <div class="delete-bg">Delete</div>
    `;

    // Tap header to toggle collapse (not on drag handle)
    header.addEventListener('click', (e) => {
      if (e.target.closest('.drag-handle')) return;
      cycleCollapse(catIndex);
    });

    setupSwipe(header, () => deleteCategory(catIndex));
    section.appendChild(header);

    // Items list
    const ul = document.createElement('ul');
    ul.className = 'category-items';
    if (cat.collapsed === 'collapsed') {
      ul.classList.add('collapsed-items');
    }

    const unchecked = cat.items.filter(i => !i.checked);
    const checked = cat.items.filter(i => i.checked).sort((a, b) => b.checkedAt - a.checkedAt);

    unchecked.forEach(item => {
      ul.appendChild(createItemRow(item, catIndex));
    });

    if (cat.collapsed === 'expanded') {
      const visible = checked.slice(0, RECENT_CHECKED_LIMIT);
      visible.forEach(item => {
        ul.appendChild(createItemRow(item, catIndex));
      });
      if (checked.length > RECENT_CHECKED_LIMIT) {
        const more = document.createElement('div');
        more.className = 'more-checked';
        more.textContent = `${checked.length - RECENT_CHECKED_LIMIT} more checked`;
        more.addEventListener('click', (e) => {
          e.stopPropagation();
          cycleCollapse(catIndex);
        });
        ul.appendChild(more);
      }
    } else if (cat.collapsed === 'expanded-all') {
      checked.forEach(item => {
        ul.appendChild(createItemRow(item, catIndex));
      });
    }

    section.appendChild(ul);
    listContainer.appendChild(section);
  });
}

function createItemRow(item, catIndex) {
  const li = document.createElement('li');
  li.className = 'item-row';
  li.dataset.itemName = item.name;

  const checkbox = document.createElement('div');
  checkbox.className = 'checkbox' + (item.checked ? ' checked' : '');
  checkbox.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleItem(catIndex, item.name);
  });

  const textSpan = document.createElement('span');
  textSpan.className = 'item-text' + (item.checked ? ' checked-text' : '');
  textSpan.textContent = item.name;
  textSpan.addEventListener('click', (e) => {
    e.stopPropagation();
    startInlineEdit(li, catIndex, item.name);
  });

  const deleteBg = document.createElement('div');
  deleteBg.className = 'delete-bg';
  deleteBg.textContent = 'Delete';

  li.appendChild(checkbox);
  li.appendChild(textSpan);
  li.appendChild(deleteBg);

  setupSwipe(li, () => deleteItem(catIndex, item.name));

  return li;
}

function buildCheckedCountBadge(cat) {
  const checkedCount = cat.items.filter(i => i.checked).length;
  if (checkedCount === 0) return '';
  return `<span class="checked-count">${checkedCount} ✓</span>`;
}

// ---------- Filter ----------

function toggleFilter() {
  if (!filterMode) {
    // Entering filter mode: snapshot categories with at least one unchecked item
    filteredCategoryNames = new Set(
      currentList.categories
        .filter(cat => cat.items.some(i => !i.checked))
        .map(cat => cat.name)
    );
    filterMode = true;
  } else {
    filterMode = false;
    filteredCategoryNames = new Set();
  }
  updateFilterIcon();
  renderList();
}

function updateFilterIcon() {
  filterIconEye.classList.toggle('hidden', filterMode);
  filterIconEyeOff.classList.toggle('hidden', !filterMode);
}

// ---------- Category collapse ----------

function cycleCollapse(catIndex) {
  const cat = currentList.categories[catIndex];
  const checkedCount = cat.items.filter(i => i.checked).length;

  if (cat.collapsed === 'collapsed') {
    cat.collapsed = 'expanded';
  } else if (cat.collapsed === 'expanded') {
    // Skip expanded-all if all checked items are already visible
    cat.collapsed = checkedCount <= RECENT_CHECKED_LIMIT ? 'collapsed' : 'expanded-all';
  } else {
    cat.collapsed = 'collapsed';
  }
  saveList(currentList);
  renderList();
}

// ---------- Toggle item checked ----------

function toggleItem(catIndex, itemName) {
  const cat = currentList.categories[catIndex];
  const itemIdx = cat.items.findIndex(i => i.name === itemName);
  if (itemIdx === -1) return;

  const item = cat.items[itemIdx];
  const isChecking = !item.checked;

  // Determine if animation is needed (no animation if item stays in place)
  let needsAnimation = false;
  if (isChecking) {
    const unchecked = cat.items.filter(i => !i.checked);
    needsAnimation = unchecked[unchecked.length - 1].name !== itemName;
  } else {
    const checked = cat.items.filter(i => i.checked);
    const mostRecent = checked.reduce((a, b) => (a.checkedAt > b.checkedAt ? a : b), checked[0]);
    needsAnimation = mostRecent && mostRecent.name !== itemName;
  }

  // FLIP step 1: snapshot current positions
  const oldPositions = new Map();
  if (needsAnimation) {
    const section = listContainer.querySelector(`[data-cat-index="${catIndex}"]`);
    if (section) {
      section.querySelectorAll('.item-row[data-item-name]').forEach(row => {
        oldPositions.set(row.dataset.itemName, row.getBoundingClientRect());
      });
    }
  }

  // Update data model
  cat.items.splice(itemIdx, 1);

  if (isChecking) {
    item.checked = true;
    item.checkedAt = Date.now();
    const firstCheckedIdx = cat.items.findIndex(i => i.checked);
    if (firstCheckedIdx === -1) {
      cat.items.push(item);
    } else {
      cat.items.splice(firstCheckedIdx, 0, item);
    }
  } else {
    item.checked = false;
    delete item.checkedAt;
    const firstCheckedIdx = cat.items.findIndex(i => i.checked);
    if (firstCheckedIdx === -1) {
      cat.items.push(item);
    } else {
      cat.items.splice(firstCheckedIdx, 0, item);
    }
  }

  saveList(currentList);
  renderList();

  // FLIP step 2: animate from old positions to new
  if (needsAnimation && oldPositions.size > 0) {
    const section = listContainer.querySelector(`[data-cat-index="${catIndex}"]`);
    if (!section) return;

    const duration = isChecking ? CHECK_ANIM_MS : UNCHECK_ANIM_MS;
    const toggledRow = section.querySelector(`.item-row[data-item-name="${CSS.escape(itemName)}"]`);
    section.querySelectorAll('.item-row[data-item-name]').forEach(row => {
      const oldRect = oldPositions.get(row.dataset.itemName);
      if (!oldRect) return;
      const newRect = row.getBoundingClientRect();
      const deltaY = oldRect.top - newRect.top;
      if (Math.abs(deltaY) < 1) return;

      if (row === toggledRow) row.style.zIndex = '10';
      row.style.transform = `translateY(${deltaY}px)`;
      row.offsetHeight; // force reflow
      row.style.transition = `transform ${duration}ms ease-out`;
      row.style.transform = '';
      row.addEventListener('transitionend', () => {
        row.style.transition = '';
        row.style.zIndex = '';
      }, { once: true });
    });
  }
}

// ---------- Delete item / category ----------

function deleteItem(catIndex, itemName) {
  const cat = currentList.categories[catIndex];
  cat.items = cat.items.filter(i => i.name !== itemName);
  saveList(currentList);
  renderList();
}

function deleteCategory(catIndex) {
  currentList.categories.splice(catIndex, 1);
  saveList(currentList);
  renderList();
}

// ---------- Add item ----------

function showCategoryModal(itemName) {
  pendingItemName = itemName;
  modalCategories.innerHTML = '';

  currentList.categories.forEach((cat, idx) => {
    const div = document.createElement('div');
    div.className = 'modal-category-option';
    div.textContent = cat.name;
    div.addEventListener('click', () => {
      addItemToCategory(idx, pendingItemName);
      hideCategoryModal();
    });
    modalCategories.appendChild(div);
  });

  newCategoryInput.value = '';
  categoryModal.classList.remove('hidden');
  // Focus the first option or input after a tick
  setTimeout(() => newCategoryInput.focus(), 100);
}

function hideCategoryModal() {
  categoryModal.classList.add('hidden');
  pendingItemName = null;
  addInput.value = '';
  addInput.blur();
  hideAutocomplete();
}

function addItemToCategory(catIndex, itemName) {
  const cat = currentList.categories[catIndex];
  const newItem = { name: itemName, checked: false };
  // Insert at top of unchecked items
  cat.items.unshift(newItem);
  if (cat.collapsed === 'collapsed') {
    cat.collapsed = 'expanded';
  }
  saveList(currentList);
  renderList();
}

function addItemToNewCategory(categoryName, itemName) {
  const newCat = {
    name: categoryName,
    collapsed: 'expanded',
    items: [{ name: itemName, checked: false }],
  };
  currentList.categories.push(newCat);
  saveList(currentList);
  renderList();
}

// Bring back an existing item (uncheck + move to top)
function reactivateItem(itemName) {
  for (const cat of currentList.categories) {
    const idx = cat.items.findIndex(i => i.name.toLowerCase() === itemName.toLowerCase());
    if (idx !== -1) {
      const item = cat.items.splice(idx, 1)[0];
      item.checked = false;
      delete item.checkedAt;
      cat.items.unshift(item);
      if (cat.collapsed === 'collapsed') {
        cat.collapsed = 'expanded';
      }
      saveList(currentList);
      renderList();
      return true;
    }
  }
  return false;
}

// ---------- Autocomplete ----------

function getAllItems() {
  if (!currentList) return [];
  const items = [];
  currentList.categories.forEach((cat, catIdx) => {
    cat.items.forEach(item => {
      items.push({ name: item.name, category: cat.name, checked: item.checked, catIndex: catIdx });
    });
  });
  return items;
}

function findExactItem(name) {
  const lower = name.toLowerCase();
  return getAllItems().find(i => i.name.toLowerCase() === lower);
}

function showAutocomplete(query) {
  if (!query.trim()) {
    hideAutocomplete();
    return;
  }

  const lower = query.toLowerCase();
  const all = getAllItems();
  const matches = all.filter(i => i.name.toLowerCase().includes(lower));

  if (matches.length === 0) {
    hideAutocomplete();
    return;
  }

  autocompleteList.innerHTML = '';
  matches.slice(0, 10).forEach(match => {
    const div = document.createElement('div');
    div.className = 'autocomplete-item';

    const nameSpan = document.createElement('span');
    nameSpan.className = match.checked ? 'ac-checked' : '';
    // Highlight matching portion
    const idx = match.name.toLowerCase().indexOf(lower);
    if (idx >= 0) {
      nameSpan.innerHTML =
        escapeHtml(match.name.substring(0, idx)) +
        '<span class="ac-match">' + escapeHtml(match.name.substring(idx, idx + query.length)) + '</span>' +
        escapeHtml(match.name.substring(idx + query.length));
    } else {
      nameSpan.textContent = match.name;
    }

    const catSpan = document.createElement('span');
    catSpan.className = 'ac-category';
    catSpan.textContent = match.category;

    div.appendChild(nameSpan);
    div.appendChild(catSpan);

    div.addEventListener('click', () => {
      reactivateItem(match.name);
      addInput.value = '';
      addInput.blur();
      hideAutocomplete();
    });

    autocompleteList.appendChild(div);
  });

  autocompleteList.classList.remove('hidden');
}

function hideAutocomplete() {
  autocompleteList.classList.add('hidden');
  autocompleteList.innerHTML = '';
}

// ---------- Inline editing ----------

function startInlineEdit(li, catIndex, oldName) {
  const textSpan = li.querySelector('.item-text');
  if (!textSpan) return;

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'item-edit-input';
  input.value = oldName;

  textSpan.replaceWith(input);
  input.focus();
  input.select();

  const finish = (save) => {
    if (input._finished) return;
    input._finished = true;

    const newName = input.value.trim();

    if (!save || !newName || newName === oldName) {
      // Cancel edit
      saveList(currentList);
      renderList();
      return;
    }

    // Check uniqueness
    const existing = findExactItem(newName);
    if (existing && existing.name.toLowerCase() !== oldName.toLowerCase()) {
      // Show error briefly then revert
      const error = document.createElement('div');
      error.className = 'item-edit-error';
      error.textContent = 'An item with that name already exists';
      li.appendChild(error);
      setTimeout(() => {
        renderList();
      }, 1500);
      return;
    }

    // Apply rename
    const cat = currentList.categories[catIndex];
    const item = cat.items.find(i => i.name === oldName);
    if (item) {
      item.name = newName;
      saveList(currentList);
    }
    renderList();
  };

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); finish(true); }
    if (e.key === 'Escape') { finish(false); }
  });

  input.addEventListener('blur', () => finish(true));
}

// ---------- Swipe-to-delete ----------

function setupSwipe(element, onDelete) {
  let startX = 0;
  let startY = 0;
  let currentX = 0;
  let swiping = false;

  element.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    startX = touch.clientX;
    startY = touch.clientY;
    currentX = 0;
    swiping = false;
  }, { passive: true });

  element.addEventListener('touchmove', (e) => {
    const touch = e.touches[0];
    const dx = touch.clientX - startX;
    const dy = touch.clientY - startY;

    // Only allow left swipe
    if (dx > 0) return;

    // If more vertical than horizontal, ignore
    if (Math.abs(dy) > Math.abs(dx) && !swiping) return;

    if (Math.abs(dx) > 10) {
      swiping = true;
      e.preventDefault();
    }

    if (swiping) {
      currentX = dx;
      element.style.transform = `translateX(${Math.max(dx, -150)}px)`;
      if (Math.abs(dx) > SWIPE_THRESHOLD) {
        element.classList.add('swiping');
      } else {
        element.classList.remove('swiping');
      }
    }
  }, { passive: false });

  element.addEventListener('touchend', () => {
    if (swiping && Math.abs(currentX) > SWIPE_THRESHOLD) {
      element.style.transform = `translateX(-100%)`;
      element.style.opacity = '0';
      setTimeout(() => onDelete(), 150);
    } else {
      element.style.transform = '';
      element.classList.remove('swiping');
    }
    swiping = false;
  }, { passive: true });
}

// ---------- Category drag-and-drop ----------

function setupDragAndDrop() {
  let dragIndex = null;
  let dragEl = null;
  let placeholder = null;
  let startY = 0;
  let longPressTimer = null;

  listContainer.addEventListener('touchstart', (e) => {
    const handle = e.target.closest('.drag-handle');
    if (!handle) return;

    const section = handle.closest('.category-section');
    if (!section) return;

    dragIndex = parseInt(section.dataset.catIndex);
    startY = e.touches[0].clientY;

    longPressTimer = setTimeout(() => {
      dragEl = section;
      dragEl.classList.add('dragging');
      placeholder = document.createElement('div');
      placeholder.className = 'category-drop-indicator';
      section.parentNode.insertBefore(placeholder, section.nextSibling);
    }, 300);
  }, { passive: true });

  listContainer.addEventListener('touchmove', (e) => {
    if (longPressTimer && !dragEl) {
      const dy = Math.abs(e.touches[0].clientY - startY);
      if (dy > 10) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }
      return;
    }

    if (!dragEl) return;
    e.preventDefault();

    const touchY = e.touches[0].clientY;
    const sections = [...listContainer.querySelectorAll('.category-section')];

    for (const sec of sections) {
      if (sec === dragEl) continue;
      const rect = sec.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;

      if (touchY < midY) {
        sec.parentNode.insertBefore(placeholder, sec);
        break;
      } else if (sec === sections[sections.length - 1]) {
        sec.parentNode.insertBefore(placeholder, sec.nextSibling);
      }
    }
  }, { passive: false });

  listContainer.addEventListener('touchend', () => {
    clearTimeout(longPressTimer);
    longPressTimer = null;

    if (!dragEl || !placeholder) {
      dragEl = null;
      return;
    }

    dragEl.classList.remove('dragging');

    // Determine new order from placeholder position
    const sections = [...listContainer.querySelectorAll('.category-section')];
    const placeholderIdx = [...listContainer.children].indexOf(placeholder);
    let newIndex = 0;
    let counted = 0;
    for (const child of listContainer.children) {
      if (child === placeholder) { newIndex = counted; break; }
      if (child.classList.contains('category-section')) counted++;
    }

    if (newIndex > dragIndex) newIndex--;

    // Reorder
    const [moved] = currentList.categories.splice(dragIndex, 1);
    currentList.categories.splice(newIndex, 0, moved);
    saveList(currentList);

    placeholder.remove();
    dragEl = null;
    placeholder = null;
    dragIndex = null;
    renderList();
  }, { passive: true });
}

// ---------- Multi-list support ----------

let editingListName = null;

function openMenu() {
  renderMenuList();
  menuDrawer.classList.remove('hidden');
  menuOverlay.classList.remove('hidden');
}

function closeMenu() {
  menuDrawer.classList.add('hidden');
  menuOverlay.classList.add('hidden');
}

function renderMenuList() {
  const meta = getMeta();
  menuListItems.innerHTML = '';

  meta.lists.forEach(entry => {
    const li = document.createElement('li');
    li.className = 'menu-list-entry' + (currentList && currentList.name === entry.name ? ' active' : '');

    const dot = document.createElement('span');
    dot.className = 'menu-list-color';
    dot.style.background = entry.color;

    const name = document.createElement('span');
    name.className = 'menu-list-name';
    name.textContent = entry.name;

    const actions = document.createElement('span');
    actions.className = 'menu-list-actions';

    const renameBtn = document.createElement('button');
    renameBtn.className = 'menu-list-action-btn';
    renameBtn.textContent = '✎';
    renameBtn.title = 'Rename';
    renameBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openListModal('rename', entry.name, entry.color);
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'menu-list-action-btn';
    deleteBtn.textContent = '✕';
    deleteBtn.title = 'Delete';
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteList(entry.name);
    });

    actions.appendChild(renameBtn);
    actions.appendChild(deleteBtn);

    li.appendChild(dot);
    li.appendChild(name);
    li.appendChild(actions);

    li.addEventListener('click', () => {
      loadList(entry.name);
      closeMenu();
    });

    menuListItems.appendChild(li);
  });
}

function deleteList(name) {
  const meta = getMeta();
  if (meta.lists.length <= 1) return; // don't delete the last list

  meta.lists = meta.lists.filter(l => l.name !== name);
  deleteListStorage(name);

  if (meta.lastList === name) {
    meta.lastList = meta.lists[0].name;
  }
  saveMeta(meta);

  if (currentList && currentList.name === name) {
    loadList(meta.lastList);
  }
  renderMenuList();
}

let selectedColor = DEFAULT_COLOR;

function openListModal(mode, existingName, existingColor) {
  editingListName = mode === 'rename' ? existingName : null;
  newListModalTitle.textContent = mode === 'rename' ? 'Rename List' : 'New List';
  newListSave.textContent = mode === 'rename' ? 'Save' : 'Create';
  newListName.value = mode === 'rename' ? existingName : '';
  selectedColor = existingColor || DEFAULT_COLOR;

  renderColorPicker();
  newListModal.classList.remove('hidden');
  setTimeout(() => newListName.focus(), 100);
}

function renderColorPicker() {
  colorPicker.innerHTML = '';
  COLORS.forEach(c => {
    const swatch = document.createElement('div');
    swatch.className = 'color-swatch' + (selectedColor === c.hex ? ' selected' : '');
    swatch.style.background = c.hex;
    swatch.addEventListener('click', () => {
      selectedColor = c.hex;
      renderColorPicker();
    });
    colorPicker.appendChild(swatch);
  });
}

function saveNewOrRenamedList() {
  const name = newListName.value.trim();
  if (!name) return;

  const meta = getMeta();

  if (editingListName) {
    // Rename
    const entry = meta.lists.find(l => l.name === editingListName);
    if (!entry) return;

    if (name !== editingListName) {
      // Check for duplicate name
      if (meta.lists.some(l => l.name === name)) return;
      renameListStorage(editingListName, name);
      entry.name = name;
      if (meta.lastList === editingListName) meta.lastList = name;
    }
    entry.color = selectedColor;
    saveMeta(meta);
    loadList(name);
  } else {
    // New list
    if (meta.lists.some(l => l.name === name)) return;
    const newList = { name, color: selectedColor, categories: [] };
    saveList(newList);
    meta.lists.push({ name, color: selectedColor });
    meta.lastList = name;
    saveMeta(meta);
    loadList(name);
  }

  newListModal.classList.add('hidden');
  renderMenuList();
}

// ---------- Event listeners ----------

function setupEventListeners() {
  // Filter button
  filterBtn.addEventListener('click', toggleFilter);
  // Add item input
  addInput.addEventListener('input', () => {
    showAutocomplete(addInput.value);
  });

  addInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const text = addInput.value.trim();
      if (!text) return;

      // Check if it matches an existing item
      const exact = findExactItem(text);
      if (exact) {
        reactivateItem(exact.name);
        addInput.value = '';
        addInput.blur();
        hideAutocomplete();
      } else {
        // Show category selection modal
        hideAutocomplete();
        showCategoryModal(text);
      }
    }
  });

  // Dismiss keyboard on tap outside input
  document.addEventListener('touchstart', (e) => {
    if (!e.target.closest('#input-bar') && !e.target.closest('#autocomplete-list')) {
      addInput.blur();
      hideAutocomplete();
    }
  }, { passive: true });

  // Category modal
  modalCancel.addEventListener('click', hideCategoryModal);
  categoryModal.addEventListener('click', (e) => {
    if (e.target === categoryModal) hideCategoryModal();
  });

  newCategoryBtn.addEventListener('click', () => {
    const catName = newCategoryInput.value.trim();
    if (!catName || !pendingItemName) return;
    addItemToNewCategory(catName, pendingItemName);
    hideCategoryModal();
  });

  newCategoryInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      newCategoryBtn.click();
    }
  });

  // Menu
  menuBtn.addEventListener('click', openMenu);
  menuClose.addEventListener('click', closeMenu);
  menuOverlay.addEventListener('click', closeMenu);

  // New list
  menuNewList.addEventListener('click', () => {
    openListModal('new');
  });

  newListCancel.addEventListener('click', () => {
    newListModal.classList.add('hidden');
  });

  newListModal.addEventListener('click', (e) => {
    if (e.target === newListModal) newListModal.classList.add('hidden');
  });

  newListSave.addEventListener('click', saveNewOrRenamedList);

  newListName.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveNewOrRenamedList();
    }
  });

  // Drag and drop
  setupDragAndDrop();
}

// ---------- Utility ----------

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ---------- Start ----------

init();
