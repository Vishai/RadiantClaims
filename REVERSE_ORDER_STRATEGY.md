Strategy: Reverse-Order Intake (The "Beat the Clock" Protocol)

Context: The RECA program has a hard expiration of December 31, 2027.
Problem: Traditional intake flows ask for "easy" documents first (ID, Birth Cert) and "hard" documents last (Medical Records). This is fatal because Medical Records take 6-12 months to retrieve. If a user starts in Jan 2027 and follows a traditional flow, they will miss the deadline.

Solution: We invert the intake flow. We prioritize tasks based on External Latency (how long the government/hospital takes to reply), not User Difficulty.

The Triage Hierarchy

We categorize every required document into three tiers based on "Lead Time."

Tier 1: High Latency (Immediate Action Required)

Lead Time: 3 - 12 Months

Items:

Pathology Reports (from 1960s-1990s archives)

Employment Records (Uranium mines, DOJ verification)

Radiation Exposure Records (Dosimetry badges)

Action: These requests must be generated Day 0. The user does not need to have the document; they just need to sign the request form so we can start the clock.

Tier 2: Medium Latency (State Bureaucracy)

Lead Time: 4 - 8 Weeks

Items:

Certified Birth Certificates (Vital Records)

Marriage Certificates

Death Certificates

Divorce Decrees (for name changes)

Action: Trigger these requests in Week 1.

Tier 3: Zero Latency (User Possession)

Lead Time: 0 - 7 Days

Items:

Driver's License / ID

Social Security Card scan

Personal Affidavits (Witness statements)

High School Yearbooks (Proof of residence)

Church Records

Action: These are "filler tasks." The user works on these while waiting for Tier 1 and Tier 2.

The User Experience (UX) Shift

Traditional Flow (Bad)

User creates account.

App asks: "Upload your Driver's License."

App asks: "Upload your Birth Certificate."

... (3 weeks later) ...

App asks: "Now, let's request your medical records." -> Too Late.

Reverse-Order Flow (Good)

User creates account.

CRITICAL INTERVENTION: App asks: "Where were you diagnosed? (Hospital Name)"

App generates HIPAA Release PDF & Hospital Request Letter.

Task 1: "Sign and mail this letter TODAY. This is the longest step."

While that letter is in the mail...

"Now, let's upload your Driver's License."

Implementation Logic

See intake_priority_engine.ts for the sorting algorithm. We calculate a priorityScore for every missing document:

$$P = (L \times W) + D$$

$P$: Priority Score (Higher = Top of Task List)

$L$: Estimated Lead Time (Days)

$W$: Criticality Weight (1.5 for Medical/Employment, 1.0 for others)

$D$: Deadline Proximity Bonus (increases as Dec 2027 gets closer)