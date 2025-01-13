console.log("Background script loaded");

chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed");
  chrome.storage.sync.set({ autoConnectEnabled: false });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Message received in background:", request);
  if (request.action === 'toggleAutoConnect') {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, request);
    });
  }
});

