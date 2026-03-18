# Scanner Rubric & Scoring Logic

## 1. Canonical Purpose
The Scanner Brain is the core product logic for WindowMan.PRO.

Its job is to:
- normalize messy impact window / door quotes
- extract structured signals from uploaded files
- compute a deterministic Truth Grade
- identify red flags, omissions, and uncertainty
- generate a safe preview before verification
- generate a full Truth Report after verification

This is a forensic intelligence engine, not a vibes-based AI summary.

---

## 2. Canonical File Map
All core analysis logic should live in a centralized scanner-brain module, ideally:

`src/lib/scanner-brain/`

Recommended files:
- `schema.ts` — strict Zod schemas for extraction output and internal report payloads
- `rubric.ts` — weights, thresholds, severity tables, pillar definitions, hard caps
- `scoring.ts` — deterministic TypeScript math
- `forensic.ts` — red flag and omission detection logic
- `preview.ts` — safe preview / teaser payload generation
- `index.ts` — orchestration entrypoint

If the implementation is split differently, preserve the same separation of concerns.

---

## 3. Golden Rule
**AI extracts. TypeScript scores.**

### AI / OCR layer may:
- read PDF/image content
- extract text
- classify document type
- normalize extracted content into strict JSON
- identify candidate missing sections
- assign extraction confidence

### TypeScript layer must:
- compute pillar scores
- assign overall grade
- apply hard caps / hard fails
- assign red flags and severity
- produce preview payloads
- produce contractor-safe structured output

### Forbidden
Do not let the LLM decide:
- final grade
- pillar weights
- score math
- hard-fail logic
- severity thresholds

---

## 4. Document Validity Gate
Before normal scoring begins, classify the document.

### Valid document classes
- impact window quote
- impact door quote
- mixed window/door proposal
- related contractor estimate with clear fenestration scope

### Invalid / unsupported classes
- grocery receipts
- appliance quotes
- general invoices with no relevant fenestration scope
- unrelated home improvement paperwork
- unreadable image dumps

### Hard rule
If `document_is_window_door_related === false`, short-circuit the normal scoring flow.

In that case:
- do not run normal pillar scoring
- do not generate a normal Truth Grade
- do not generate contractor/homeowner action questions tied to code/permit/specs
- do not produce misleading cancellation-clause or technical-gap narratives

Instead return a controlled invalid-document result such as:
- `analysis_status = invalid_document`
- `preview_json.reason = "This file does not appear to be an impact window or door quote."`

---

## 5. Five Pillars
All valid window/door documents should be evaluated across these pillars:

1. **Safety & Code Match**
   - HVHZ / code relevance
   - DP rating presence
   - approval / compliance clarity
   - impact product clarity

2. **Install & Scope Clarity**
   - labor/install scope detail
   - permits
   - disposal/debris
   - opening count and type clarity
   - accessories / finish details

3. **Price Fairness**
   - current implemented logic: anomaly detection from extracted quote signals
   - future logic: county/zip benchmark comparison using a local pricing index

4. **Fine Print & Transparency**
   - unspecified products
   - vague scope
   - open-ended language
   - hidden-cost risk
   - financing / cancellation / legal ambiguity where actually applicable

5. **Warranty Value**
   - labor warranty
   - material/manufacturer warranty
   - transferability / exclusions where stated
   - warranty clarity vs vagueness

---

## 6. Current vs Planned Logic
Be honest about implementation state.

### Canonical Now
The current engine should score using:
- extracted structured fields
- deterministic weights
- hard-coded thresholds
- red-flag logic based on omissions and extracted signals

### Planned Next
Do not claim as implemented unless it truly exists in code:
- county-specific pricing benchmark engine
- zip-code pricing index
- sophisticated market-wide peer comparison
- contractor reputation graph scoring

If a feature is planned but not yet implemented, label it clearly as future logic.

---

## 7. Red Flag Rules
Missing data is risk.

### Principle
**Omission = Risk**

Do not leave critical fields blank in the UI without interpretation.

Examples:
- missing DP ratings → red flag
- missing product approval / NOA context → red flag
- missing permit responsibility → red flag
- unspecified brand/model → red flag
- unclear warranty scope → red flag
- vague installation scope → red flag

### Severity bands
Use consistent severity levels:
- Low
- Medium
- High
- Critical

Severity should be driven by deterministic rules, not narrative instinct.

---

## 8. Hard Caps / Hard Fails
Certain findings may cap or force the overall grade.

Examples may include:
- invalid document
- clearly non-impact product presented as impact
- major technical omissions
- extreme vagueness across multiple pillars

These rules must live in deterministic code and be documented in `rubric.ts`.

Do not apply hard caps to irrelevant document types after invalid-document classification has already failed the file.

---

## 9. Safe Preview Rules
Before Level 2 verification, generate a safe preview payload only.

### Preview may include
- proof-of-read
- page count
- estimated opening count bucket
- document type confidence
- grade band or rough quality band
- red flag count bucket
- limited locked preview UI data

### Preview must not include
- exact full pillar breakdown
- exact overpayment math
- full red flag narratives
- contractor-sensitive comparison output
- enough detail to reconstruct the final report

The preview should build trust and unlock intent without leaking the product.

---

## 10. Confidence and Uncertainty
All extraction results should carry confidence-aware interpretation.

### If OCR/extraction is weak
Use a controlled state such as:
- `needs_better_upload`
- `manual_review_pending`
- `low_confidence_extraction`
- `invalid_document`

### Rule
Do not convert uncertainty into fake precision.

If the file quality is poor, the system should say so.

---

## 11. Output Objects
At minimum the scanner-brain should support:

- `proof_of_read`
- `preview_json`
- `full_json`
- `confidence_score`
- `analysis_status`
- `rubric_version`
- `document_type`
- `document_is_window_door_related`

---

## 12. Testing Requirements
Any scoring/rubric change must preserve deterministic behavior.

### Required test types
1. **Baseline Fair Quote**
   - should score in expected healthy range

2. **Bad / Risky Quote**
   - should trigger expected red flags and lower grade

3. **Invalid Document**
   - should short-circuit and never produce normal quote grading

4. **Low Confidence Extraction**
   - should enter controlled fallback state

5. **Regression Tests**
   - changes to weights or hard caps must not silently break baseline scenarios

### Rule
No rubric change is complete without test coverage for:
- at least one valid good quote
- one valid bad quote
- one invalid document
