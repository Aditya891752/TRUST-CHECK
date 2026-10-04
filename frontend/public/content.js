// TrustCheck Content Script

// Listen for messages from TrustCheck extension UI
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "TRUSTCHECK_GET_SELECTION") {
    const selected = window.getSelection()?.toString()?.trim() || "";
    sendResponse({ text: selected });
  }
  return true;
});
