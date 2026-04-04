

# P5 — Dossier Unification

## Why P5 and Why This

P4 built the Truth Engine Audit panel inside `LeadDossierSheet.tsx`. But during verification we found it only renders in the **Dialer Desk** tab. The **Active Pipeline** tab still opens the lightweight `LeadProfileSheet` — a simpler slide-out with no analysis data, no pillar cards, no flags. This means operators using the Pipeline tab (the default workflow for scanning new leads) never see the intelligence P4 built.

P5 closes that gap: replace `LeadProfileSheet` with `LeadDossierSheet` in the Active Pipeline tab so every lead click, in every tab, opens the full intelligence dossier.

## Current State

```text
Tab              Click a lead →    Component              Has Truth Engine?
─────────────    ──────────────    ─────────────────────  ─────────────────
Active Pipeline  Row click         LeadProfileSheet       No
Dialer Desk      Row click         LeadDossierSheet       Yes (P4)
Ghost Recovery   No click handler  —                      —
```

## What Changes

### File: `src/components/admin/ActivePipeline.tsx`

1. Replace `LeadProfileSheet` import with `LeadDossierSheet`
2. Replace the `<Sheet>` + `<LeadProfileSheet>` block with `<LeadDossierSheet open={…} onOpenChange={…} lead={…} />`
3. Remove the local `leadEvents` / `eventsLoading` state and the `handleRowClick` async event-fetching logic — `LeadDossierSheet` handles its own data fetching internally
4. Remove the `onFetchLeadEvents` prop from the component interface (no longer needed)

### File: `src/components/AdminDashboard.tsx`

1. Remove `fetchLeadEvents` import (no longer passed to ActivePipeline)
2. Remove `handleFetchLeadEvents` callback
3. Remove `onFetchLeadEvents` prop from `<ActivePipeline>`

### File: `src/components/admin/LeadProfileSheet.tsx`

Leave in place for now (no deletion) — it may be useful as a lightweight fallback later.

## Scope

- 2 files modified (`ActivePipeline.tsx`, `AdminDashboard.tsx`)
- 0 files deleted
- No backend changes, no schema changes, no new queries
- LeadDossierSheet already fetches its own analysis data via `fetchLeadAnalysis` when opened

## Result

```text
Tab              Click a lead →    Component              Has Truth Engine?
─────────────    ──────────────    ─────────────────────  ─────────────────
Active Pipeline  Row click         LeadDossierSheet       Yes
Dialer Desk      Row click         LeadDossierSheet       Yes
Ghost Recovery   (future P6)       —                      —
```

Every operator path now surfaces the same forensic intelligence panel.

