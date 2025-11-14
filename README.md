# RadiantClaims

A modern, full-stack RECA claims preparation platform built with Next.js 14, TypeScript, and PostgreSQL.

## 📚 Documentation

**New developers start here:**
1. **[QUICK_START.md](./QUICK_START.md)** - Get up and running quickly ⚡
2. **[DATABASE_SAFETY_GUIDE.md](./DATABASE_SAFETY_GUIDE.md)** - 🔒 Protect production data
3. **[PROJECT_STATUS.md](./PROJECT_STATUS.md)** - Current state & features
4. **[TODO.md](./TODO.md)** - What to work on next
5. **[DOCS_INDEX.md](./DOCS_INDEX.md)** - Complete documentation guide

**Essential Guides:**
- 🔒 **[Database Safety Guide](./DATABASE_SAFETY_GUIDE.md)** - Never touch production accidentally
- ⚡ **[Quick Start](./QUICK_START.md)** - Fast setup guide
- [PDF Form Progress](./docs/PROJECT_PROGRESS_TRACKER.md)
- [Test Credentials](./TEST_CREDENTIALS.md)
- [Email Setup](./EMAIL_INTEGRATION.md)
- [Operations Guide](./docs/OPERATIONS_GUIDE.md)

## Tech Stack

- **Framework**: Next.js 14+ (App Router) with TypeScript (strict mode)
- **Styling**: Tailwind CSS + shadcn/ui (Radix primitives)
- **Forms**: React Hook Form + Zod validation
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: NextAuth.js with credentials provider
- **Storage**: S3-compatible (Cloudflare R2) via AWS SDK v3
- **Email**: Resend (configured but optional)
- **Dev Tools**: ESLint, Prettier, Husky, pnpm

## Features

### Core Platform (100% Complete)
- ✅ Multi-step intake flow with save/resume
- ✅ Document upload system (Cloudflare R2)
- ✅ Customer, Admin, and Attorney portals
- ✅ NextAuth authentication with role-based access
- ✅ Email system (Resend integration)

### AI-Powered Intelligence (95% Complete)
- ✅ OCR with pdfjs-dist + Tesseract
- ✅ AI document categorization (GPT-4o-mini)
- ✅ Entity extraction & compliance checking
- ✅ 7 specialized validation agents
- ✅ Intelligence modal with 7 tabs
- ⏳ Real-world testing needed

### PDF Form Filling (35% Complete)
- ✅ Form filler architecture
- ✅ Parts 1-3 mapped
- ⏳ Parts 8, 10, 16 needed for beta (3 hrs)
- ⏳ Remaining parts for full coverage (6-7 hrs)

### Resource Finder (100% Complete)
- ✅ Search for vital records offices
- ✅ 5 covered states (UT, NV, AZ, ID, NM)
- ✅ Filterable by county/document type

**Current Status:** 85-90% complete, 6-8 hours from beta launch
**See:** [PROJECT_STATUS.md](./PROJECT_STATUS.md) for details

## Getting Started

### Prerequisites

