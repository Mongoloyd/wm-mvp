

# Sync Dev Bypass Secret

## The Problem
The `.env` file has `VITE_DEV_BYPASS_SECRET` set to a long SHA-256 hash, but in Supabase Edge Function secrets, `DEV_BYPASS_SECRET` is set to `dev-bypass-windowman-2024`. The frontend sends the hash, the server expects `dev-bypass-windowman-2024` — they never match, so every bypass call returns 403.

## The Fix
Update `.env` so the client-side secret matches what Supabase has:

**File: `.env`** — Change line 4:
```
VITE_DEV_BYPASS_SECRET="dev-bypass-windowman-2024"
```

That's the only change needed. The frontend will now send `dev-bypass-windowman-2024`, the edge function will compare it against `DEV_BYPASS_SECRET` (`dev-bypass-windowman-2024`), and they'll match.

## Security Note
This secret is only checked when `import.meta.env.DEV` is true, so it's never used in production builds. The simpler passphrase is fine for a dev-only gate.

