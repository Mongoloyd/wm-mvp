# Lovable Preflight Audit Checklist
**Purpose:** Verify that Preflight Phases 1–5 produced the intended architecture in the live repo  
**Scope:** `Mongoloyd/wm-mvp` only  
**Mode:** Audit only — no code changes  
**Use after:** completion of Preflight Phase 5

---

## 1. What this checklist audits

This checklist verifies the five preflight phases in order:

1. **Preflight Phase 1** — repo-truth audit
2. **Preflight Phase 2** — DB / RLS / typegen hardening
3. **Preflight Phase 3** — service-layer extraction
4. **Preflight Phase 4** — reveal-state governance
5. **Preflight Phase 5** — event ownership governance

The purpose is not to reward “partial progress.”
The purpose is to verify whether the repo now has the intended shape.

---

## 2. Audit rules

### Rule A — Repo is ground truth
Audit the live repo only.
Do not trust older planning docs over current code.

### Rule B — No code changes
This is an audit pass only.
No implementation, no cleanup, no follow-up refactors.

### Rule C — Score what exists
Each phase must be evaluated against:
- structural success
- scope discipline
- behavioral safety
- repo-truth clarity
- future leverage

### Rule D — Fail clearly
If a phase is incomplete, say so directly.
Do not call a phase “done” if only the spirit of the phase was achieved.

---

## 3. What success looks like for each phase

## Phase 1 — Repo-Truth Audit
### Success shape
- one clear audit of the current repo exists
- canonical scanner / OTP / report path is identified correctly
- live structural gaps were identified with file-level evidence
- no fantasy architecture remains in the audit layer

### Must be true
- scores exist for major categories
- top repo-truth risks were identified
- conclusions are grounded in current files, not stale assumptions

### Fail signs
- vague audit
- old docs treated as truth
- no file-level evidence
- missing top-gap prioritization

---

## Phase 2 — DB / RLS / Typegen Hardening
### Success shape
- DB access model is explicit
- type generation workflow is reproducible
- FK truth is documented honestly
- row-history / audit strategy is explicit
- docs match current backend/config reality

### Must be true
- no mystery zero-policy RLS tables remain
- package scripts exist for type generation/checking
- there is a typegen workflow doc
- FK reality is confirmed or deferred honestly
- DB preflight status is documented

### Fail signs
- RLS was opened too broadly
- type generation is still tribal knowledge
- FK claims are aspirational
- docs still contradict config or schema reality

---

## Phase 3 — Service-Layer Extraction
### Success shape
- hooks no longer own raw Supabase transport on the canonical scanner path
- typed service modules own transport and response normalization
- hooks now act as orchestration/state adapters only
- runtime behavior is unchanged

### Must be true
- `useAnalysisData` does not directly own raw transport
- `usePhonePipeline` does not directly own raw transport
- typed services exist for report access and phone verification
- preview-before-full, retry, resume, and cooldown behavior remain intact

### Fail signs
- hooks still parse raw transport results
- services are thin wrappers but hooks still do real transport work
- product behavior changed during refactor
- unrelated files were refactored

---

## Phase 4 — Reveal-State Governance
### Success shape
- one canonical reveal/access-state model governs the live scanner / OTP / report path
- one orchestrator decides reveal/lock/loading/failure rendering
- report renderer is presentational, not access-authoritative
- edge cases are handled deterministically

### Must be true
- reveal-state derivation exists
- canonical post-scan orchestrator branches from that derivation
- access logic is not split across sibling components
- preview-before-full and verify-to-reveal remain intact

### Fail signs
- report component still guesses access state
- lock/reveal logic still exists in multiple layers
- OTP state interpretation is duplicated
- terminal/failure states are still ambiguous

---

## Phase 5 — Event Ownership Governance
### Success shape
- one business-event lane exists for the canonical scanner / OTP / report path
- one operational telemetry lane exists
- each business moment fires once from one owner
- event ownership is documented
- GTM/CAPI rollout is explicitly deferred, not half-started

### Must be true
- `trackConversion.ts` is clearly the business-event lane
- `trackEvent.ts` is clearly telemetry only
- duplicate business-event firing was removed on the canonical path
- one ownership doc exists for event ownership on that path

### Fail signs
- both tracking files still claim canonical ownership
- business events still fire from multiple layers
- telemetry and conversion tracking are conceptually mixed
- GTM or CAPI rollout partially leaked into this phase

---

## 4. Scoring rubric for each phase

Each phase is scored 0–5 across five dimensions:

### A. Structural success
Did the repo actually gain the intended architecture?

### B. Scope discipline
Did the implementation stay inside the prompt?

### C. Behavioral safety
Did it preserve product behavior?

### D. Repo-truth clarity
Is the result explicit and understandable in code/docs?

### E. Future leverage
Does it make the next phase safer and easier?

**Phase score = total / 25**

Interpretation:
- **22–25** = complete
- **18–21** = mostly successful, minor drift
- **14–17** = partial, important gaps remain
- **0–13** = failed / requires redo

---

## 5. Final proceed / stop rule

### Proceed only if:
- every phase scores at least **18/25**
- no phase has a structural failure
- no protected product behavior was changed
- no phase created new architectural contradictions

### Stop if:
- any phase scores below **18/25**
- any phase changed product behavior unintentionally
- any phase introduced drift that weakens future phases
- event ownership or reveal-state ownership is still ambiguous

---

## 6. Operator use

Run this audit only after Preflight Phase 5 is complete.

Then decide:
- **Accept and move into strategic arcs**
- or
- **Run one targeted corrective mini-phase before proceeding**
