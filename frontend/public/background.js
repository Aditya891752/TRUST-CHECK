// TrustCheck Background Service Worker (Manifest V3)

chrome.runtime.onInstalled.addListener(() => {
  // Create context menu item on text selection
  chrome.contextMenus.create({
    id: "trustcheck-verify-selection",
    title: "Verify with TrustCheck",
    contexts: ["selection"]
  });

  // Enable side panel to open on extension action icon click (Chrome 116+)
  if (chrome.sidePanel && typeof chrome.sidePanel.setPanelBehavior === "function") {
    chrome.sidePanel
      .setPanelBehavior({ openPanelOnActionClick: true })
      .catch((err) => {
        console.warn("SidePanel behavior note:", err);
      });
  }
});

// Handle user clicking the context menu item
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "trustcheck-verify-selection" && info.selectionText) {
    const selectedText = info.selectionText.trim();
    if (!selectedText) return;

    // Save selection in chrome.storage.local
    await chrome.storage.local.set({
      trustcheck_pending_text: selectedText,
      trustcheck_timestamp: Date.now()
    });

    // Notify any active popup/sidepanel
    chrome.runtime.sendMessage({
      type: "TRUSTCHECK_NEW_SELECTION",
      text: selectedText
    }).catch(() => {
      // Ignored if side panel / popup isn't open yet
    });

    // Open the side panel for the active tab if supported
    if (chrome.sidePanel && tab && tab.id) {
      try {
        await chrome.sidePanel.open({ tabId: tab.id });
      } catch (err) {
        console.warn("Could not open sidePanel:", err);
      }
    }
  }
});
