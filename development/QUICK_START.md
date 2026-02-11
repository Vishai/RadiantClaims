# RadiantClaims - Quick Start Guide

## 🚀 First Time Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Verify Database Connection
```bash
npm run db:check
```

You should see:
```
✅ DEVELOPMENT DATABASE ✅
Database: radiantclaims_dev
```

### 3. Run Database Migrations
```bash
npm run db:migrate
```

### 4. Seed Test Data (Optional)
```bash
npm run db:seed
```

### 5. Start Development Server
```bash
npm run dev
```

Visit http://localhost:3000

---

## 📊 Daily Development Workflow

```bash
# Start the dev server
npm run dev

# Make changes to code or schema

# If you changed prisma/schema.prisma:
npm run db:push

# View/edit database visually
npm run db:studio
```

---

## 🔒 Database Safety

**By default, you're ALWAYS on the development database.** All these commands are safe:

```bash
npm run db:check     # Which database am I on?
npm run db:push      # Sync schema changes
npm run db:migrate   # Create migration
npm run db:studio    # Open database GUI
npm run db:seed      # Add test data
npm run db:reset     # Reset database (dev only)
```

Every database command automatically checks that you're on development before running.

**See [DATABASE_SAFETY_GUIDE.md](./DATABASE_SAFETY_GUIDE.md) for complete details.**

---

## 🏗️ Common Tasks

### Create a New Database Migration
```bash
# 1. Edit prisma/schema.prisma
# 2. Run:
npm run db:migrate
# 3. Enter migration name (e.g., "add_user_role")
```

### Reset Database (Dev Only)
```bash
npm run db:reset
```
⚠️  Deletes all data - development only!

### View Production Data (Rare)
```bash
railway run npx prisma studio
```

---

## 🛠️ Available Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Check TypeScript types |
| `npm run db:check` | Verify database environment |
| `npm run db:push` | Push schema to database |
| `npm run db:migrate` | Create migration |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:seed` | Seed test data |
| `npm run db:reset` | Reset database |

---

## 🔐 Environment Variables

### Development (.env.local)
```bash
DATABASE_URL="postgresql://brandonarmstrong@localhost:5432/radiantclaims_dev"
# All other vars inherited from .env
```

### Production (Railway)
Railway automatically sets all environment variables. Never store production credentials locally.

---

## 📁 Project Structure

```
RadiantClaims/
├── prisma/
│   ├── schema.prisma      # Database schema
│   ├── migrations/        # Database migrations
│   └── seed.ts           # Seed data
├── src/
│   ├── app/              # Next.js app routes
│   ├── components/       # React components
│   ├── lib/              # Utilities & helpers
│   └── types/            # TypeScript types
├── scripts/              # Helper scripts
│   └── check-db-environment.ts
├── .env.example          # Example environment vars
├── .env.local            # Your local config (not committed)
└── package.json
```

---

## ❓ Troubleshooting

### "Can't connect to database"
```bash
# Check which database you're trying to use
npm run db:check

# Make sure PostgreSQL is running
# For local dev, you need postgres running on localhost:5432
```

### "Wrong database environment"
```bash
# Verify you're on development
npm run db:check

# Should show: radiantclaims_dev
```

### "Production database accidentally accessed"
The safety checks prevent this! All `npm run db:*` commands check environment first and will abort if you're on production.

---

## 📚 More Information

- [DATABASE_SAFETY_GUIDE.md](./DATABASE_SAFETY_GUIDE.md) - Complete database safety guide
- [prisma/schema.prisma](./prisma/schema.prisma) - Database schema
- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)

---

## 🎯 Remember

> **You're always on the development database unless you explicitly use `railway run` or override `DATABASE_URL`.**

All npm scripts have safety checks built in. You can develop with confidence! 🎉
