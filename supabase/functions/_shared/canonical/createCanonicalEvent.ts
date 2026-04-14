import { CANONICAL_MODEL_VERSION, CANONICAL_SCHEMA_VERSION } from "./constants.ts";
import { computeAnomalyScore, routeQuoteTrust } from "./anomaly.ts";
import { buildIdentityHashes, computeIdentityQuality, normalizeIdentity } from "./identity.ts";
import type { CreateCanonicalEventInput, WMAnomalyStatus, WMCanonicalEvent, WMPlatformName } from "./types.ts";
import { computeOptimizationValue } from "./valueModel.ts";
import { computeTrustScore } from "./trustScore.ts";

export interface CanonicalInsertResult {
  event: WMCanonicalEvent;
  enqueuedPlatforms: WMPlatformName[];
}

function isQuoteRelated(input: CreateCanonicalEventInput): boolean {
  return Boolean(input.quote?.analysisId || input.quote?.scanSessionId || input.eventName === "quote_validation_passed");
}

function shouldDispatchToPlatform(shouldSend: boolean, anomalyStatus: WMAnomalyStatus | undefined): boolean {
  return shouldSend && anomalyStatus === "safe";
}

export async function createCanonicalEvent(
  supabase: any,
  input: CreateCanonicalEventInput,
): Promise<CanonicalInsertResult> {
  const eventId = input.eventId || `wm_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
  const occurredAt = input.occurredAt || new Date().toISOString();
  const identity = normalizeIdentity(input.identity || {});
  const identityHashes = await buildIdentityHashes(identity);
  const identityQuality = computeIdentityQuality(identity);

  const trustScore = computeTrustScore({ quote: input.quote, identityQuality });
  const anomalyScore = computeAnomalyScore(input.quote);
  const trust = routeQuoteTrust(trustScore, anomalyScore, input.quote);

  const optimization = {
    currency: "USD" as const,
    value: computeOptimizationValue(input.eventName),
    shouldSendMeta: Boolean(input.shouldSendMeta ?? trust.approvedForAds),
    shouldSendGoogle: Boolean(input.shouldSendGoogle ?? trust.approvedForAds),
  };

  const event: WMCanonicalEvent = {
    eventId,
    eventName: input.eventName,
    occurredAt,
    schemaVersion: input.schemaVersion || CANONICAL_SCHEMA_VERSION,
    modelVersion: input.modelVersion || CANONICAL_MODEL_VERSION,
    identity,
    identityHashes,
    identityQuality,
    journey: input.journey || {},
    quote: input.quote,
    analytics: input.analytics,
    optimization,
    trust,
    rawPayload: input.rawPayload,
  };

  const { error: eventErr } = await supabase.from("wm_event_log").insert({
    event_id: event.eventId,
    event_name: event.eventName,
    occurred_at: event.occurredAt,
    lead_id: event.identity.leadId || null,
    scan_session_id: event.quote?.scanSessionId || null,
    analysis_id: event.quote?.analysisId || null,
    quote_file_id: event.quote?.quoteFileId || null,
    schema_version: event.schemaVersion,
    model_version: event.modelVersion,
    trust_score: event.trust?.trustScore ?? null,
    anomaly_score: event.trust?.anomalyScore ?? null,
    anomaly_status: event.trust?.anomalyStatus ?? null,
    manual_review_required: event.trust?.manualReviewRequired ?? false,
    approved_for_index: event.trust?.approvedForIndex ?? false,
    approved_for_ads: event.trust?.approvedForAds ?? false,
    optimization_value: event.optimization.value,
    should_send_meta: event.optimization.shouldSendMeta,
    should_send_google: event.optimization.shouldSendGoogle,
    meta_dispatch_status: shouldDispatchToPlatform(event.optimization.shouldSendMeta, event.trust?.anomalyStatus) ? "pending" : "suppressed",
    google_dispatch_status: shouldDispatchToPlatform(event.optimization.shouldSendGoogle, event.trust?.anomalyStatus) ? "pending" : "suppressed",
    payload: event,
    raw_payload: event.rawPayload || null,
  });

  if (eventErr) {
    throw new Error(`wm_event_log insert failed: ${eventErr.message}`);
  }

  if (isQuoteRelated(input) && input.quote?.analysisId) {
    const { error: factsErr } = await supabase.from("wm_quote_facts").upsert({
      analysis_id: input.quote.analysisId,
      lead_id: identity.leadId || null,
      scan_session_id: input.quote.scanSessionId || null,
      event_id: event.eventId,
      normalized_facts: input.quote.facts || {},
      trust_inputs: {
        ocr_confidence: input.quote.ocrConfidence,
        completeness: input.quote.completeness,
        math_consistency: input.quote.mathConsistency,
        cohort_fit: input.quote.cohortFit,
        scope_consistency: input.quote.scopeConsistency,
        document_validity: input.quote.documentValidity,
        identity_quality: identityQuality,
      },
      trust_score: trust.trustScore,
      anomaly_score: trust.anomalyScore,
      anomaly_status: trust.anomalyStatus,
      manual_review_required: trust.manualReviewRequired,
      approved_for_index: trust.approvedForIndex,
      approved_for_ads: trust.approvedForAds,
      reasons: trust.reasons,
    }, { onConflict: "analysis_id" });

    if (factsErr) {
      throw new Error(`wm_quote_facts upsert failed: ${factsErr.message}`);
    }

    if (trust.manualReviewRequired || trust.anomalyStatus === "quarantine") {
      const { error: reviewErr } = await supabase.from("wm_quote_reviews").upsert({
        event_id: event.eventId,
        analysis_id: input.quote.analysisId,
        review_status: "queued",
        reason_codes: trust.reasons,
      }, { onConflict: "event_id" });

      if (reviewErr) {
        throw new Error(`wm_quote_reviews upsert failed: ${reviewErr.message}`);
      }
    }
  }

  const enqueuedPlatforms: WMPlatformName[] = [];
  if (shouldDispatchToPlatform(event.optimization.shouldSendMeta, event.trust?.anomalyStatus)) {
    enqueuedPlatforms.push("meta");
  }
  if (shouldDispatchToPlatform(event.optimization.shouldSendGoogle, event.trust?.anomalyStatus)) {
    enqueuedPlatforms.push("google");
  }

  for (const platform of enqueuedPlatforms) {
    const { error: dispatchErr } = await supabase.from("wm_platform_dispatch_log").upsert({
      event_id: event.eventId,
      platform,
      status: "pending",
      attempt_count: 0,
      next_retry_at: new Date().toISOString(),
    }, { onConflict: "event_id,platform" });

    if (dispatchErr) {
      throw new Error(`wm_platform_dispatch_log upsert failed: ${dispatchErr.message}`);
    }
  }

  return { event, enqueuedPlatforms };
}
