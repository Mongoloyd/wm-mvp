# Quote Trust Model (Sprint 1)

## Purpose
This module introduces deterministic trust + anomaly scoring for post-scan quote quality decisions.

It answers whether a quote is safe to:
1. update future pricing index data,
2. feed future optimization events,
3. bypass manual review.

## Inputs
Weighted trust factors (all normalized `0..1`):
- OCR confidence
- completeness
- math consistency
- cohort fit
- scope consistency
- document validity
- identity strength

Additional hard-signal inputs:
- `isQuoteDocument`
- `documentType`
- `duplicateSuspected`
- `impossibleValuesDetected`
- anomaly inputs: quote amount, price per opening, deposit percent, cohort bands

## Outputs
`evaluateQuoteTrust()` returns:
- `trustScore` (`0..1`)
- `anomalyScore` (`0..1`)
- `anomalyStatus`: `safe | review | quarantine | reject`
- `manualReviewRequired`
- `approvedForIndex`
- `approvedForAds`
- `reasons[]`

## Status semantics
- `safe`
  - Can be approved for index + ads.
  - Manual review not required.
- `review`
  - Manual review queue required.
  - Blocked from index + ads.
- `quarantine`
  - High-risk mismatch/anomaly. Requires manual adjudication.
  - Blocked from index + ads.
- `reject`
  - Hard invalid case (e.g., non-quote doc, impossible values).
  - Blocked from index + ads.

## Hard rules implemented
- Non-quote documents force `reject`.
- Impossible values force `reject`.
- Severe math mismatch materially penalizes trust.
- Duplicate suspicion penalizes trust.
- Only `safe` can be approved for index/ads.

## Anomaly layer
`anomaly.ts` implements pure deterministic checks:
- robust z-score via median/MAD,
- IQR fence outlier scoring,
- business-rule checks (invalid deposit %, non-positive price values, percentile band breaches).

No DB calls, workers, queueing, or platform dispatch logic are included in this sprint.
