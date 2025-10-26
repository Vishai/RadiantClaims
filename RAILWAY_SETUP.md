# Railway Deployment Guide

## Prerequisites

1. Create a [Railway](https://railway.app) account
2. Install the Railway CLI: `npm install -g @railway/cli`
3. Login to Railway: `railway login`

## Step 1: Create a New Railway Project

```bash
# From your project root
railway init
```

Choose:
- **Create a new project**: RadiantClaims
- **Environment**: production

## Step 2: Add PostgreSQL Database

```bash
# Add a PostgreSQL database to your project
railway add postgresql
```

Railway will automatically:
- Provision a PostgreSQL database
- Set the `DATABASE_URL` environment variable
- Configure the connection string

## Step 3: Configure Environment Variables

Go to your Railway dashboard or use the CLI:

```bash
# Set required environment variables
railway variables set NEXTAUTH_SECRET=$(openssl rand -base64 32)
railway variables set NEXTAUTH_URL=https://your-app.railway.app
railway variables set NODE_ENV=production

# Optional: Set up Cloudflare R2 for file uploads
railway variables set R2_ACCESS_KEY_ID=your_access_key
railway variables set R2_SECRET_ACCESS_KEY=your_secret_key
railway variables set R2_ENDPOINT=https://your_account_id.r2.cloudflarestorage.com
railway variables set R2_BUCKET=radiantclaims-uploads

# Optional: Set up Resend for emails
railway variables set RESEND_API_KEY=your_resend_api_key
```

### Critical Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | ✅ Yes | Auto-set by Railway | `postgresql://user:pass@host:5432/db` |
| `NEXTAUTH_SECRET` | ✅ Yes | Auth encryption key | Generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | ✅ Yes | Your app's URL | `https://your-app.railway.app` |
| `NODE_ENV` | ✅ Yes | Environment | `production` |
| `R2_ACCESS_KEY_ID` | ⚠️ Optional | R2 credentials | From Cloudflare |
| `R2_SECRET_ACCESS_KEY` | ⚠️ Optional | R2 credentials | From Cloudflare |
| `R2_ENDPOINT` | ⚠️ Optional | R2 endpoint | `https://xxx.r2.cloudflarestorage.com` |
| `R2_BUCKET` | ⚠️ Optional | R2 bucket name | `radiantclaims-uploads` |
| `RESEND_API_KEY` | ⚠️ Optional | Email service | From resend.com |

## Step 4: Connect Your GitHub Repository

### Option A: Via Railway Dashboard (Recommended)

1. Go to your Railway project dashboard
2. Click on your service
3. Go to **Settings** → **Source**
4. Click **Connect Repo**
5. Authorize Railway to access your GitHub
6. Select the `RadiantClaims` repository
7. Set the branch to deploy (e.g., `main` or `production`)

### Option B: Via Railway CLI

```bash
# Link to your GitHub repository
railway link
```

### Configure Auto-Deploy

In Railway Dashboard:
1. Go to **Settings** → **Deploys**
2. Enable **Auto-Deploy**
3. Set branch to `main` (or your production branch)
4. Every push to this branch will trigger a deployment

## Step 5: Run Database Migrations

After your first deployment, run migrations:

```bash
# Connect to your Railway project
railway link

# Run migrations in production
railway run pnpm db:push

# OR generate and run migrations
railway run pnpm db:migrate
```

**Important**: For production, prefer `prisma migrate deploy`:

```bash
railway run npx prisma migrate deploy
```

## Step 6: Verify Deployment

```bash
# Open your app in the browser
railway open

# View logs
railway logs

# Check service status
railway status
```

## Step 7: Set Up Custom Domain (Optional)

1. Go to your Railway project dashboard
2. Click on your service
3. Go to **Settings** → **Domains**
4. Click **Generate Domain** (gets you a `.railway.app` domain)
5. Or click **Custom Domain** to add your own domain

### For Custom Domains:

1. Add your domain in Railway
2. Railway will provide DNS records
3. Add these records to your domain provider:
   - Type: `CNAME`
   - Name: `@` or subdomain
   - Value: Provided by Railway

## Security Configuration

### Enable HTTPS (Automatic)

Railway automatically provides HTTPS for all `.railway.app` domains and custom domains. No additional configuration needed!

### SSL/TLS Certificates

Railway uses Let's Encrypt certificates automatically:
- Auto-renewal
- Free SSL certificates
- Supports custom domains

## Database Management

### Access Database via Railway CLI

```bash
# Connect to PostgreSQL
railway connect postgres
```

### Backup Database

```bash
# Export database
railway run pg_dump > backup.sql
```

### View Database in Prisma Studio

```bash
railway run pnpm db:studio
```

Then navigate to http://localhost:5555

## Monitoring & Debugging

### View Application Logs

```bash
# Stream logs in real-time
railway logs -f

# View last 100 lines
railway logs --lines 100
```

### Check Resource Usage

Go to Railway Dashboard → Metrics to view:
- CPU usage
- Memory usage
- Network traffic
- Database connections

### Health Checks

Railway automatically health checks your app on port 3000. If your app doesn't respond, Railway will restart it.

## CI/CD Integration

Your app will automatically deploy when you push to your configured branch. The deployment process:

1. **Build Phase**:
   ```bash
   pnpm install --frozen-lockfile
   pnpm db:generate
   pnpm build
   ```

2. **Start Phase**:
   ```bash
   pnpm start
   ```

### Deployment Webhooks (Optional)

Set up webhooks to get notified of deployments:

1. Go to **Settings** → **Webhooks**
2. Add webhook URL
3. Select events (deployment success, failure)

## Environment-Specific Configurations

### Staging Environment

Create a separate environment for staging:

```bash
# In Railway Dashboard
1. Go to your project
2. Click "New Environment"
3. Name it "staging"
4. Duplicate production variables
5. Update NEXTAUTH_URL to staging URL
```

### Development vs Production

Railway automatically sets `NODE_ENV=production`. Your app's `env.mjs` handles this:

```javascript
// Strict validation in production
NEXTAUTH_SECRET: process.env.NODE_ENV === "production"
  ? z.string()  // Required in production
  : z.string().optional()  // Optional in dev
```

## Cost Optimization

### Free Tier Limits

Railway's free tier includes:
- $5 credit per month
- Automatically scales to zero when not in use
- Pay only for usage

### Optimize Costs

1. **Scale replicas**: Start with 1, increase if needed
2. **Database**: Use Railway's PostgreSQL (included)
3. **Monitor usage**: Check dashboard regularly
4. **Caching**: Implement Redis if needed (separate service)

## Troubleshooting

### Build Failures

```bash
# View build logs
railway logs --build

# Common issues:
# 1. Missing dependencies - check package.json
# 2. TypeScript errors - run `pnpm typecheck` locally
# 3. Environment variables - verify in dashboard
```

### Database Connection Issues

```bash
# Verify DATABASE_URL is set
railway variables

# Test connection
railway run npx prisma db pull
```

### Application Crashes

```bash
# Check logs for errors
railway logs -f

# Restart service
railway restart
```

### Port Issues

Railway expects your app on port `3000` (Next.js default). If using a custom port:

```javascript
// next.config.js - Not needed for Railway, uses default port 3000
```

## Railway Commands Cheatsheet

```bash
# Login to Railway
railway login

# Initialize project
railway init

# Link to existing project
railway link

# Add a service (database)
railway add

# Set environment variables
railway variables set KEY=value

# View environment variables
railway variables

# Deploy current code
railway up

# Run command in production environment
railway run <command>

# Connect to database
railway connect postgres

# View logs
railway logs

# Open app in browser
railway open

# Check service status
railway status

# Restart service
railway restart

# Delete service
railway delete
```

## Next Steps After Deployment

1. ✅ Verify all pages load correctly
2. ✅ Test authentication flow
3. ✅ Verify database connections
4. ✅ Test file uploads (if R2 configured)
5. ✅ Test email sending (if Resend configured)
6. ✅ Set up monitoring and alerts
7. ✅ Configure custom domain
8. ✅ Set up automated backups
9. ✅ Implement rate limiting (see SECURITY_SETUP.md)
10. ✅ Enable audit logging (see SECURITY_SETUP.md)

## Support & Resources

- [Railway Documentation](https://docs.railway.app)
- [Railway Discord](https://discord.gg/railway)
- [Prisma + Railway Guide](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-railway)
- [Next.js + Railway Guide](https://railway.app/templates/next-js)

## Security Reminders

- 🔒 Never commit `.env` files
- 🔒 Rotate `NEXTAUTH_SECRET` regularly
- 🔒 Use separate databases for staging/production
- 🔒 Enable 2FA on your Railway account
- 🔒 Regularly update dependencies
- 🔒 Monitor access logs
- 🔒 Set up database backups
