/**
 * useLeadId.ts — Persistent Unique Visitor ID
 *
 * Every visitor gets a UUID on first visit, stored in both
 * localStorage and a cookie (for CAPI server-side access).
 *
 * This ID is attached to:
 * - All form submissions (lead gate, OTP, contractor match)
 * - All tracking events (Meta Pixel, CAPI, GTM dataLayer)
 * - Supabase lead records (external_id field)
 *
 * Enables cross-session attribution and deduplication.
 * Never expires (persists across sessions, survives browser close).
 */

import { v4 as uuidv4 } from "uuid";

const LEAD_ID_KEY = "wm_lead_id";
const COOKIE_DAYS = 365; // 1 year persistence

// ── Cookie helpers ──────────────────────────────────────────────────────────

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : null;
}

function setCookie(name: string, value: string, days: number) {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires};path=/;SameSite=Lax`;
}

// ── Core getter (works outside React) ───────────────────────────────────────

let cachedLeadId: string | null = null;

export function getLeadId(): string {
  if (cachedLeadId) return cachedLeadId;

  if (typeof window === "undefined") {
    return uuidv4(); // SSR fallback
  }

  // Priority: localStorage > cookie > generate new
  let id = localStorage.getItem(LEAD_ID_KEY) || getCookie(LEAD_ID_KEY);

  if (!id) {
    id = uuidv4();
  }

  // Ensure both storage locations are synced
  localStorage.setItem(LEAD_ID_KEY, id);
  setCookie(LEAD_ID_KEY, id, COOKIE_DAYS);

  cachedLeadId = id;
  return id;
}

// ── React hook ──────────────────────────────────────────────────────────────

import { useMemo } from "react";

export function useLeadId(): string {
  return useMemo(() => getLeadId(), []);
}
