# Deployment Guide - Vercel

This guide walks you through deploying RadiantClaims to Vercel.

## Prerequisites

- GitHub account with access to this repository
- Vercel account (sign up at https://vercel.com)
- Production PostgreSQL database (Railway, Neon, Supabase, etc.)

## Step 1: Prepare Your Database

### Option A: Railway (Recommended if you're already using it)

1. Go to https://railway.app
2. Create a new PostgreSQL database
3. Copy the `DATABASE_URL` connection string

### Option B: Neon (Serverless PostgreSQL)

1. Go to https://neon.tech
2. Create a new project
3. Copy the connection string
4. **Important:** Add `?sslmode=require` to the end of the connection string

### Option C: Supabase

1. Go to https://supabase.com
2. Create a new project
3. Go to Settings → Database → Connection string (URI)
4. Copy the connection string

## Step 2: Deploy to Vercel

### Connect Your Repository

1. Go to https://vercel.com/new
2. Import your GitHub repository: `Vishai/RadiantClaims`
3. Vercel will auto-detect Next.js

### Configure Environment Variables

In the Vercel deployment screen, add these environment variables:

#### Required Variables

| Variable | Value | How to Get |
|----------|-------|------------|
| `DATABASE_URL` | Your PostgreSQL connection string | From Step 1 |
| `NEXTAUTH_SECRET` | Random secret string | Generate with: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Your production URL | Will be `https://your-project.vercel.app` |

#### Optional Variables (add if you're using these features)

| Variable | Value | Notes |
|----------|-------|-------|
| `R2_ACCESS_KEY_ID` | Your Cloudflare R2 access key | For file uploads |
| `R2_SECRET_ACCESS_KEY` | Your Cloudflare R2 secret | For file uploads |
| `R2_ENDPOINT` | `https://account-id.r2.cloudflarestorage.com` | For file uploads |
| `R2_BUCKET` | Your bucket name | For file uploads |
| `RESEND_API_KEY` | Your Resend API key | For email notifications |
| `UPSTASH_REDIS_REST_URL` | Your Upstash Redis URL | For rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | Your Upstash Redis token | For rate limiting |

### Deploy

1. Click "Deploy"
2. Vercel will build and deploy your app
3. Once deployed, you'll get a URL like `https://radiant-claims.vercel.app`

## Step 3: Update NEXTAUTH_URL

After your first deployment:

1. Copy your production URL (e.g., `https://radiant-claims.vercel.app`)
2. Go to your Vercel project → Settings → Environment Variables
3. Update `NEXTAUTH_URL` to your actual production URL
4. Redeploy (Vercel → Deployments → ... → Redeploy)

## Step 4: Run Database Migrations

After deployment, you need to run Prisma migrations against your production database:

### Option A: From Your Local Machine

```bash
# Set your production DATABASE_URL temporarily
DATABASE_URL="your-production-database-url" pnpm db:push

# Or run migrations
DATABASE_URL="your-production-database-url" pnpm db:migrate
```

### Option B: Using Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Link to your project
vercel link

# Run migration command
vercel env pull .env.production
DATABASE_URL=$(grep DATABASE_URL .env.production | cut -d '=' -f2-) pnpm db:push
```

## Step 5: Set Up Custom Domain (Optional)

1. Go to Vercel project → Settings → Domains
2. Add your custom domain (e.g., `radiantclaims.com`)
3. Follow DNS configuration instructions
4. Update `NEXTAUTH_URL` to your custom domain
5. Redeploy

## Automatic Deployments

Vercel automatically deploys:
- **Production:** Every push to `main` branch → `https://your-project.vercel.app`
- **Preview:** Every pull request → `https://your-project-git-branch.vercel.app`

## Environment Variables for Different Environments

### Development (.env.local)
```env
DATABASE_URL="postgresql://user:password@localhost:5432/radiantclaims"
NEXTAUTH_SECRET="local-dev-secret"
NEXTAUTH_URL="http://localhost:3000"
```

### Production (Vercel)
```env
DATABASE_URL="postgresql://user:password@production-host:5432/radiantclaims?sslmode=require"
NEXTAUTH_SECRET="<generated-with-openssl-rand-base64-32>"
NEXTAUTH_URL="https://radiantclaims.vercel.app"
```

## Troubleshooting

### Build Fails with "Prisma Client not generated"

The `vercel.json` file includes `pnpm db:generate` in the build command, but if it fails:

1. Check that `DATABASE_URL` is set in Vercel environment variables
2. Ensure it's available at build time (not just runtime)

### Database Connection Errors

1. Ensure your database allows connections from Vercel's IP ranges
2. Most hosted databases (Railway, Neon, Supabase) allow all IPs by default
3. Check that your connection string includes SSL: `?sslmode=require`

### NextAuth Errors

1. Verify `NEXTAUTH_URL` matches your actual domain (no trailing slash)
2. Ensure `NEXTAUTH_SECRET` is set and is a strong random string
3. Check browser console for specific NextAuth errors

## Monitoring

### View Logs

1. Go to Vercel project → Deployments
2. Click on a deployment
3. Click "View Function Logs"

### Analytics

Vercel provides built-in analytics:
- Go to your project → Analytics
- View page views, visitors, performance metrics

## Cost Estimate

### Free Tier Includes:
- 100GB bandwidth
- Unlimited deployments
- Automatic HTTPS
- Preview deployments

### If You Exceed Free Tier:
- Pro plan: $20/month
- Includes 1TB bandwidth
- Better support

Most early-stage apps stay within free tier limits.

## Next Steps

1. ✅ Deploy to Vercel
2. Set up monitoring/error tracking (e.g., Sentry)
3. Configure custom domain
4. Set up email notifications (Resend)
5. Enable rate limiting (Upstash Redis)
6. Set up file uploads (Cloudflare R2)

## Quick Deploy Button

Once your repo is public, you can add this to your README:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Vishai/RadiantClaims)

---

**Questions?** Check the [Vercel Next.js documentation](https://vercel.com/docs/frameworks/nextjs)
