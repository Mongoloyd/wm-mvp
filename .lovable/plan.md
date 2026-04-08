

## Admin & Partner Stabilization — Focused Refinement Plan

Most of the 10-phase work has already been completed across previous passes. This plan addresses the remaining gaps found during audit.

### What's Already Done (No Changes Needed)
- Admin `isLoading=false` — instant render ✓
- ActivePipeline search + status filter via `useMemo` ✓
- GhostRecovery search filter ✓
- ContractorOpportunitiesPage: `FORCE_PREVIEW_MODE`, filter tabs, county filter, light theme ✓
- PartnerDossier: canonical display state, intake intelligence, document vault 3-state, locked/unlocked contrast ✓
- PreviewModeBadge: inline header chip ✓

### Remaining Issues (3 items)

#### 1. LeadDossierSheet Width — Not at 48vw
Currently `sm:max-w-2xl` (672px / ~39% of 1728px). Needs ~48vw for a real operator workspace.

**Fix**: Change SheetContent className from `sm:max-w-2xl` to a custom width `sm:max-w-[48vw]`. Also update the base `sheet.tsx` right-side variant from `sm:max-w-sm` to `sm:max-w-[48vw]` won't work cleanly — instead override inline on LeadDossierSheet only.

**File**: `src/components/admin/LeadDossierSheet.tsx` line 259

#### 2. LeadDossierSheet Dark-Theme Remnants
The Call History section still uses dark-theme colors that look broken on the light admin background:
- `text-amber-400` → should be `text-amber-600`
- `bg-blue-500/20 text-blue-400` → `bg-blue-100 text-blue-700`
- `bg-purple-500/20 text-purple-400` → `bg-violet-100 text-violet-700`
- `bg-green-500/20 text-green-400` → `bg-emerald-100 text-emerald-700`
- `bg-amber-500/20 text-amber-400` → `bg-amber-100 text-amber-700`
- `bg-orange-500/20 text-orange-400` → `bg-orange-100 text-orange-700`
- `bg-black/20` (transcript bg) → `bg-muted`
- `bg-white/5` (skeleton) → `bg-muted`
- `bg-white/10` (count badge) → `bg-muted`
- Handoff button `text-amber-400 border-amber-500/40` → `text-amber-700 border-amber-300`
- Sent badge `bg-purple-500/20 text-purple-400 border-purple-500/30` → `bg-violet-100 text-violet-700 border-violet-200`

**File**: `src/components/admin/LeadDossierSheet.tsx` — scattered through lines 274-680

#### 3. Call History Section Title Light-Theme Fix
`text-amber-400` heading for "Call History" → `text-amber-600`

**File**: `src/components/admin/LeadDossierSheet.tsx` line 537

---

### Files to Modify
1. `src/components/admin/LeadDossierSheet.tsx` — widen to ~48vw, fix all dark-theme color remnants to light equivalents

### Files NOT Modified
- No backend/edge functions
- No auth/OTP
- No PartnerDossier (already complete)
- No ContractorOpportunitiesPage (already complete)
- No AdminDashboard (already complete)
- No PreviewModeBadge (already complete)

