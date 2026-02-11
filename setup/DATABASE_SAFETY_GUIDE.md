# Database Safety Guide

**Critical:** This guide ensures you never accidentally modify production data.

---

## 🎯 Quick Reference

### ✅ Safe Development Commands (Always Use These)

```bash
# Start development server
npm run dev

# Database operations (automatically checks environment first)
npm run db:check     # Verify which database you're connected to
npm run db:push      # Push schema changes
npm run db:migrate   # Create and apply migrations
npm run db:studio    # Open Prisma Studio
npm run db:seed      # Seed database with test data
npm run db:reset     # Reset database (WARNING: deletes all data)

# Build and type checking
npm run build
npm run typecheck
npm run lint
```

**All database commands now automatically run `db:check` first** to ensure you're on the development database.

---

## 🔒 How This Works

### Environment File Priority (Next.js)

Next.js loads environment files in this order (later files override earlier):

1. `.env` - Base configuration (shared defaults)
2. `.env.local` - **Local development overrides** ← **This is what you use**
3. `.env.production` - ❌ **DON'T USE THIS FILE** (Railway sets vars automatically)

### Your Current Setup

**Development Database** (Default):
```bash
# .env.local (automatically loaded)
DATABASE_URL="postgresql://brandonarmstrong@localhost:5432/radiantclaims_dev"
```

**Production Database** (Railway only):
```bash
# Set automatically by Railway - DO NOT store locally
DATABASE_URL="postgresql://postgres:***@postgres.railway.internal:5432/railway"
```

---

## 🚦 Environment Detection

### How to Know Which Database You're On

Run the environment checker:
```bash
npm run db:check
```

**Development (Safe):**
```
✅ DEVELOPMENT DATABASE ✅
Safe to experiment, test, and modify data.
```

**Production (Dangerous):**
```
⚠️  PRODUCTION DATABASE ⚠️
WARNING: You are connected to the LIVE PRODUCTION database!
```

---

## 📋 Common Workflows

### Daily Development Work

```bash
# 1. Start development
npm run dev

# 2. Make schema changes in prisma/schema.prisma

# 3. Push changes to dev database
npm run db:push

# 4. Test in browser at http://localhost:3000

# 5. View/edit data visually
npm run db:studio
```

**You're ALWAYS on development database** unless you explicitly override `DATABASE_URL`.

---

### Creating Database Migrations

```bash
# 1. Make schema changes in prisma/schema.prisma

# 2. Create migration (will check environment first)
npm run db:migrate

# 3. Enter migration name when prompted
# Example: "add_user_fields"

# 4. Migration is created and applied to dev database
```

---

### Seeding Test Data

```bash
# Add test data to development database
npm run db:seed
```

---

### Resetting Development Database

```bash
# ⚠️  WARNING: This deletes ALL data in the database
npm run db:reset

# The environment check will confirm you're on development first
```

---

## 🔐 Production Database Access

### When You Need to Access Production

**Option 1: Railway CLI** (Recommended)
```bash
# View production database in Prisma Studio
railway run npx prisma studio

# Run migrations in production (during deployment)
# Railway automatically uses production DATABASE_URL
```

**Option 2: Get Production URL** (For one-off tasks)
```bash
# View the production DATABASE_URL
railway variables | grep DATABASE_URL

# Or get the full value
railway run printenv DATABASE_URL
```

**Option 3: Temporary Override** (Use with extreme caution)
```bash
# Set temporarily for one command
DATABASE_URL="<from-railway>" npx prisma studio

# Or set for your current shell session
export DATABASE_URL="<from-railway>"
npx prisma studio
unset DATABASE_URL  # IMPORTANT: Clear it when done
```

---

## 🛡️ Safety Mechanisms

### 1. Environment Checker (`scripts/check-db-environment.ts`)

- Automatically runs before all database commands
- Detects if you're on production or development
- **Blocks execution** if you're on production (exit code 1)
- Shows database stats to confirm which environment

### 2. `.env.local` Priority

- Next.js automatically loads `.env.local` AFTER `.env`
- Your development DATABASE_URL always overrides the base `.env`
- Production deployments ignore `.env.local` (Railway sets vars directly)

