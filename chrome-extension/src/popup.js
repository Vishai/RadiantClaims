/**
 * Popup script — manages data import and status display.
 */

const stateImport = document.getElementById("state-import");
const stateLoaded = document.getElementById("state-loaded");
const dataInput = document.getElementById("data-input");
const btnImport = document.getElementById("btn-import");
const importError = document.getElementById("import-error");
const claimantName = document.getElementById("claimant-name");
const claimantMeta = document.getElementById("claimant-meta");
const statFields = document.getElementById("stat-fields");
const statDocs = document.getElementById("stat-docs");
const docList = document.getElementById("doc-list");
const portalStatus = document.getElementById("portal-status");
const btnClear = document.getElementById("btn-clear");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function showState(state) {
  stateImport.classList.toggle("active", state === "import");
  stateLoaded.classList.toggle("active", state === "loaded");
}

function countFields(answers) {
  if (!answers) return 0;
  let count = 0;
  for (const section of Object.values(answers)) {
    if (Array.isArray(section)) {
      count += section.length;
    } else if (typeof section === "object" && section !== null) {
      for (const val of Object.values(section)) {
        if (val !== null && val !== undefined && val !== "") count++;
      }
    }
  }
  return count;
}

function renderDocuments(documents) {
  if (!documents || documents.length === 0) {
    docList.innerHTML = "";
    return;
  }

  // Group by DOJ tab
  const groups = {};
  for (const doc of documents) {
    const tab = doc.dojTab || "Other";
    if (!groups[tab]) groups[tab] = [];
    groups[tab].push(doc);
  }

  let html = "";
  for (const [tab, docs] of Object.entries(groups)) {
    html += `<div class="doc-section">`;
    html += `<div class="doc-section-header">
      <span>${tab}</span>
      <span style="font-size:10px; color:#888;">${docs.length} file${docs.length > 1 ? "s" : ""}</span>
    </div>`;
    for (const doc of docs) {
      html += `<div class="doc-item">
        <span class="doc-name" title="${doc.filename}">${doc.filename}</span>
        ${doc.downloadUrl ? `<button class="download-btn" data-url="${doc.downloadUrl}">Download</button>` : ""}
      </div>`;
    }
    html += `</div>`;
  }

  docList.innerHTML = html;

  // Attach download handlers
  docList.querySelectorAll(".download-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const url = btn.dataset.url;
      if (url) chrome.tabs.create({ url });
    });
  });
}

// ---------------------------------------------------------------------------
// Validate & parse data blob
// ---------------------------------------------------------------------------

function parseDataBlob(raw) {
  try {
    const data = JSON.parse(raw);
    if (!data.answers || typeof data.answers !== "object") {
      throw new Error("Missing 'answers' object in data");
    }
    return data;
  } catch (e) {
    throw new Error(`Invalid data: ${e.message}`);
  }
}

// ---------------------------------------------------------------------------
// Load saved data on popup open
// ---------------------------------------------------------------------------

async function init() {
  const { rcData } = await chrome.storage.local.get("rcData");
  if (rcData) {
    displayLoadedData(rcData);
  } else {
    showState("import");
  }

  // Check if current tab is on the DOJ portal
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.url?.includes("reca.justice.gov")) {
    portalStatus.className = "status-bar on-portal";
    portalStatus.textContent =
      "✓ Connected to DOJ portal — helper overlay active";
  }
}

function displayLoadedData(data) {
  showState("loaded");

  const p1 = data.answers?.part_1;
  const name = p1
    ? `${p1.firstName || ""} ${p1.lastName || ""}`.trim()
    : "Unknown Claimant";
  claimantName.textContent = name;
  claimantMeta.textContent = data.sessionId
    ? `Session: ${data.sessionId.slice(0, 12)}…`
    : "";

  statFields.textContent = countFields(data.answers);
  statDocs.textContent = (data.documents || []).length;

  renderDocuments(data.documents);
}

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------

dataInput.addEventListener("input", () => {
  btnImport.disabled = !dataInput.value.trim();
  importError.style.display = "none";
});

btnImport.addEventListener("click", async () => {
  try {
    const data = parseDataBlob(dataInput.value.trim());
    await chrome.storage.local.set({ rcData: data });
    displayLoadedData(data);

    // Notify content script on active tab
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (tab?.id && tab?.url?.includes("reca.justice.gov")) {
      chrome.tabs.sendMessage(tab.id, { type: "RC_DATA_LOADED", data });
    }
  } catch (e) {
    importError.textContent = e.message;
    importError.style.display = "block";
  }
});

btnClear.addEventListener("click", async () => {
  await chrome.storage.local.remove("rcData");
  dataInput.value = "";
  showState("import");

  // Notify content script
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id && tab?.url?.includes("reca.justice.gov")) {
    chrome.tabs.sendMessage(tab.id, { type: "RC_DATA_CLEARED" });
  }
});

init();
