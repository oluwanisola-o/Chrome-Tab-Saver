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
  chrome.storage.local.get(['tabs'], (result) => {
    const tabs = result.tabs || [];
    const updatedTabs = tabs.filter(tab => tab.id !== tabId);
    chrome.storage.local.set({ tabs: updatedTabs });
  });
});

function updateTab(tab) {
  chrome.storage.local.get(['tabs'], (result) => {
    const tabs = result.tabs || [];
    const existingTabIndex = tabs.findIndex(t => t.id === tab.id);
    
    if (existingTabIndex !== -1) {
      tabs[existingTabIndex] = {
        ...tabs[existingTabIndex],
        title: tab.title,
        url: tab.url,
        updatedAt: new Date().toISOString()
      };
    } else {
      tabs.push({
        id: tab.id,
        title: tab.title,
        url: tab.url,
        openedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        category: ''
      });
    }
    
    chrome.storage.local.set({ tabs });
  });
}

