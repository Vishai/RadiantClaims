/**
 * Popup script — manages data import (API connect + JSON paste fallback) and status display.
 */

const stateImport = document.getElementById("state-import");
const stateLoaded = document.getElementById("state-loaded");
const claimantName = document.getElementById("claimant-name");
const claimantMeta = document.getElementById("claimant-meta");
const statFields = document.getElementById("stat-fields");
const statDocs = document.getElementById("stat-docs");
const docList = document.getElementById("doc-list");
const portalStatus = document.getElementById("portal-status");
const btnClear = document.getElementById("btn-clear");

// Connect flow elements
const rcUrlInput = document.getElementById("rc-url");
const claimSelect = document.getElementById("claim-select");
const btnConnect = document.getElementById("btn-connect");
const connectError = document.getElementById("connect-error");

// Advanced (paste JSON) elements
const toggleAdvanced = document.getElementById("toggle-advanced");
const advancedSection = document.getElementById("advanced-section");
const dataInput = document.getElementById("data-input");
const btnImport = document.getElementById("btn-import");
const importError = document.getElementById("import-error");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getBaseUrl() {
  return (rcUrlInput?.value || "https://www.radiantclaims.com").replace(
    /\/$/,
    ""
  );
}

function showState(state) {
  stateImport.classList.toggle("active", state === "import");
  stateLoaded.classList.toggle("active", state === "loaded");
}

function showConnectError(msg) {
  connectError.textContent = "";
  connectError.innerHTML = msg;
  connectError.style.display = "block";
}

function hideConnectError() {
  connectError.style.display = "none";
}

function setConnectLoading(loading) {
  btnConnect.disabled = loading;
  btnConnect.innerHTML = loading
    ? '<span class="spinner"></span>Connecting...'
    : "Connect &amp; Load Data";
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
// Validate & parse data blob (for paste fallback)
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
// Connect to RadiantClaims API
// ---------------------------------------------------------------------------

let fetchedClaims = null;

async function connectToRC() {
  hideConnectError();
  setConnectLoading(true);

  const baseUrl = getBaseUrl();

  try {
    // If we already fetched claims and user selected one, load it
    if (fetchedClaims && claimSelect.value) {
      await loadClaimData(baseUrl, claimSelect.value);
      return;
    }

    // Step 1: Fetch user's claims
    const claimsRes = await fetch(`${baseUrl}/api/portal/claims`, {
      credentials: "include",
    });

    if (claimsRes.status === 401) {
      showConnectError(
        'Please <a class="login-link" id="login-link" href="#">log in to RadiantClaims</a> first, then try again.'
      );
      // Add click handler to open login page
      setTimeout(() => {
        const loginLink = document.getElementById("login-link");
        if (loginLink) {
          loginLink.addEventListener("click", (e) => {
            e.preventDefault();
            chrome.tabs.create({ url: `${baseUrl}/portal/login` });
          });
        }
      }, 0);
      return;
    }

    if (!claimsRes.ok) {
      throw new Error(`Failed to fetch claims (${claimsRes.status})`);
    }

    const { claims } = await claimsRes.json();

    if (!claims || claims.length === 0) {
      showConnectError("No claims found on your RadiantClaims account.");
      return;
    }

    fetchedClaims = claims;

    if (claims.length === 1) {
      // Single claim — load directly
      await loadClaimData(baseUrl, claims[0].id);
    } else {
      // Multiple claims — show selector
      claimSelect.innerHTML = '<option value="">Select a claim...</option>';
      for (const claim of claims) {
        const opt = document.createElement("option");
        opt.value = claim.id;
        opt.textContent = `${claim.firstName} ${claim.lastName}${claim.claimType ? ` (${claim.claimType})` : ""}`;
        claimSelect.appendChild(opt);
      }
      claimSelect.style.display = "block";
      btnConnect.textContent = "Load Selected Claim";
    }
  } catch (e) {
    showConnectError(e.message);
  } finally {
    setConnectLoading(false);
  }
}

async function loadClaimData(baseUrl, claimId) {
  const res = await fetch(
    `${baseUrl}/api/portal/extension-data?claimId=${encodeURIComponent(claimId)}`,
    { credentials: "include" }
  );

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Failed to load claim data (${res.status})`);
  }

  const data = await res.json();
  await chrome.storage.local.set({ rcData: data });
  displayLoadedData(data);

  // Notify content script on active tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id && tab?.url?.includes("reca.justice.gov")) {
    chrome.tabs.sendMessage(tab.id, { type: "RC_DATA_LOADED", data });
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

  const name =
    data.claimant?.name ||
    (data.answers?.part_1
      ? `${data.answers.part_1.firstName || ""} ${data.answers.part_1.lastName || ""}`.trim()
      : "Unknown Claimant");
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

// Connect button
btnConnect.addEventListener("click", connectToRC);

// Claim selector change — enable loading
claimSelect.addEventListener("change", () => {
  if (claimSelect.value) {
    btnConnect.textContent = "Load Selected Claim";
  }
});

// Advanced toggle
toggleAdvanced.addEventListener("click", (e) => {
  e.preventDefault();
  advancedSection.classList.toggle("visible");
  toggleAdvanced.textContent = advancedSection.classList.contains("visible")
    ? "Hide advanced"
    : "Advanced: paste JSON manually";
});

// JSON paste fallback
dataInput.addEventListener("input", () => {
  btnImport.disabled = !dataInput.value.trim();
  importError.style.display = "none";
});

btnImport.addEventListener("click", async () => {
  try {
    const data = parseDataBlob(dataInput.value.trim());
    await chrome.storage.local.set({ rcData: data });
    displayLoadedData(data);

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

// Clear data
btnClear.addEventListener("click", async () => {
  await chrome.storage.local.remove("rcData");
  fetchedClaims = null;
  claimSelect.style.display = "none";
  claimSelect.innerHTML = '<option value="">Select a claim...</option>';
  if (dataInput) dataInput.value = "";
  showState("import");

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id && tab?.url?.includes("reca.justice.gov")) {
    chrome.tabs.sendMessage(tab.id, { type: "RC_DATA_CLEARED" });
  }
});

// Dev URL toggle — triple-click header to show
document.querySelector(".header").addEventListener("dblclick", () => {
  rcUrlInput.style.display =
    rcUrlInput.style.display === "none" ? "block" : "none";
});

init();
