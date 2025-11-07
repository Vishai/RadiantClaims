# Production Database Access

**⚠️ CRITICAL: Production database credentials are NEVER stored in git.**

## Production Database Connection

The production Railway PostgreSQL database URL is:
```
postgresql://postgres:rjXDQGPfSybKDacjlinrgnUIACoNfeQb@switchyard.proxy.rlwy.net:56720/railway
```

## Safe Production Operations

### View Production Data (Read-Only)
```bash
DATABASE_URL="postgresql://postgres:rjXDQGPfSybKDacjlinrgnUIACoNfeQb@switchyard.proxy.rlwy.net:56720/railway" npx prisma studio
```

### Run Production Migrations (DANGEROUS - be careful!)
```bash
DATABASE_URL="postgresql://postgres:rjXDQGPfSybKDacjlinrgnUIACoNfeQb@switchyard.proxy.rlwy.net:56720/railway" npx prisma migrate deploy
```

### Create Production Admin User
```bash
DATABASE_URL="postgresql://postgres:rjXDQGPfSybKDacjlinrgnUIACoNfeQb@switchyard.proxy.rlwy.net:56720/railway" npx tsx scripts/create-admin.ts email@example.com "Name" SecurePassword
```

### Reset Production User Password
```bash
DATABASE_URL="postgresql://postgres:rjXDQGPfSybKDacjlinrgnUIACoNfeQb@switchyard.proxy.rlwy.net:56720/railway" npx tsx scripts/reset-password.ts email@example.com NewPassword
```

## Railway Dashboard

Production environment variables are configured at:
https://railway.app/ → Your Project → Variables

## Important Notes

- ✅ Railway automatically sets `DATABASE_URL` in production
- ✅ Never commit production credentials to git
- ✅ Always prefix production commands with the full `DATABASE_URL=...`
- ⚠️  Test migrations on local dev database first
- ⚠️  Backup before running production migrations
