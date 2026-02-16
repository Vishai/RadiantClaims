/**
 * Background service worker.
 * Relays messages between popup and content scripts.
 */

// When a tab navigates to the DOJ portal, inject data if we have it
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (
    changeInfo.status === "complete" &&
    tab.url?.includes("reca.justice.gov")
  ) {
    const { rcData } = await chrome.storage.local.get("rcData");
    if (rcData) {
      try {
        chrome.tabs.sendMessage(tabId, {
          type: "RC_DATA_LOADED",
          data: rcData,
        });
      } catch {
        // Content script may not be ready yet
      }
    }
  }
});
