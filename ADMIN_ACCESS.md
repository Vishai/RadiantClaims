# Admin Access Guide

## Accessing the Waitlist Dashboard

### For Admin Users

If you're logged in as an **ADMIN** user, you'll see a green **"Waitlist"** button in your portal navigation bar.

**Steps:**
1. Go to http://localhost:3000/login (or your production URL)
2. Sign in with your admin credentials
3. You'll be redirected to `/portal`
4. Look for the green "Waitlist" button in the top navigation
5. Click it to view all waitlist entries

**Direct URL:**
```
http://localhost:3000/admin/waitlist
```

### Creating Your First Admin User

If you don't have an admin account yet, you can create one using the database:

#### Option 1: Using Prisma Studio (Easiest)

```bash
# Open Prisma Studio
npx prisma studio

# Navigate to the User table
# Find your user account by email
# Change the "role" field from "CUSTOMER" to "ADMIN"
# Save changes
```

#### Option 2: Using PostgreSQL directly

```bash
# Connect to your database
psql -d radiantclaims

# Update your user to admin
UPDATE "User"
SET role = 'ADMIN'
WHERE email = 'your-email@example.com';
```

#### Option 3: Create via API (when registration is enabled)

```bash
# First create a regular account
# Then promote it to admin using one of the methods above
```

### What You'll See in the Waitlist Dashboard

**Top Stats Cards:**
- Pending leads count
- Contacted leads count
- Converted leads count
- Total leads count

**Filter Buttons:**
- All
- Pending
- Contacted
- Converted

**Main Table with columns:**
- Email address
- Name
- Claim Type (if provided)
- Source (which page they came from)
- Status badge
- Number of submission attempts
- Created date
- Actions dropdown (change status)

**Export Button:**
- Download all filtered entries as CSV
- Use for email marketing campaigns

### Available Roles

The system supports these user roles:

- `CUSTOMER` - Regular users/claimants (default)
- `ADMIN` - Full system access, can view waitlist
- `ATTORNEY` - Law firm attorneys
- `FIRM_ADMIN` - Law firm administrators
- `STAFF_REVIEWER` - Can review claims
- `SENIOR_REVIEWER` - Can approve/reject claims

### API Access (For Scripts/Integration)

If you need to access the waitlist programmatically:

```bash
# You'll need to be authenticated as an admin
# Get your session cookie from the browser (dev tools > Application > Cookies)

# Then use curl:
curl -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  http://localhost:3000/api/admin/waitlist

# Or with authentication:
curl -u admin@example.com:password \
  http://localhost:3000/api/admin/waitlist
```

### Troubleshooting

**"Unauthorized" error when accessing /admin/waitlist**
- Make sure you're logged in
- Verify your user role is set to "ADMIN" in the database
- Check session is valid (try logging out and back in)

**Empty waitlist**
- Registration is blocked, but no one has tried to register yet
- Test by going to `/register` while logged out
- Try to create an account → you'll be prompted for waitlist
- Submit email → check dashboard again

**Can't see the "Waitlist" button in portal**
- Only ADMIN users see this button
- Check your role in the database
- Clear browser cache and refresh

### Testing the Flow

**As Admin:**
1. Log in as admin
2. Click "Waitlist" button in portal
3. See your dashboard with all leads

**As Test User (in incognito/private window):**
1. Go to `/register`
2. Fill out form
3. Submit → see error about registration being closed
4. Waitlist form appears automatically
5. Enter email → join waitlist
6. See success message

**Back as Admin:**
1. Refresh waitlist dashboard
2. See the new test lead
3. Update status to "CONTACTED"
4. Export CSV to see all data

### Next Steps

Once you have admin access:
1. Bookmark `/admin/waitlist` for quick access
2. Check daily for new leads
3. Export CSV when ready to send emails
4. Track conversion rates after launch

---

**Need help?** Check `WAITLIST_QUICKSTART.md` for more details about the waitlist system.
