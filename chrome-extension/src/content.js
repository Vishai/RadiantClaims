/**
 * Content script — injected on reca.justice.gov
 *
 * Reads the DOJ portal form fields and shows a helper overlay
 * with the user's RadiantClaims answers + document guidance.
 */

(() => {
  "use strict";

  let rcData = null;
  let panelEl = null;
  let isMinimized = false;

  // =========================================================================
  // Field mapping: DOJ form field identifiers → RC data paths
  // =========================================================================

  // For text/input fields found via shadow DOM traversal
  const FIELD_MAP = {
    First_Name: (d) =>
      d.answers?.part_1?.firstName || d.answers?.part_2?.firstName,
    Middle_Name: (d) =>
      d.answers?.part_1?.middleName || d.answers?.part_2?.middleName,
    Last_Name: (d) =>
      d.answers?.part_1?.lastName || d.answers?.part_2?.lastName,
    RECA_Place_of_Birth__c: (d) => {
      // placeOfBirth is on the CertificationOfIdentity supporting form
      const sf = d.answers?.supportingForms?.certificationOfIdentity;
      return sf?.placeOfBirth || "";
    },
  };

  // For radio buttons identified by name prefix
  const RADIO_MAP = {
    ClaimantTypeChoices: (d) => {
      const ct = d.answers?.claimType;
      if (ct === "downwinder") return "Downwind";
      if (ct === "onsite") return "Onsite";
      if (ct === "uranium") return "Uranium";
      if (ct === "manhattan") return "Manhattan";
      return null;
    },
    RelationshipTypePrimary: (d) => {
      const rel = d.answers?.part_3?.relationship;
      return rel === "SELF" ? "Self" : rel === "SURVIVOR" ? "Survivor" : null;
    },
    AttorneyOtherSelf: (d) => {
      return d.answers?.part_13?.hasAttorney === "YES" ? "Yes" : "No";
    },
    CourtAppointedOtherSelf: (d) => {
      return d.answers?.part_15
        ? "GuardianOtherSelf"
        : "NoCourtAppointedOtherSelf";
    },
  };

  // Address fields (identified by context)
  const ADDRESS_MAP = {
    street: (d) => d.answers?.part_1?.mailingAddress,
    city: (d) => d.answers?.part_1?.city,
    province: (d) => d.answers?.part_1?.state,
    postalCode: (d) => d.answers?.part_1?.zipCode,
  };

  // DOJ portal tab → document category mapping
  const TAB_DOC_MAP = {
    "Identification Documentation": [
      "IDENTITY",
      "BIRTH_CERTIFICATE",
      "MARRIAGE_CERTIFICATE",
    ],
    Exposure: [],
    "Proof of Presence": [
      "UTILITY_BILL",
      "SCHOOL_RECORDS",
      "EMPLOYMENT_RECORDS",
      "TAX_RETURN",
      "LDS_CHURCH_RECORDS",
      "PROOF_OF_RESIDENCE",
      "CHURCH_RECORDS",
      "MORTGAGE_STATEMENT",
      "PROPERTY_RECORDS",
      "VOTING_RECORDS",
      "CENSUS_RECORDS",
    ],
    "Compensable and Proof of Disease": [
      "PATHOLOGY_REPORT",
      "MEDICAL_RECORDS",
      "DISCHARGE_SUMMARY",
      "TREATMENT_RECORDS",
      "DEATH_CERTIFICATE",
    ],
    "Prior Compensation": [],
  };

  // =========================================================================
  // Shadow DOM traversal helpers
  // =========================================================================

  function findInputs(root) {
    const results = [];
    root.querySelectorAll("input, textarea, select").forEach((el) => {
      if (el.type !== "hidden") results.push(el);
    });
    root.querySelectorAll("*").forEach((el) => {
      if (el.shadowRoot) results.push(...findInputs(el.shadowRoot));
    });
    return results;
  }

  function findRadios(root) {
    const results = [];
    root.querySelectorAll('input[type="radio"]').forEach((el) => {
      results.push(el);
    });
    root.querySelectorAll("*").forEach((el) => {
      if (el.shadowRoot) results.push(...findRadios(el.shadowRoot));
    });
    return results;
  }

  // =========================================================================
  // Get current active DOJ tab name
  // =========================================================================

  function getActiveTab() {
    const selected = document.querySelector(
      '[role="tab"][aria-selected="true"]'
    );
    return selected?.textContent?.trim() || null;
  }

  // =========================================================================
  // Fill a field
  // =========================================================================

  function fillField(input, value) {
    if (!value) return;
    const nativeInputValueSetter =
      Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value"
      )?.set ||
      Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype,
        "value"
      )?.set;

    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(input, value);
    } else {
      input.value = value;
    }
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
    input.dispatchEvent(new Event("blur", { bubbles: true }));
  }

  function clickRadio(radio) {
    radio.click();
    radio.dispatchEvent(new Event("change", { bubbles: true }));
  }

  // =========================================================================
  // Helper Panel UI
  // =========================================================================

  function createPanel() {
    if (panelEl) panelEl.remove();

    panelEl = document.createElement("div");
    panelEl.id = "rc-helper-panel";
    panelEl.innerHTML = `
      <div class="rc-panel-header">
        <span class="rc-panel-title">⚡ RadiantClaims Helper</span>
        <div class="rc-panel-actions">
          <button class="rc-btn-minimize" title="Minimize">−</button>
          <button class="rc-btn-close" title="Close">×</button>
        </div>
      </div>
      <div class="rc-panel-body">
        <div class="rc-panel-status">Loading...</div>
        <div class="rc-panel-fields"></div>
        <div class="rc-panel-docs"></div>
        <div class="rc-panel-footer">
          <button class="rc-btn rc-btn-fill-all">Fill All Fields</button>
        </div>
      </div>
    `;

    document.body.appendChild(panelEl);

    // Event handlers
    panelEl
      .querySelector(".rc-btn-minimize")
      .addEventListener("click", toggleMinimize);
    panelEl.querySelector(".rc-btn-close").addEventListener("click", () => {
      panelEl.remove();
      panelEl = null;
    });
    panelEl
      .querySelector(".rc-btn-fill-all")
      .addEventListener("click", fillAllFields);

    updatePanel();
  }

  function toggleMinimize() {
    isMinimized = !isMinimized;
    const body = panelEl.querySelector(".rc-panel-body");
    body.style.display = isMinimized ? "none" : "block";
    panelEl.querySelector(".rc-btn-minimize").textContent = isMinimized
      ? "+"
      : "−";
  }

  // =========================================================================
  // Scan page and build field assist list
  // =========================================================================

  function scanFields() {
    if (!rcData) return [];

    const assists = [];
    const inputs = findInputs(document);

    for (const input of inputs) {
      const name = input.name || "";

      // Check direct field map
      for (const [key, getter] of Object.entries(FIELD_MAP)) {
        if (name === key || name.includes(key)) {
          const value = getter(rcData);
          if (value) {
            assists.push({
              label: key.replace(/_/g, " ").replace(/__c$/, ""),
              value,
              input,
              type: "text",
            });
          }
        }
      }

      // Check address fields
      for (const [key, getter] of Object.entries(ADDRESS_MAP)) {
        if (name === key) {
          const value = getter(rcData);
          if (value) {
            assists.push({
              label: key.charAt(0).toUpperCase() + key.slice(1),
              value,
              input,
              type: "text",
            });
          }
        }
      }
    }

    // SSN field (identified by placeholder)
    const ssnInput = inputs.find((i) => i.placeholder === "###-##-####");
    if (ssnInput) {
      const ssn = rcData.answers?.part_1?.ssn || rcData.answers?.part_2?.ssn;
      if (ssn) {
        const formatted = ssn
          .replace(/\D/g, "")
          .replace(/(\d{3})(\d{2})(\d{4})/, "$1-$2-$3");
        assists.push({
          label: "SSN",
          value: formatted,
          input: ssnInput,
          type: "text",
        });
      }
    }

    // DOB field (identified by aria-label or nearby label)
    const dobInput = inputs.find(
      (i) =>
        i.getAttribute("aria-label")?.includes("Date Of Birth") ||
        i.name === "input1"
    );
    if (dobInput) {
      const dob = rcData.answers?.part_1?.dob || rcData.answers?.part_2?.dob;
      if (dob) {
        const d = new Date(dob);
        const formatted = `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}/${d.getFullYear()}`;
        assists.push({
          label: "Date of Birth",
          value: formatted,
          input: dobInput,
          type: "text",
        });
      }
    }

    // Email field
    const emailInput = inputs.find((i) => i.placeholder === "you@example.com");
    if (emailInput) {
      const email = rcData.answers?.part_1?.email;
      if (email) {
        assists.push({
          label: "Email",
          value: email,
          input: emailInput,
          type: "text",
        });
      }
    }

    return assists;
  }

  function getMatchingDocs() {
    if (!rcData?.documents) return [];
    const tab = getActiveTab();
    if (!tab || !TAB_DOC_MAP[tab]) return [];

    const categories = TAB_DOC_MAP[tab];
    return rcData.documents.filter((doc) => categories.includes(doc.category));
  }

  // =========================================================================
  // Update panel content
  // =========================================================================

  function updatePanel() {
    if (!panelEl || !rcData) return;

    const assists = scanFields();
    const docs = getMatchingDocs();
    const tab = getActiveTab() || "Unknown";

    const statusEl = panelEl.querySelector(".rc-panel-status");
    statusEl.textContent = `Tab: ${tab} • ${assists.length} fields found`;

    // Render field assists
    const fieldsEl = panelEl.querySelector(".rc-panel-fields");
    if (assists.length === 0) {
      fieldsEl.innerHTML = `<div class="rc-empty">No matching fields on this tab</div>`;
    } else {
      fieldsEl.innerHTML = assists
        .map(
          (a, i) => `
        <div class="rc-field-row">
          <div class="rc-field-label">${a.label}</div>
          <div class="rc-field-value">${a.value}</div>
          <button class="rc-btn-fill" data-idx="${i}" title="Fill this field">→</button>
        </div>`
        )
        .join("");

      fieldsEl.querySelectorAll(".rc-btn-fill").forEach((btn) => {
        btn.addEventListener("click", () => {
          const idx = parseInt(btn.dataset.idx);
          const assist = assists[idx];
          if (assist) {
            fillField(assist.input, assist.value);
            btn.textContent = "✓";
            btn.style.background = "#4caf50";
            setTimeout(() => {
              btn.textContent = "→";
              btn.style.background = "";
            }, 1500);
          }
        });
      });
    }

    // Render document section
    const docsEl = panelEl.querySelector(".rc-panel-docs");
    if (docs.length === 0) {
      docsEl.innerHTML = "";
    } else {
      docsEl.innerHTML = `
        <div class="rc-docs-header">📎 Upload these documents here (${docs.length})</div>
        ${docs
          .map(
            (doc) => `
          <div class="rc-doc-row">
            <span class="rc-doc-name">${doc.filename}</span>
            ${doc.downloadUrl ? `<a class="rc-doc-download" href="${doc.downloadUrl}" target="_blank">↓</a>` : ""}
          </div>`
          )
          .join("")}
      `;
    }
  }

  // =========================================================================
  // Fill all fields at once
  // =========================================================================

  function fillAllFields() {
    const assists = scanFields();
    let filled = 0;
    for (const assist of assists) {
      if (assist.type === "text" && assist.value) {
        fillField(assist.input, assist.value);
        filled++;
      }
    }

    const statusEl = panelEl?.querySelector(".rc-panel-status");
    if (statusEl) {
      statusEl.textContent = `✓ Filled ${filled} fields`;
      setTimeout(updatePanel, 2000);
    }
  }

  // =========================================================================
  // Message handling
  // =========================================================================

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === "RC_DATA_LOADED") {
      rcData = msg.data;
      createPanel();
    } else if (msg.type === "RC_DATA_CLEARED") {
      rcData = null;
      if (panelEl) {
        panelEl.remove();
        panelEl = null;
      }
    }
  });

  // =========================================================================
  // Auto-load on page ready
  // =========================================================================

  async function init() {
    const { rcData: stored } = await chrome.storage.local.get("rcData");
    if (stored) {
      rcData = stored;
      // Wait for Salesforce to finish rendering
      setTimeout(createPanel, 1500);
    }
  }

  // Re-scan when tabs change (Salesforce Lightning navigation)
  const observer = new MutationObserver(() => {
    if (panelEl && rcData) {
      clearTimeout(observer._debounce);
      observer._debounce = setTimeout(updatePanel, 500);
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  init();
})();
