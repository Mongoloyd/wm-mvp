import type {
  WM_ANOMALY_STATUSES,
  WM_DISPATCH_STATUSES,
  WM_EVENT_NAMES,
  WM_IDENTITY_QUALITIES,
  WM_PLATFORM_NAMES,
} from "./constants.ts";

export type WMEventName = (typeof WM_EVENT_NAMES)[number];
export type WMAnomalyStatus = (typeof WM_ANOMALY_STATUSES)[number];
export type WMDispatchStatus = (typeof WM_DISPATCH_STATUSES)[number];
export type WMPlatformName = (typeof WM_PLATFORM_NAMES)[number];
export type WMIdentityQuality = (typeof WM_IDENTITY_QUALITIES)[number];

export interface WMIdentityPayload {
  leadId?: string | null;
  email?: string | null;
  phoneE164?: string | null;
  firstName?: string | null;
  externalId?: string | null;
  fbc?: string | null;
  fbp?: string | null;
  gclid?: string | null;
  gbraid?: string | null;
  wbraid?: string | null;
  clientIp?: string | null;
  userAgent?: string | null;
}

export interface WMJourneyPayload {
  route?: string | null;
  source?: string | null;
  medium?: string | null;
  campaign?: string | null;
}

export interface WMQuotePayload {
  analysisId?: string | null;
  scanSessionId?: string | null;
  quoteFileId?: string | null;
  county?: string | null;
  openingCount?: number | null;
  quotedAmount?: number | null;
  ocrConfidence?: number | null;
  completeness?: number | null;
  mathConsistency?: number | null;
  cohortFit?: number | null;
  scopeConsistency?: number | null;
  documentValidity?: number | null;
  isWindowDoorQuote?: boolean | null;
  impossibleValueDetected?: boolean | null;
  facts?: Record<string, unknown>;
}

export interface WMAnalyticsPayload {
  eventSource?: string | null;
  flowType?: string | null;
  metadata?: Record<string, unknown>;
}

export interface WMOptimizationPayload {
  currency: "USD";
  value: number;
  shouldSendMeta: boolean;
  shouldSendGoogle: boolean;
}

export interface WMTrustResult {
  trustScore: number;
  anomalyScore: number;
  anomalyStatus: WMAnomalyStatus;
  manualReviewRequired: boolean;
  approvedForIndex: boolean;
  approvedForAds: boolean;
  reasons: string[];
}

export interface WMCanonicalEvent {
  eventId: string;
  eventName: WMEventName;
  occurredAt: string;
  schemaVersion: string;
  modelVersion: string;
  identity: WMIdentityPayload;
  identityQuality: WMIdentityQuality;
  identityHashes: {
    emailSha256?: string;
    phoneSha256?: string;
    firstNameSha256?: string;
    externalIdSha256?: string;
  };
  journey: WMJourneyPayload;
  quote?: WMQuotePayload;
  analytics?: WMAnalyticsPayload;
  optimization: WMOptimizationPayload;
  trust?: WMTrustResult;
  rawPayload?: Record<string, unknown>;
}

export interface CreateCanonicalEventInput {
  eventId?: string;
  eventName: WMEventName;
  occurredAt?: string;
  schemaVersion?: string;
  modelVersion?: string;
  identity?: WMIdentityPayload;
  journey?: WMJourneyPayload;
  quote?: WMQuotePayload;
  analytics?: WMAnalyticsPayload;
  rawPayload?: Record<string, unknown>;
  shouldSendMeta?: boolean;
  shouldSendGoogle?: boolean;
}
