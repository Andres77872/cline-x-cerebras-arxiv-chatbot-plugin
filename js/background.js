// Background service worker for the Chrome extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('Cline Chrome Plugin installed');
  // Perform setup tasks here
});

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Message received in background:', message);
  // Handle messages here
});
