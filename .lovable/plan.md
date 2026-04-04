

# Fix: "Failed to fetch dynamically imported module: Index.tsx"

## Investigation Results

I performed a deep audit of every import in `src/pages/Index.tsx` and its child components. **There are zero references to old admin components or deleted marketplace files.** The Index module graph is completely clean:

- All 25+ component imports resolve to existing files
- No imports reference `@/components/admin/*`, `ContractorMatch`, or any legacy dashboard modules
- The only "marketplace" mention is a harmless comment on line 15: `// ContractorMatch removed`
- `useCurrentUserRole` does not appear anywhere in the Index tree

## Root Cause

The error is **not a broken import path**. It is a Vite dynamic chunk-fetch failure caused by the preview environment's WebSocket/HMR proxy mismatch. When AuthGuard redirects from `/admin` to `/`, the browser tries to fetch the lazily-loaded `Index.tsx` chunk via a stale or misconfigured HMR connection, and the fetch rejects.

Cache-bust comments cannot fix this because the issue is at the transport layer, not the module graph.

## Fix Plan

### Step 1: Convert Index to a static import in App.tsx
The home route (`/`) is the most critical page and should never fail to load. Change it from `lazy()` to a direct import:

**File: `src/App.tsx`**
- Line 12: Change `const Index = lazy(() => import("./pages/Index.tsx"));` to `import Index from "./pages/Index";`
- This eliminates the dynamic chunk fetch entirely for the home route
- All other routes remain lazy-loaded (they are secondary pages)

### Step 2: Remove stale cache-bust comment from Index.tsx
**File: `src/pages/Index.tsx`**
- Line 1: Delete `// cache-bust-v2` (no longer needed, adds confusion)

### Step 3: Add a route-level error boundary
Wrap the `<Suspense>` in App.tsx with an error boundary so that if any other lazy route fails to load, the user sees a retry button instead of a white screen.

**File: `src/App.tsx`**
- Add a small `RouteErrorBoundary` component that catches chunk-load errors and shows "Something went wrong. Click to reload."
- Wrap `<Suspense fallback={<PageLoader />}>` with this boundary

### Acceptance Criteria
- Navigating to `/` always renders the homepage (no dynamic import involved)
- Navigating to `/admin` without auth redirects to `/` without a white screen
- Other lazy routes (`/about`, `/faq`, etc.) still load normally
- If a lazy route fails, the error boundary shows a retry UI instead of a blank page

