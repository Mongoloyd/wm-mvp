import { TRUST_THRESHOLDS } from "./constants.ts";
import type { WMCanonicalEvent } from "./types.ts";

const EVENT_MAP: Record<string, string> = {
  lead_identified: "Lead",
  quote_upload_completed: "Lead",
  quote_validation_passed: "ViewContent",
  otp_verified: "CompleteRegistration",
  appointment_booked: "Schedule",
  sale_confirmed: "Purchase",
};

export interface MetaMappedPayload {
  event_name: string;
  event_id: string;
  event_time: number;
  action_source: "website";
  user_data: {
    em?: string;
    ph?: string;
    fn?: string;
    fbc?: string;
    fbp?: string;
    external_id?: string;
    client_ip_address?: string;
    client_user_agent?: string;
  };
  custom_data: Record<string, unknown>;
}

export function mapToMeta(event: WMCanonicalEvent): MetaMappedPayload | null {
  if (!event.optimization.shouldSendMeta) return null;
  if (event.trust && event.trust.anomalyStatus !== "safe") return null;
  if (event.trust && event.trust.trustScore < TRUST_THRESHOLDS.metaMinimum) return null;
  if (event.identityQuality === "none") return null;

  const mapped = EVENT_MAP[event.eventName];
  if (!mapped) return null;

  return {
    event_name: mapped,
    event_id: event.eventId,
    event_time: Math.floor(new Date(event.occurredAt).getTime() / 1000),
    action_source: "website",
    user_data: {
      em: event.identityHashes.emailSha256,
      ph: event.identityHashes.phoneSha256,
      fn: event.identityHashes.firstNameSha256,
      external_id: event.identityHashes.externalIdSha256,
      fbc: event.identity.fbc || undefined,
      fbp: event.identity.fbp || undefined,
      client_ip_address: event.identity.clientIp || undefined,
      client_user_agent: event.identity.userAgent || undefined,
    },
    custom_data: {
      value: event.optimization.value,
      currency: event.optimization.currency,
      event_name_canonical: event.eventName,
      lead_id: event.identity.leadId || undefined,
      analysis_id: event.quote?.analysisId || undefined,
    },
  };
}
