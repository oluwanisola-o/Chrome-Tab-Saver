// Listen for tab creation
chrome.tabs.onCreated.addListener((tab) => {
  updateTab(tab);
});

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    updateTab(tab);
  }
});

// Listen for tab removal
chrome.tabs.onRemoved.addListener((tabId) => {
  chrome.storage.sync.get(['tabs'], (result) => {
    const tabs = result.tabs || [];
    const updatedTabs = tabs.filter(tab => tab.id !== tabId);
    chrome.storage.sync.set({ tabs: updatedTabs });
  });
});

function updateTab(tab) {
  chrome.storage.sync.get(['tabs'], (result) => {
    const tabs = result.tabs || [];
    const existingTabIndex = tabs.findIndex(t => t.id === tab.id);
    
    if (existingTabIndex !== -1) {
      tabs[existingTabIndex] = {
        ...tabs[existingTabIndex],
        title: tab.title,
        url: tab.url
      };
    } else {
      tabs.push({
        id: tab.id,
        title: tab.title,
        url: tab.url,
        openedAt: Date.now(),
        category: ''
      });
    }
    
    chrome.storage.sync.set({ tabs });
  });
}

