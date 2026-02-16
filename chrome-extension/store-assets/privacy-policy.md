# Privacy Policy — Radiant Claims Filing Assistant

**Last Updated:** February 16, 2026

## Overview

The Radiant Claims Filing Assistant browser extension ("the Extension") helps users transfer their prepared RECA claim data from RadiantClaims.com to the Department of Justice filing portal. This policy explains what data the Extension accesses, how it is used, and how it is stored.

## Data We Access

- **Your RadiantClaims.com claim data** — retrieved via authenticated API calls to RadiantClaims.com using your existing login session. This includes claim form fields and document metadata you have prepared on RadiantClaims.com.

## How We Use Your Data

- **Display guidance on the DOJ portal** — your prepared claim data is shown alongside DOJ form fields so you can accurately transfer information.
- **Document upload assistance** — the Extension references your document list to guide you on which files to upload and where.

## What We Do NOT Do

- We **never transmit your data to third parties**.
- We **never send your data to any server** other than RadiantClaims.com (to retrieve your prepared claim) and the DOJ portal (which you submit to directly).
- We **never collect analytics, telemetry, or usage data**.
- We **never access data from websites** other than RadiantClaims.com and reca.justice.gov.

## Data Storage

- Claim data is cached locally using `chrome.storage.local` within your browser.
- No data is stored on external servers by the Extension.
- **You can clear all cached data at any time** through the Extension's popup menu or by removing the Extension.

## Permissions

The Extension requests only the permissions necessary to function:

- **Host permissions** for `radiantclaims.com` and `reca.justice.gov` — to retrieve your claim data and provide guidance on the DOJ portal.
- **Storage** — to cache your claim data locally for a smoother experience.

## Data Security

All communication with RadiantClaims.com uses HTTPS encryption. Your authentication credentials are managed by your browser's existing session and are never accessed or stored by the Extension.

## Changes to This Policy

We may update this policy as the Extension evolves. Changes will be noted with an updated "Last Updated" date.

## Contact

Questions about this privacy policy? Contact us at [RadiantClaims.com](https://radiantclaims.com).
