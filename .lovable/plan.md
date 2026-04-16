

## Plan: Dynamic LP URL in AdminPartners

### Problem
Line 62 hardcodes `PRODUCTION_DOMAIN = "windowman.pro"` and line 203 builds the LP URL from it, so the "Copy" button always copies a production URL even in dev/preview environments.

### Change
In `src/pages/AdminPartners.tsx`:

1. **Remove** the `PRODUCTION_DOMAIN` constant (line 62).
2. **Update** line 203 to use `window.location.origin`:
   ```ts
   const lpUrl = slug ? `${window.location.origin}/lp/${slug}` : null;
   ```

This single change makes the copied URL always match the current environment (localhost, Lovable preview, production custom domain, etc.).

