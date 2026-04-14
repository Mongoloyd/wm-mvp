import type { WMIdentityPayload, WMIdentityQuality } from "./types.ts";

function normalizeEmail(email?: string | null): string | undefined {
  if (!email) return undefined;
  return email.trim().toLowerCase();
}

function normalizePhone(phone?: string | null): string | undefined {
  if (!phone) return undefined;
  const normalized = phone.replace(/[^0-9+]/g, "");
  return normalized || undefined;
}

export function normalizeIdentity(identity: WMIdentityPayload = {}): WMIdentityPayload {
  return {
    ...identity,
    email: normalizeEmail(identity.email),
    phoneE164: normalizePhone(identity.phoneE164),
    firstName: identity.firstName?.trim() || undefined,
    externalId: identity.externalId?.trim() || undefined,
  };
}

async function sha256(value: string): Promise<string> {
  const data = new TextEncoder().encode(value.trim().toLowerCase());
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function buildIdentityHashes(identity: WMIdentityPayload) {
  return {
    emailSha256: identity.email ? await sha256(identity.email) : undefined,
    phoneSha256: identity.phoneE164 ? await sha256(identity.phoneE164) : undefined,
    firstNameSha256: identity.firstName ? await sha256(identity.firstName) : undefined,
    externalIdSha256: identity.externalId ? await sha256(identity.externalId) : undefined,
  };
}

export function computeIdentityQuality(identity: WMIdentityPayload): WMIdentityQuality {
  const strongSignals = Number(Boolean(identity.email)) + Number(Boolean(identity.phoneE164));
  const attributionSignals = Number(Boolean(identity.fbc || identity.fbp)) + Number(Boolean(identity.gclid || identity.gbraid || identity.wbraid));

  if (strongSignals >= 2 && attributionSignals >= 1) return "strong";
  if (strongSignals >= 1 && attributionSignals >= 1) return "medium";
  if (strongSignals >= 1 || attributionSignals >= 1) return "weak";
  return "none";
}
