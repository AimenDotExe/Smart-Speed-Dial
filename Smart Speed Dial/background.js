// Background script for Speed Dial Chrome Extension
// Author: Aimen Zaied
// Link: https://linktr.ee/AimenZaied

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Speed Dial extension installed successfully!');
    
    // Set default settings on first install
    chrome.storage.sync.set({
      gradient: '0d0d2b,000000',
      fontSize: 100,
      gridColumns: 7,
      useSuggestions: true,
      showSearch: false
    });
  }
  
  // Create context menu items after installation
  try {
    chrome.contextMenus.create({
      id: "openIncognito",
      title: "Open in incognito window",
      contexts: ["link"]
    });
  } catch (error) {
    console.log('Context menu creation failed:', error);
  }
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "openIncognito") {
    chrome.windows.create({
      url: info.linkUrl,
      incognito: true
    });
  }
});

// Handle service worker startup
chrome.runtime.onStartup.addListener(() => {
  console.log('Speed Dial extension started');
});