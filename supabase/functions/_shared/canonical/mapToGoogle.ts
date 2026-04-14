import type { WMCanonicalEvent } from "./types.ts";

const EVENT_MAP: Record<string, string> = {
  lead_identified: "wm_lead_identified",
  quote_upload_completed: "wm_quote_upload_completed",
  quote_validation_passed: "wm_quote_validation_passed",
  otp_verified: "wm_otp_verified",
  appointment_booked: "wm_appointment_booked",
  sale_confirmed: "wm_sale_confirmed",
};

export interface GoogleMappedPayload {
  conversion_action: string;
  conversion_time: string;
  transaction_id: string;
  conversion_value: number;
  currency_code: string;
  attribution: {
    gclid?: string;
    gbraid?: string;
    wbraid?: string;
    hashed_email?: string;
    hashed_phone_number?: string;
  };
  custom_variables: Record<string, unknown>;
}

function hasAttribution(event: WMCanonicalEvent): boolean {
  return Boolean(
    event.identity.gclid ||
    event.identity.gbraid ||
    event.identity.wbraid ||
    event.identityHashes.emailSha256 ||
    event.identityHashes.phoneSha256
  );
}

export function mapToGoogle(event: WMCanonicalEvent): GoogleMappedPayload | null {
  if (!event.optimization.shouldSendGoogle) return null;
  if (event.trust && event.trust.anomalyStatus !== "safe") return null;

  const action = EVENT_MAP[event.eventName];
  if (!action) return null;
  if (!hasAttribution(event)) return null;

  return {
    conversion_action: action,
    conversion_time: event.occurredAt,
    transaction_id: event.eventId,
    conversion_value: event.optimization.value,
    currency_code: event.optimization.currency,
    attribution: {
      gclid: event.identity.gclid || undefined,
      gbraid: event.identity.gbraid || undefined,
      wbraid: event.identity.wbraid || undefined,
      hashed_email: event.identityHashes.emailSha256,
      hashed_phone_number: event.identityHashes.phoneSha256,
    },
    custom_variables: {
      canonical_event_name: event.eventName,
      identity_quality: event.identityQuality,
      anomaly_status: event.trust?.anomalyStatus,
      lead_id: event.identity.leadId || undefined,
    },
  };
}
