# Development Workflow Guide

This guide explains how to safely work with local development and production databases.

---

## 🎯 Quick Reference

| Environment | Database | File | Auto-loaded by |
|------------|----------|------|----------------|
| **Local Dev** | `radiantclaims_dev` (localhost) | `.env.local` | Next.js (pnpm dev) |
| **Production** | Railway PostgreSQL | `.env.production` | Manual scripts only |
| **Git Repo** | Placeholder | `.env` | Committed (safe) |

---

## 🔒 Security Model

✅ **Safe (Gitignored):**
- `.env.local` - Your local dev database
- `.env.production` - Production credentials (manual operations only)

✅ **Safe (Committed):**
- `.env` - Contains placeholder values only

❌ **Never Commit:**
- Production database credentials
- Real API keys or secrets

---

## 💻 Local Development

### Starting Development Server

```bash
# Automatically uses .env.local (local dev database)
pnpm dev
```

**Login credentials (local dev):**
- Email: `brandon@radiantclaims.com`
- Password: `DevPassword123!`

### Running Migrations Locally

```bash
# .env.local is automatically loaded by Next.js
# But Prisma CLI needs explicit URL
DATABASE_URL="postgresql://brandonarmstrong@localhost:5432/radiantclaims_dev" npx prisma migrate dev

# Or for deploy (doesn't create new migration)
DATABASE_URL="postgresql://brandonarmstrong@localhost:5432/radiantclaims_dev" npx prisma migrate deploy
```

### Viewing Local Database

```bash
DATABASE_URL="postgresql://brandonarmstrong@localhost:5432/radiantclaims_dev" npx prisma studio
```

### Creating Test Users Locally

```bash
DATABASE_URL="postgresql://brandonarmstrong@localhost:5432/radiantclaims_dev" npx tsx scripts/create-admin.ts test@example.com "Test User" Password123
```

### Resetting Local Database

```bash
# Drop and recreate
psql postgres -c "DROP DATABASE IF EXISTS radiantclaims_dev;"
psql postgres -c "CREATE DATABASE radiantclaims_dev;"

# Run migrations
DATABASE_URL="postgresql://brandonarmstrong@localhost:5432/radiantclaims_dev" npx prisma migrate deploy

# Create admin user
DATABASE_URL="postgresql://brandonarmstrong@localhost:5432/radiantclaims_dev" npx tsx scripts/create-admin.ts brandon@radiantclaims.com "Brandon Armstrong" DevPassword123!
```

---

## 🚀 Production Operations

### Method 1: Explicit DATABASE_URL (Recommended)

Always prefix production commands with the full DATABASE_URL. This makes it obvious you're touching production:

```bash
# View production data (read-only - safest)
DATABASE_URL="postgresql://postgres:rjXDQGPfSybKDacjlinrgnUIACoNfeQb@switchyard.proxy.rlwy.net:56720/railway" npx prisma studio

# Create production admin user
DATABASE_URL="postgresql://postgres:rjXDQGPfSybKDacjlinrgnUIACoNfeQb@switchyard.proxy.rlwy.net:56720/railway" npx tsx scripts/create-admin.ts email@example.com "Name" SecurePassword123

# Reset production user password
DATABASE_URL="postgresql://postgres:rjXDQGPfSybKDacjlinrgnUIACoNfeQb@switchyard.proxy.rlwy.net:56720/railway" npx tsx scripts/reset-password.ts email@example.com NewPassword

# Run production migrations (⚠️ DANGEROUS - test locally first!)
DATABASE_URL="postgresql://postgres:rjXDQGPfSybKDacjlinrgnUIACoNfeQb@switchyard.proxy.rlwy.net:56720/railway" npx prisma migrate deploy
```

### Method 2: Using .env.production (Multiple Operations)

If you need to do multiple production operations, you can temporarily use `.env.production`:

```bash
# Load .env.production and run commands
# Note: You'll need a tool like dotenv-cli
npx dotenv -e .env.production -- npx prisma studio

# Or manually export (be careful - affects all subsequent commands!)
export $(cat .env.production | grep DATABASE_URL | xargs)
npx prisma studio
# Remember to unset after: unset DATABASE_URL
```

