# RadiantClaims – DOJ Portal Helper (Chrome Extension)

Helps RadiantClaims users transfer their claim data into the DOJ RECA e-filing portal at `reca.justice.gov`.

## What it does

1. **Field assist** — Shows your RadiantClaims answers alongside DOJ portal form fields with one-click fill buttons
2. **Document guidance** — On upload tabs, shows which of your documents should be uploaded there
3. **Fill all** — One button to fill all text fields on the current portal tab

## How to use

1. On your RadiantClaims portal page, click **"Copy Data for Extension"**
2. Open the extension popup and paste the data
3. Navigate to `reca.justice.gov` and start your claim
4. The helper panel appears on the right with your data

## Install (development)

1. Open `chrome://extensions/`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select this `chrome-extension/` directory

## Architecture

- **Manifest V3** — modern Chrome extension format
- **content.js** — Injected on `reca.justice.gov`, traverses Salesforce Lightning shadow DOM to find form fields
- **popup.html/js** — Data import UI
- **background.js** — Relays data to content script on tab navigation
- **Data stays local** — stored in `chrome.storage.local`, never sent to any server

## Privacy

- Extension only activates on `reca.justice.gov`
- No data is transmitted — everything stays in local browser storage
- User explicitly imports their data via copy/paste
- No analytics, no tracking
