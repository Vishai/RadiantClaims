# Railway Deployment - Quick Start Guide

## Prerequisites

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login
```

## Step-by-Step Deployment

### 1. Initialize Railway Project

```bash
# From your project root
railway init
```

This will:
- Create a new Railway project
- Link your local directory to the project

### 2. Add PostgreSQL Database

```bash
# Add PostgreSQL database
railway add --database postgres
```

Railway will automatically:
- Provision a PostgreSQL database
- Set the `DATABASE_URL` environment variable
- Configure the connection string

### 3. Set Environment Variables

```bash
# Generate and set NextAuth secret
railway variables --set "NEXTAUTH_SECRET=$(openssl rand -base64 32)"

# Set your app URL (you'll get this after first deployment, use placeholder for now)
railway variables --set "NEXTAUTH_URL=https://your-app.railway.app"

# Set environment to production
railway variables --set "NODE_ENV=production"
```

### 4. Connect GitHub Repository

**Via Railway Dashboard** (Recommended):

1. Go to https://railway.app/dashboard
2. Select your RadiantClaims project
3. Click on your service
4. Go to **Settings** → **Source**
5. Click **Connect Repo**
6. Authorize Railway to access GitHub
7. Select your repository
8. Set deploy branch to `main` or `step-2`

**Via CLI** (Alternative):

```bash
railway link
```

### 5. Push Database Schema

```bash
# Generate Prisma client with new security models
railway run pnpm db:generate

# Push schema to Railway database
railway run pnpm db:push
```

You should see output like:
```
✓ Prisma schema loaded
✓ Datasource "db": PostgreSQL database
✓ Database synchronized with Prisma schema
```

### 6. Deploy Your Application

If you connected via GitHub, deployment is automatic on push:

```bash
git add .
git commit -m "Add Railway deployment and SOC 2 security features"
git push origin step-2
```

Railway will:
- Build your application
- Run database migrations
- Deploy to production
- Provide a URL

### 7. Get Your App URL

```bash
# View your deployment
railway open

# Or get the URL
railway status
```

Update your `NEXTAUTH_URL`:

```bash
# Replace with your actual Railway URL
railway variables --set "NEXTAUTH_URL=https://radiantclaims-production.up.railway.app"
```

### 8. Verify Deployment

```bash
# Check logs
railway logs

# Or stream logs in real-time
railway logs -f
```

Visit your app URL and verify:
- ✅ App loads over HTTPS
- ✅ Login works
- ✅ Database connection is successful

---

## Optional: Set Up Upstash Redis (Rate Limiting)

For production rate limiting (recommended):

1. **Sign up at [Upstash](https://upstash.com)** (free tier available)

2. **Create a Redis database**:
   - Click "Create Database"
   - Choose a region close to your Railway deployment
   - Select "Free" tier

3. **Get credentials**:
   - Copy `UPSTASH_REDIS_REST_URL`
   - Copy `UPSTASH_REDIS_REST_TOKEN`

4. **Add to Railway**:

```bash
railway variables --set "UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io"
railway variables --set "UPSTASH_REDIS_REST_TOKEN=your_token_here"
```

5. **Redeploy** (if already deployed):

```bash
railway up
```

---

## Common Commands

```bash
# View environment variables
railway variables

# Connect to PostgreSQL database
railway run psql $DATABASE_URL

# Run Prisma Studio to view data
railway run pnpm db:studio

# View deployment status
railway status

# Open app in browser
railway open

# Restart service
railway restart

# View recent logs
railway logs --lines 100

# Run a one-off command
railway run <command>
```

---

## Troubleshooting

### Build Fails

```bash
# Check build logs
railway logs --deployment

# Common fixes:
railway run pnpm install
railway run pnpm db:generate
railway run pnpm typecheck
```

### Database Connection Issues

```bash
# Verify DATABASE_URL is set
railway variables | grep DATABASE_URL

# Test connection
railway run pnpm db:push
```

### Environment Variable Not Found

```bash
# List all variables
railway variables

# Set missing variable
railway variables --set "KEY=value"
```

### Rate Limiting Not Working

**In Development**: Uses in-memory limiter automatically (works without Redis)

**In Production**:
- Set up Upstash Redis (see above)
- Without Redis, in-memory fallback still works but won't persist across server restarts

---

## Environment Variables Checklist

| Variable | Required | Value | Status |
|----------|----------|-------|--------|
| `DATABASE_URL` | ✅ Yes | Auto-set by Railway | Auto |
| `NEXTAUTH_SECRET` | ✅ Yes | `openssl rand -base64 32` | Manual |
| `NEXTAUTH_URL` | ✅ Yes | Your Railway app URL | Manual |
| `NODE_ENV` | ✅ Yes | `production` | Manual |
| `UPSTASH_REDIS_REST_URL` | ⚠️ Optional | From upstash.com | Optional |
| `UPSTASH_REDIS_REST_TOKEN` | ⚠️ Optional | From upstash.com | Optional |
| `R2_ACCESS_KEY_ID` | ⚠️ Optional | From Cloudflare R2 | Optional |
| `R2_SECRET_ACCESS_KEY` | ⚠️ Optional | From Cloudflare R2 | Optional |
| `R2_ENDPOINT` | ⚠️ Optional | From Cloudflare R2 | Optional |
| `R2_BUCKET` | ⚠️ Optional | From Cloudflare R2 | Optional |
| `RESEND_API_KEY` | ⚠️ Optional | From resend.com | Optional |

---

## Next Steps After Deployment

1. ✅ **Test your app**:
   - Visit your Railway URL
   - Create a test account
   - Verify login works
   - Check database operations

2. ✅ **Set up monitoring**:
   - Go to Railway Dashboard → Metrics
   - Monitor CPU, memory, network usage

3. ✅ **Enable audit logging**:
   - Integrate `createAuditLog()` into API routes
   - See `DEPLOYMENT_QUICK_START.md` for examples

4. ✅ **Configure custom domain** (optional):
   - Railway Dashboard → Settings → Domains
   - Add your custom domain
   - Update DNS records

5. ✅ **Set up Cloudflare R2** (for file uploads):
   - Create R2 bucket at Cloudflare
   - Add R2 credentials to Railway variables

6. ✅ **Set up Resend** (for emails):
   - Get API key from resend.com
   - Add to Railway variables

---

## Support

- **Railway Issues**: https://railway.app/help
- **Railway Discord**: https://discord.gg/railway
- **Deployment Guide**: See `RAILWAY_SETUP.md`
- **Security Features**: See `SECURITY_SETUP.md`

---

**You're ready to deploy! 🚀**

After following these steps, your RadiantClaims application will be live on Railway with HTTPS, database, and all SOC 2 security features ready to use.