### 3. `.gitignore` Protection

```gitignore
.env
.env*.local
.env.production
```

- Prevents committing database credentials to git
- Keeps secrets out of version control

---

## ❌ What NOT To Do

### DON'T: Store Production Credentials Locally

```bash
# ❌ BAD - Don't create this file
.env.production
DATABASE_URL="postgresql://postgres:password@railway..."
```

**Why:** Could accidentally commit secrets to git

### DON'T: Use Production URL in .env.local

```bash
# ❌ BAD - Don't put production URL here
.env.local
DATABASE_URL="postgresql://postgres:password@railway..."
```

**Why:** Would make ALL your local development hit production!

### DON'T: Run Migrations Manually in Production

```bash
# ❌ BAD - Don't do this
DATABASE_URL="<prod-url>" npx prisma migrate deploy
```

**Why:** Railway handles this automatically during deployments

### DON'T: Skip the Environment Check

```bash
# ❌ BAD - Don't bypass the safety check
prisma db push  # Might hit the wrong database!
```

**Why:** You might be on production without realizing it

---

## ✅ Best Practices

### 1. Always Use npm Scripts

```bash
✅ npm run db:migrate    # Checks environment first
❌ npx prisma migrate dev  # Bypasses safety check
```

### 2. Verify Before Destructive Operations

```bash
# Before resetting or dropping database
npm run db:check

# Confirm you see:
# ✅ DEVELOPMENT DATABASE ✅
```

### 3. Use Railway for Production

```bash
# Production operations should use Railway
railway run npx prisma studio
railway run npx prisma migrate deploy
```

### 4. Keep .env.local for Development Only

```bash
# .env.local - Your safe development defaults
DATABASE_URL="postgresql://brandonarmstrong@localhost:5432/radiantclaims_dev"
NODE_ENV="development"
```

---

## 🔍 Troubleshooting

### "I'm not sure which database I'm on"

```bash
npm run db:check
```

This shows:
- Database connection string (masked password)
- Database name
- User name
- Environment (dev/prod)
- Record counts

### "My local changes aren't showing up"

Check if you're using the right database:
```bash
npm run db:check

# Make sure you see:
# Database: radiantclaims_dev
```

### "I accidentally ran something on production"

1. **Don't panic** - your safety checks should have prevented it
2. If it went through, check Railway logs
3. Railway has automatic backups - you can restore if needed

### "How do I know if a command is safe?"

If the command uses:
- `npm run db:*` → ✅ Safe (has environment check)
- `npx prisma` directly → ⚠️  Check environment first
- `railway run` → ⚠️  Production (use with caution)

---

## 📊 Database Commands Reference

| Command | Environment | Safety | Purpose |
|---------|-------------|--------|---------|
| `npm run dev` | Development | ✅ Safe | Start Next.js dev server |
| `npm run db:check` | Current | ✅ Safe | Verify which database |
| `npm run db:push` | Development | ✅ Safe | Sync schema to DB |
| `npm run db:migrate` | Development | ✅ Safe | Create migration |
| `npm run db:studio` | Development | ✅ Safe | Open Prisma Studio |
| `npm run db:seed` | Development | ✅ Safe | Add test data |
| `npm run db:reset` | Development | ⚠️  Destructive | Delete all data |
| `railway run ...` | Production | ⚠️  Production | Run in Railway env |

---

## 🎓 Summary

**Default Behavior (Safe):**
- All `npm run db:*` commands use development database
- Environment checker blocks production access
- You can experiment freely without fear

**Production Access (Intentional):**
- Use Railway CLI for production operations
- Never store production credentials locally
- Railway handles migrations automatically on deploy

**Remember:**
> If you're not explicitly using `railway run` or setting `DATABASE_URL` manually, you're on the safe development database!

---

## 📞 Quick Help

**Check environment:**
```bash
npm run db:check
```

**Safe development workflow:**
```bash
npm run dev              # Start server
npm run db:push          # Update schema
npm run db:studio        # View data
```

**Production access (rare):**
```bash
railway run npx prisma studio   # View production data
```

**When in doubt:** Run `npm run db:check` first!
