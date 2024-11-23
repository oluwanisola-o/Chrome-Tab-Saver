document.addEventListener('DOMContentLoaded', () => {
  const newCategoryInput = document.getElementById('newCategory');
  const addCategoryButton = document.getElementById('addCategory');
  const categoryList = document.getElementById('categoryList');
  const categoryFilter = document.getElementById('categoryFilter');
  const tabList = document.getElementById('tabList');

  let categories = [];
  let tabs = [];

  // Load categories and tabs
  chrome.storage.sync.get(['categories', 'tabs'], (result) => {
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
      chrome.storage.sync.set({ categories }, () => {
        updateCategoryList();
        newCategoryInput.value = '';
      });
    }
  });

  // Update category list
  function updateCategoryList() {
    categoryList.innerHTML = '';
    categoryFilter.innerHTML = '<option value="all">All Categories</option>';
    categories.forEach((category) => {
      const li = document.createElement('li');
      li.textContent = category;
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

    filteredTabs.sort((a, b) => b.openedAt - a.openedAt);

    filteredTabs.forEach((tab) => {
      const li = document.createElement('li');
      li.innerHTML = `
        <span>${tab.title}</span>
        <select class="categorySelect">
          <option value="">No Category</option>
          ${categories.map(cat => `<option value="${cat}" ${cat === tab.category ? 'selected' : ''}>${cat}</option>`).join('')}
        </select>
      `;
      
      const select = li.querySelector('.categorySelect');
      select.addEventListener('change', (e) => {
        const updatedCategory = e.target.value;
        tab.category = updatedCategory;
        chrome.storage.sync.set({ tabs }, () => {
          updateTabList();
        });
      });

      tabList.appendChild(li);
    });
  }

  // Filter tabs by category
  categoryFilter.addEventListener('change', updateTabList);

  // Initial load of open tabs
  chrome.tabs.query({}, (openTabs) => {
    chrome.storage.sync.get(['tabs'], (result) => {
      let storedTabs = result.tabs || [];
      
      openTabs.forEach(tab => {
        const existingTab = storedTabs.find(t => t.id === tab.id);
        if (!existingTab) {
          storedTabs.push({
            id: tab.id,
            title: tab.title,
            url: tab.url,
            openedAt: Date.now(),
            category: ''
          });
        }
      });
      
      // Remove tabs that are no longer open
      storedTabs = storedTabs.filter(tab => openTabs.some(t => t.id === tab.id));
      
      chrome.storage.sync.set({ tabs: storedTabs }, updateTabList);
    });
  });
});

