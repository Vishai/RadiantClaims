# Test User Credentials

## 🧪 Test Claimant Account (CUSTOMER)

Use this account to test the **claimant portal** and **document upload system**.

```
Email:    claimant@test.com
Password: TestPassword123!
```

**What you can test:**
- ✅ Login at: http://localhost:3000/login
- ✅ Portal Dashboard: http://localhost:3000/portal
- ✅ **Document Upload**: http://localhost:3000/portal/documents
- ✅ RECA Form: http://localhost:3000/reca/form/[sessionId]
- ✅ Change Password: http://localhost:3000/portal/change-password

**Profile Details:**
- Name: Mary Johnson
- Location: St. George, UT (Washington County)
- Claim Type: DOWNWINDER (RECA)
- Cancer Type: Lung Cancer
- Session Status: IN_PROGRESS (15% complete)

---

## 👨‍💼 Admin Account

Use this account to access the **admin portal** (if applicable).

```
Email:    admin@radiantclaims.dev
Password: Passw0rd!
```

**What you can test:**
- ✅ Login at: http://localhost:3000/login
- ✅ Admin routes (if any)

---

## 📝 Legacy Test User (CUSTOMER)

There's also an older test customer account:

```
Email:    customer@test.com
Password: TestPassword123!
```

This user has a PANCREATIC_CANCER claim type (non-RECA).

---

## 🚀 Quick Start

1. **Start the dev server:**
   ```bash
   pnpm dev
   ```

2. **Login as claimant:**
   - Go to: http://localhost:3000/login
   - Email: `claimant@test.com`
   - Password: `TestPassword123!`

3. **Test Document Upload:**
   - After login, click "Manage Documents" on your claim card
   - Or go directly to: http://localhost:3000/portal/documents
   - Upload PDFs or images
   - Try drag & drop
   - Test mobile camera (on mobile device)
   - Categorize documents
   - Search and filter

---

## 🔄 Reset Test Data

To recreate test users:

```bash
# Recreate test claimant
npx tsx scripts/create-test-claimant.ts

# Recreate admin + demo data
npx tsx prisma/seed.ts
```

---

## 📊 Database Access

Direct database queries:

```bash
# List all users
psql $DATABASE_URL -c "SELECT email, role FROM \"User\";"

# Check claimants
psql $DATABASE_URL -c "SELECT \"firstName\", \"lastName\", email, \"claimType\" FROM \"Claimant\";"

# Check uploaded files
psql $DATABASE_URL -c "SELECT \"originalFilename\", category, status FROM \"UploadedFile\";"
```

---

## 🎯 What to Test

### Document Upload System
- [ ] Upload PDF file (drag & drop)
- [ ] Upload image file (click to browse)
- [ ] Upload from mobile camera
- [ ] **Select document type during upload**
- [ ] Confirm auto-detected category
- [ ] **See "Original Required" indicator** during upload
- [ ] View uploaded document
- [ ] Download document
- [ ] Change document category
- [ ] Delete document
- [ ] **See "Original Must Be Mailed" badge** on document cards
- [ ] **Read original document notice** on approved documents
- [ ] Search documents by name
- [ ] Filter by category
- [ ] Filter by status
- [ ] Check required documents checklist
- [ ] Verify progress percentage updates

### Portal Features
- [ ] Login/logout
- [ ] View claims dashboard
- [ ] Navigate to documents page
- [ ] Navigate to RECA form
- [ ] Change password
- [ ] View profile info

---

**Note:** All test accounts are for **development/testing only**. Never use these credentials in production!
