

# Clean Up: Delete Outdated Documentation Files

## Keep
- `README.md` — standard project readme
- `AGENTS.md` — active project knowledge (mirrored in custom instructions)
- `.lovable/` — Lovable system memory files (managed automatically)
- `components.json` — shadcn/ui config (not documentation)

## Delete — Root (18 files)
| File | Reason |
|------|--------|
| `AUDIT_NOTES.md` | Stale audit artifact |
| `AUDIT_REPORT.md` | Stale audit artifact |
| `DOUBLE_OTP_DIAGNOSTIC_REPORT.md` | OTP debugging — resolved |
| `FIX_VERIFICATION.md` | One-time verification log |
| `OTP_MAGNUM_OPUS_AUDIT.md` | OTP debugging — resolved |
| `OTP_MAGNUM_OPUS_REPORT.md` | OTP debugging — resolved |
| `OTP_REPAIR_PASS.md` | OTP debugging — resolved |
| `OTP_ROOT_CAUSE.md` | OTP debugging — resolved |
| `OTP_TIMING_ANALYSIS.md` | OTP debugging — resolved |
| `OTP_TOGGLE_BUG_AUDIT.md` | OTP debugging — resolved |
| `POST_MIGRATION_BUG_AUDIT.md` | Migration complete |
| `SECURITY_GAP_AND_FB_FUNNEL.md` | Outdated planning doc |
| `STRATEGIC_ASSESSMENT.md` | Outdated planning doc |
| `SUPABASE_MIGRATION_AUDIT.md` | Migration complete |
| `TEST_FINDINGS.md` | Stale test artifact |
| `TEST_LOG.md` | Stale test artifact |
| `TRUSTED_DEVICE_OTP_PLAN.md` | OTP planning — resolved |
| `implementation_plan.md` | Superseded by code |
| `todo.md` | Superseded by code |

## Delete — docs/ folder (9 files, then remove the directory)
| File | Reason |
|------|--------|
| `docs/facebook-conversion-architecture.md` | Architecture doc |
| `docs/funnel-events.md` | Planning doc |
| `docs/phase-3-4a-inspection.md` | Phase complete |
| `docs/pre-test-trust-audit.md` | Stale audit |
| `docs/preview-payload-quality-audit.md` | Stale audit |
| `docs/routes-and-states.md` | Planning doc |
| `docs/scanner-rubric.md` | Rubric lives in code |
| `docs/security-model.md` | Planning doc |
| `docs/verification-notes.txt` | Stale notes |

## Delete — GitHub agents
| File | Reason |
|------|--------|
| `.github/agents/ocr-audit-specialist.agent.md` | Unused agent config |

## Total: 28 files deleted, `docs/` and `.github/agents/` directories removed

## What stays as source of truth
- TypeScript source files (`src/`, `supabase/functions/`)
- `.lovable/memory/` (Lovable's own context system)
- `AGENTS.md` and `README.md`

