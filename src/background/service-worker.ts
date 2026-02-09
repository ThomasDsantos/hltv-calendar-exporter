// Background service worker for HLTV Calendar Exporter
// Handles extension events and cross-script communication

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('HLTV Calendar Exporter installed');

    // Set default settings
    chrome.storage.sync.set({
      defaultProvider: 'unset',
      outlookVariant: 'live', // 'live' or 'office'
    });
  }
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'getSettings') {
    chrome.storage.sync.get(['defaultProvider', 'outlookVariant'], (result) => {
      sendResponse(result);
    });
    return true; // Keep channel open for async response
  }

  if (message.type === 'openUrl') {
    chrome.tabs.create({ url: message.url });
    sendResponse({ success: true });
  }
});
