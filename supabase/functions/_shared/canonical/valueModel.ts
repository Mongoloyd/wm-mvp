import type { WMEventName } from "./types.ts";

const VALUE_BY_EVENT: Partial<Record<WMEventName, number>> = {
  lead_identified: 15,
  quote_upload_completed: 35,
  quote_validation_passed: 65,
  otp_verified: 90,
  report_revealed: 110,
  appointment_booked: 180,
  sale_confirmed: 450,
};

export function computeOptimizationValue(eventName: WMEventName): number {
  return VALUE_BY_EVENT[eventName] ?? 0;
}
