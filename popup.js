document.addEventListener('DOMContentLoaded', () => {
  const newCategoryInput = document.getElementById('newCategory');
  const addCategoryButton = document.getElementById('addCategory');
  const categoryList = document.getElementById('categoryList');
  const categoryFilter = document.getElementById('categoryFilter');
  const tabList = document.getElementById('tabList');
  const saveCurrentTabButton = document.getElementById('saveCurrentTab');

  let categories = [];
  let tabs = [];

  // Load categories and tabs
  chrome.storage.local.get(['categories', 'tabs'], (result) => {
    categories = result.categories || [];
    tabs = result.tabs || [];
    updateCategoryList();
    updateTabList();
  });

  // Add new category
  addCategoryButton.addEventListener('click', () => {
    const newCategory = newCategoryInput.value.trim();
    if (newCategory && !categories.includes(newCategory)) {
      categories.push(newCategory);
      chrome.storage.local.set({ categories }, () => {
        updateCategoryList();
        newCategoryInput.value = '';
      });
    }
  });

  // Save current tab
  saveCurrentTabButton.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (currentTabs) => {
      const currentTab = currentTabs[0];
      const newTab = {
        id: Date.now(), // Use timestamp as ID for saved tabs
        title: currentTab.title,
        url: currentTab.url,
        openedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        category: ''
      };
      tabs.push(newTab);
      chrome.storage.local.set({ tabs }, updateTabList);
    });
  });

  // Update category list
  function updateCategoryList() {
    categoryList.innerHTML = '';
    categoryFilter.innerHTML = '<option value="all">All Categories</option>';
    categories.forEach((category) => {
      const li = document.createElement('li');
      li.textContent = category;
      li.className = 'px-2 py-1 bg-gray-200 rounded-md text-sm';
      categoryList.appendChild(li);

      const option = document.createElement('option');
      option.value = category;
      option.textContent = category;
      categoryFilter.appendChild(option);
    });
  }

  // Update tab list
  function updateTabList() {
    const selectedCategory = categoryFilter.value;
    tabList.innerHTML = '';

    const filteredTabs = selectedCategory === 'all'
      ? tabs
      : tabs.filter(tab => tab.category === selectedCategory);

    filteredTabs.sort((a, b) => new Date(b.openedAt) - new Date(a.openedAt));

    filteredTabs.forEach((tab) => {
      const li = document.createElement('li');
      li.className = 'flex items-center justify-between bg-white p-2 rounded-md shadow-sm';
      li.innerHTML = `
        <span class="flex-grow truncate mr-2">${tab.title}</span>
        <select class="categorySelect mr-2 px-2 py-1 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">No Category</option>
          ${categories.map(cat => `<option value="${cat}" ${cat === tab.category ? 'selected' : ''}>${cat}</option>`).join('')}
        </select>
        <button class="deleteTab bg-red-500 text-white px-2 py-1 rounded-md text-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500">Delete</button>
      `;
      
      const select = li.querySelector('.categorySelect');
      select.addEventListener('change', (e) => {
        const updatedCategory = e.target.value;
        tab.category = updatedCategory;
        tab.updatedAt = new Date().toISOString();
        chrome.storage.local.set({ tabs }, updateTabList);
      });

      const deleteButton = li.querySelector('.deleteTab');
      deleteButton.addEventListener('click', () => {
        tabs = tabs.filter(t => t.id !== tab.id);
        chrome.storage.local.set({ tabs }, updateTabList);
      });

      tabList.appendChild(li);
    });
  }

  // Filter tabs by category
  categoryFilter.addEventListener('change', updateTabList);

  // Initial load of open tabs
  chrome.tabs.query({}, (openTabs) => {
    chrome.storage.local.get(['tabs'], (result) => {
      let storedTabs = result.tabs || [];
      
      openTabs.forEach(tab => {
        const existingTab = storedTabs.find(t => t.id === tab.id);
        if (!existingTab) {
          storedTabs.push({
            id: tab.id,
            title: tab.title,
            url: tab.url,
            openedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            category: ''
          });
        }
      });
      
      // Remove tabs that are no longer open
      storedTabs = storedTabs.filter(tab => 
        openTabs.some(t => t.id === tab.id) || typeof tab.id === 'number'
      );
      
      chrome.storage.local.set({ tabs: storedTabs }, updateTabList);
    });
  });
});

