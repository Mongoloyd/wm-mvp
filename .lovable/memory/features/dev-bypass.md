Dev OCR bypass system for deterministic testing of the scoring pipeline.

## How it works
- `supabase/functions/scan-quote/index.ts` accepts `dev_extraction_override` + `dev_secret` in request body
- When `dev_secret` matches `DEV_BYPASS_SECRET` env var, skips Gemini OCR (steps 3-7)
- Feeds override directly into classification gate → scoring → flag detection → analyses upsert
- Produces identical DB records as a real scan

## Secrets
- `DEV_BYPASS_SECRET` — Supabase edge function secret (runtime)
- `VITE_DEV_BYPASS_SECRET` — in `.env` for client-side dev panel

## Fixtures
- 14 scenarios in `src/test/createMockQuote.ts` as `SCENARIO_FIXTURES`
- Each has a complete `ExtractionResult` + `expectedGrade` or `expectedTerminal`
- Scenarios: gradeA, gradeB, gradeC, gradeD, gradeF, mixedPillars, cornerCutting, overpaymentTrap, vagueScope, missingWarranty, finePrintTrap, insuranceSensitive, invalidDocument, lowConfidence

## Dev UI
- `src/components/dev/DevQuoteGenerator.tsx` — bypass mode + inline result inspector
- Shows actual vs expected grade, pillar statuses, flag counts
- "Run All Scenarios" button for batch testing

## ScanTheatrics grade fix
- `ScanTheatrics` now accepts `grade` prop (default "C")
- `Index.tsx` passes `analysisData?.grade` to ScanTheatrics