**⚠️ WARNING:** `.env.production` is gitignored. If you recreate it, use the URL from `PRODUCTION_DATABASE.md`.

---

## 🔄 Deployment Process

### How Railway Deploys

1. You push code to `main` branch
2. Railway detects the push
3. Railway runs build using **its own** environment variables (set in Railway dashboard)
4. Railway's `DATABASE_URL` (from dashboard) overrides anything in `.env`

### Safe Deployment Checklist

Before pushing to `main`:

- [ ] Test migrations on local dev database first
- [ ] Ensure `.env` has placeholder DATABASE_URL (not production!)
- [ ] Verify `.env.local` and `.env.production` are gitignored
- [ ] Test new features work locally
- [ ] Check that no production credentials are in code

### Running Migrations in Production

**Option A: Automatic (Railway)** - Configure Railway to run `npx prisma migrate deploy` during build

**Option B: Manual** - Run migrations manually before deploying:
```bash
DATABASE_URL="postgresql://postgres:rjXDQGPfSybKDacjlinrgnUIACoNfeQb@switchyard.proxy.rlwy.net:56720/railway" npx prisma migrate deploy
```

---

## 📁 File Breakdown

### `.env` (Committed to Git)
```bash
# Safe placeholder - used as fallback
DATABASE_URL="postgresql://localhost:5432/radiantclaims_placeholder"
NEXTAUTH_SECRET="..."
# ... other config
```

**Purpose:** Provides structure and non-sensitive defaults. Safe to commit.

### `.env.local` (Gitignored)
```bash
# Local development database
DATABASE_URL="postgresql://brandonarmstrong@localhost:5432/radiantclaims_dev"
```

**Purpose:** Overrides `.env` for local development. Automatically loaded by Next.js.

### `.env.production` (Gitignored)
```bash
# Production database - for manual operations only
DATABASE_URL="postgresql://postgres:rjXDQGPfSybKDacjlinrgnUIACoNfeQb@switchyard.proxy.rlwy.net:56720/railway"
```

**Purpose:** For manual production operations. **Never** loaded automatically.

---

## 🛠️ Helper Scripts

All scripts support explicit DATABASE_URL:

| Script | Purpose | Example |
|--------|---------|---------|
| `create-admin.ts` | Create admin user | `DATABASE_URL="..." npx tsx scripts/create-admin.ts email "Name" password` |
| `reset-password.ts` | Reset user password | `DATABASE_URL="..." npx tsx scripts/reset-password.ts email newpassword` |
| `make-admin.ts` | Upgrade user to admin | `DATABASE_URL="..." npx tsx scripts/make-admin.ts email` |
| `find-user-by-hash.ts` | Find user by password hash | `DATABASE_URL="..." npx tsx scripts/find-user-by-hash.ts hash` |

---

## ⚠️ Common Mistakes to Avoid

### ❌ DON'T:
- Commit `.env.production` to git
- Run production commands without DATABASE_URL prefix
- Test migrations on production first
- Leave production DATABASE_URL in `.env`
- Export production DATABASE_URL globally

### ✅ DO:
- Always prefix production commands with DATABASE_URL
- Test migrations locally first
- Use `.env.local` for local dev
- Keep production credentials in Railway dashboard
- Double-check which database you're connected to

---

## 🆘 Troubleshooting

### "User not found" in production
You're connected to local database. Add production DATABASE_URL prefix.

### "Can't connect to database" locally
Make sure PostgreSQL is running: `brew services start postgresql@17`

### ".env.local not loading"
Next.js loads it automatically. Prisma CLI needs explicit `DATABASE_URL=...` prefix.

### "Migrations already applied"
Different databases have different migration states. This is normal.

### Accidentally ran production command
1. Stay calm
2. Check what changed (query audit logs)
3. Restore from backup if needed (Railway has automatic backups)

---

## 📞 Emergency Contacts

- **Railway Dashboard:** https://railway.app/
- **Backup Strategy:** Railway automatic backups (configurable)
- **Production DB Credentials:** See `PRODUCTION_DATABASE.md` (not committed)

---

## 📚 Additional Resources

- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Prisma Migrations](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Railway Documentation](https://docs.railway.app/)
