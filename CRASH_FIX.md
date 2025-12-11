# Fix for "Cannot find module './vendor-chunks/zod@3.25.76.js'" Error

## Problem
After successful user registration, the app crashes with:
```
Error: Cannot find module './vendor-chunks/zod@3.25.76.js'
```

This occurs when NextAuth tries to create a session after registration.

## Root Cause
Next.js 14 webpack bundler creates vendor chunks for frequently used packages like Zod. 
In development mode, hot module replacement can sometimes cause these chunk references to become stale.

## Solution Applied

### 1. Updated `next.config.mjs`
Added webpack optimization to use named module IDs instead of hashed IDs:

```javascript
webpack: (config, { isServer }) => {
  // ... existing config ...
  
  // Fix for zod vendor chunk resolution issues in dev mode
  config.optimization = config.optimization || {};
  config.optimization.moduleIds = 'named';
  
  return config;
}
```

### 2. Cleared Caches
- Removed `.next` directory
- Removed `node_modules/.cache`
- Reinstalled dependencies

## When This Error Occurs Again

If you encounter this error in the future, run:

```bash
# Quick fix (usually works)
rm -rf .next && npm run dev

# Deep fix (if quick fix doesn't work)
rm -rf .next node_modules/.cache
pnpm install
npm run dev
```

## Prevention

This error typically happens when:
1. Installing new packages while dev server is running
2. Switching git branches with different dependencies
3. Hot reload fails after major code changes

**Best Practice**: Restart dev server after installing packages or switching branches.

## Status
✅ Fixed - Build successful
✅ Webpack config updated
✅ Caches cleared
