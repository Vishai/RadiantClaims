# RadiantClaims - Setup Checklist

Follow these steps to get RadiantClaims running locally.

## Prerequisites Checklist

- [ ] Node.js 20.x installed (check with `node --version`)
- [ ] pnpm installed (check with `pnpm --version`)
- [ ] PostgreSQL database ready (Railway, local, or other provider)
- [ ] Code editor (VS Code recommended)

## Setup Commands

Run these commands in order:

### 1. Install Dependencies

```bash
pnpm install
```

This installs all required npm packages.

### 2. Generate Prisma Client

```bash
pnpm dlx prisma generate
```

This generates the TypeScript types for your database models.

### 3. Set Up Environment Variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

Edit `.env` and set at minimum:

```env
DATABASE_URL="postgresql://user:password@host:port/database"
NEXTAUTH_SECRET="run: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"
```

### 4. Run Database Migrations

```bash
pnpm db:migrate
```

This creates all database tables based on the Prisma schema.

Alternatively, for quick development:

```bash
pnpm db:push
```

### 5. Seed the Database

```bash
pnpm db:seed
```

This creates:
- Admin user: `admin@radiantclaims.dev` / `Passw0rd!`
- Sample referral code: `DEMO2024`
- Demo claimant: Jane Doe

### 6. Start Development Server

```bash
pnpm dev
```

The app will be available at [http://localhost:3000](http://localhost:3000)

## Verify Installation

- [ ] Homepage loads at http://localhost:3000
- [ ] Can navigate to http://localhost:3000/intake
- [ ] Can log in at http://localhost:3000/login with admin credentials
- [ ] Dashboard shows demo claimant data

## Optional Setup

### Husky Git Hooks

Initialize Husky for pre-commit linting:

```bash
pnpm prepare
chmod +x .husky/pre-commit
```

### Prisma Studio

View and edit database data with a GUI:

```bash
pnpm db:studio
```

Opens at http://localhost:5555

### Cloudflare R2 (for real file uploads)

Add to `.env`:

```env
R2_ACCESS_KEY_ID="your-access-key"
R2_SECRET_ACCESS_KEY="your-secret-key"
R2_ENDPOINT="https://account-id.r2.cloudflarestorage.com"
R2_BUCKET="your-bucket-name"
```

### Resend Email Service

Add to `.env`:

```env
RESEND_API_KEY="re_your_api_key"
```

## Troubleshooting

### "Cannot find module @prisma/client"

Run: `pnpm db:generate`

### Database connection errors

- Check `DATABASE_URL` is correct
- Verify database is running and accessible
- Ensure database exists (create it if needed)

### Type errors during build

Run: `pnpm typecheck` to see all TypeScript errors

### Port 3000 already in use

Either stop the other process or change the port:

```bash
PORT=3001 pnpm dev
```

## Next Steps

1. Change the default admin password
2. Explore the code in `src/app`
3. Review the Prisma schema in `prisma/schema.prisma`
4. Test the intake flow from the homepage
5. Check the admin dashboard

## Production Deployment

Before deploying to production:

- [ ] Change `NEXTAUTH_SECRET` to a strong random value
- [ ] Update admin credentials
- [ ] Set up production DATABASE_URL
- [ ] Configure R2 for file uploads
- [ ] Set `NEXTAUTH_URL` to your production domain
- [ ] Review security settings in `src/middleware.ts`
- [ ] Test all functionality end-to-end

## Support

Refer to `README.md` for detailed documentation and troubleshooting.