- Node.js 20.x (LTS) - specified in `.nvmrc`
- pnpm 8.x or higher
- PostgreSQL database (we recommend Railway)

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd RadiantClaims
```

2. **Install dependencies**

```bash
pnpm install
```

3. **Set up environment variables**

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

**Required variables:**

- `DATABASE_URL`: Your PostgreSQL connection string
- `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
- `NEXTAUTH_URL`: Your app URL (http://localhost:3000 for development)

**Optional variables:**

- `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_ENDPOINT`, `R2_BUCKET`: For Cloudflare R2 uploads
- `RESEND_API_KEY`: For email notifications

### Database Setup

4. **Configure local development database**

Create `.env.local` for your local development database:

```bash
# .env.local - automatically loaded in development
DATABASE_URL="postgresql://yourusername@localhost:5432/radiantclaims_dev"
```

This ensures you **always use your local dev database** and never accidentally touch production.

**🔒 Database Safety:** See [DATABASE_SAFETY_GUIDE.md](./DATABASE_SAFETY_GUIDE.md) for complete protection details.

5. **Generate Prisma client**

```bash
pnpm db:generate
```

6. **Run database migrations**

```bash
pnpm db:migrate
```

Or for quick development (pushes schema without migrations):

```bash
pnpm db:push
```

7. **Seed the database**

This creates an admin user, sample referral, and demo claimant:

```bash
pnpm db:seed
```

**Default admin credentials:**
- Email: `admin@radiantclaims.dev`
- Password: `Passw0rd!`

**Change these credentials in production!**

### Development

8. **Start the development server**

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Available Scripts

#### Development & Build
- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm format` - Format code with Prettier
- `pnpm typecheck` - Run TypeScript compiler check

#### Database Commands (Protected)
- `pnpm db:check` - ✅ Verify which database you're connected to
- `pnpm db:generate` - Generate Prisma client
- `pnpm db:push` - Push schema to database (includes safety check)
- `pnpm db:migrate` - Create and run migrations (includes safety check)
- `pnpm db:seed` - Seed database with sample data (includes safety check)
- `pnpm db:studio` - Open Prisma Studio (includes safety check)
- `pnpm db:reset` - Reset database - ⚠️ destructive (includes safety check)

**All database commands automatically verify you're on development before running!**

### 🔒 Database Safety Features

**Never accidentally touch production data!** All database commands include automatic safety checks:

```bash
# Before any database operation:
pnpm db:check  # Shows which database you're connected to

# All these commands check environment first:
pnpm db:push      # ✅ Blocked if on production
pnpm db:migrate   # ✅ Blocked if on production
pnpm db:studio    # ✅ Blocked if on production
```

**Quick Safety Check:**
```bash
pnpm db:check
```

You'll see:
- ✅ **DEVELOPMENT DATABASE** = Safe to work (localhost)
- 🚨 **PRODUCTION DATABASE** = Commands will abort

**Complete safety documentation:** [DATABASE_SAFETY_GUIDE.md](./DATABASE_SAFETY_GUIDE.md)

## Project Structure

```
RadiantClaims/
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Database seed script
├── src/
│   ├── app/               # Next.js App Router pages
│   │   ├── api/           # API routes
│   │   ├── dashboard/     # Protected admin pages
│   │   ├── intake/        # Public intake flow
│   │   ├── login/         # Login page
│   │   ├── layout.tsx     # Root layout
│   │   └── page.tsx       # Homepage
│   ├── components/        # React components
│   │   └── ui/            # shadcn/ui components
│   ├── lib/               # Utilities
│   │   ├── auth.ts        # NextAuth configuration
│   │   ├── db.ts          # Prisma client
│   │   ├── r2.ts          # R2/S3 utilities
│   │   ├── resend.ts      # Email utilities
│   │   ├── utils.ts       # General utilities
│   │   └── validations/   # Zod schemas
│   ├── types/             # TypeScript type definitions
│   └── env.mjs            # Environment variable validation
├── .env.example           # Environment template
├── .eslintrc.json         # ESLint configuration
├── .prettierrc            # Prettier configuration
├── components.json        # shadcn/ui configuration
├── next.config.mjs        # Next.js configuration
├── tailwind.config.ts     # Tailwind CSS configuration
└── tsconfig.json          # TypeScript configuration
```

## Application Pages

### Public Routes

- `/` - Marketing homepage with CTA to start intake
- `/intake` - Claimant information form
- `/intake/upload` - Document upload page
- `/login` - Admin login

### Protected Routes (Requires Authentication)

- `/dashboard` - Claimant list with search and filtering
- `/dashboard/claimants/[id]` - Claimant detail page with documents

## API Routes

- `POST /api/claimants` - Create a new claimant
- `GET /api/claimants` - List claimants (paginated, searchable)
- `GET /api/claimants/[id]` - Get claimant details
- `POST /api/documents` - Create document record
- `POST /api/upload` - Generate presigned upload URL
- `POST /api/referrals/check` - Validate referral code

## Database Setup with Railway

Railway provides managed PostgreSQL with easy setup:

1. Create a Railway account at [railway.app](https://railway.app)
2. Create a new project
3. Add a PostgreSQL database
4. Copy the `DATABASE_URL` from Railway to your `.env` file
5. Run migrations: `pnpm db:migrate`

## Cloudflare R2 Setup

To enable real file uploads (currently using mock URLs):

1. **Create R2 bucket** in Cloudflare dashboard
2. **Generate API tokens** with R2 read/write permissions
3. **Update `.env`** with your R2 credentials:
   ```
   R2_ACCESS_KEY_ID=your-access-key
   R2_SECRET_ACCESS_KEY=your-secret-key
   R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
   R2_BUCKET=your-bucket-name
   ```

The upload flow is already wired in `src/lib/r2.ts` and `src/app/api/upload/route.ts`. Once credentials are set, presigned URLs will work automatically.

**Current behavior without R2 configured:**
- Upload endpoints return mock presigned URLs
- Documents are tracked in the database but files aren't actually stored
- Perfect for development and testing

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

Vercel will automatically:
- Build your Next.js application
- Set up preview deployments for PRs
- Handle serverless functions

### Cloudflare Pages

For optimal integration with R2:

1. Configure `wrangler.toml` for Cloudflare Pages
2. Set environment variables in Cloudflare dashboard
3. Connect your GitHub repository
4. Deploy

**Note:** Ensure `DATABASE_URL` points to a publicly accessible PostgreSQL instance.

## Environment Variables Summary

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Yes | Secret for NextAuth.js session encryption |
| `NEXTAUTH_URL` | Yes | Base URL of your application |
| `R2_ACCESS_KEY_ID` | No | Cloudflare R2 access key |
| `R2_SECRET_ACCESS_KEY` | No | Cloudflare R2 secret key |
| `R2_ENDPOINT` | No | Cloudflare R2 endpoint URL |
| `R2_BUCKET` | No | R2 bucket name |
| `RESEND_API_KEY` | No | Resend API key for emails |

## Security Notes

### 🔒 Database Security (Critical)

**We have multiple layers of protection to prevent production data accidents:**

1. **Environment Isolation**
   - `.env.local` → Development database (localhost)
   - Railway → Production database (auto-injected, never stored locally)

2. **Automatic Safety Checks**
   - All `pnpm db:*` commands verify environment before running
   - Production access is **blocked by default**
   - Commands abort with error if you're on production

3. **How to Check Environment**
   ```bash
   pnpm db:check
   ```
   Shows: Database name, user, environment (dev/prod), and record counts

4. **Production Access** (rare, explicit)
   ```bash
   railway run npx prisma studio  # Explicitly use Railway
   ```

**See [DATABASE_SAFETY_GUIDE.md](./DATABASE_SAFETY_GUIDE.md) for complete details.**

### General Security

1. **Change default admin credentials** after first login
2. **Generate strong `NEXTAUTH_SECRET`** for production
3. **Use environment variables** for all secrets
4. **Enable HTTPS** in production
5. **Review CORS settings** if integrating with external services
6. **Never commit** `.env`, `.env.local`, or `.env.production` files

## Development Tips

- 🔒 **Always run `pnpm db:check`** before database operations to verify environment
- Use `pnpm db:studio` to browse database with Prisma Studio (auto-checks environment)
- Pre-commit hooks run linting and formatting automatically
- Type errors will prevent builds - fix them before deploying
- Check `src/env.mjs` for environment variable validation errors
- **Never commit `.env.local` or `.env.production`** - they're gitignored for security

## Extending the Application

### Adding a new Prisma model

1. Update `prisma/schema.prisma`
2. Run `pnpm db:migrate` to create migration
3. Run `pnpm db:generate` to update Prisma client
4. Types are automatically generated

### Adding a new API route

Create a file in `src/app/api/[route-name]/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  return NextResponse.json({ message: "Hello" });
}
```

### Adding a new page

Create a file in `src/app/[page-name]/page.tsx`:

```typescript
export default function MyPage() {
  return <div>My Page</div>;
}
```

## Documentation

### 📚 Complete Documentation Hub
**[docs/INDEX.md](./docs/INDEX.md)** - Central documentation index with quick links

### Key Documentation Files
- **[Operations Guide](./docs/OPERATIONS_GUIDE.md)** ⭐ - Configuration updates, maintenance, deployment procedures
- **[RECA Implementation Status](./docs/RECA_IMPLEMENTATION_STATUS.md)** - Development progress tracker
- **[Attorney Info Configuration](./src/lib/reca/ATTORNEY_INFO_README.md)** - How to update partner attorney information
- **[API Specifications](./docs/parsed_form_data/API_SPECIFICATIONS.md)** - RECA workflow API documentation

### Quick Links by Role
- **Developers**: Start with this README, then check [RECA Implementation Status](./docs/RECA_IMPLEMENTATION_STATUS.md)
- **Operations**: See [Operations Guide](./docs/OPERATIONS_GUIDE.md) for all maintenance tasks
- **Legal/Compliance**: Review [Attorney Configuration](./src/lib/reca/ATTORNEY_INFO_README.md)

## Support

For issues or questions:
- Check the [Documentation Index](./docs/INDEX.md) for comprehensive guides
- Review the [Operations Guide](./docs/OPERATIONS_GUIDE.md) for common tasks and troubleshooting
- Consult external docs: [Next.js](https://nextjs.org/docs), [Prisma](https://www.prisma.io/docs), [shadcn/ui](https://ui.shadcn.com)

## License

This project is private and proprietary to RadiantClaims.
