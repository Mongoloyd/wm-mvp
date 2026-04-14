# Quote Trust Model

## Inputs
Trust score uses weighted deterministic inputs (0..1 each):
- OCR confidence
- completeness
- math consistency
- cohort fit
- scope consistency
- document validity
- identity strength

## Outputs
- `trustScore` (0..1)
- `anomalyScore` (0..1)
- `anomalyStatus` (`safe | review | quarantine | reject`)
- `manualReviewRequired`
- `approvedForIndex`
- `approvedForAds`
- `reasons[]`

## Hard guards
- Non-window/door quotes are forced to `reject`.
- Impossible values (<= 0 totals or flagged impossible values) force reject.
- `review`, `quarantine`, and `reject` are logged but not dispatched to Meta/Google.

## Routing thresholds
- `safe`: trust >= 0.6 and anomaly < 0.4
- `review`: trust < 0.6 or anomaly >= 0.4
- `quarantine`: trust < 0.45 or anomaly >= 0.65
- `reject`: trust < 0.25 or anomaly >= 0.8 or hard-guard triggers
