import { useState, useEffect, useRef } from "react";
import {
  ALL_VARIANTS,
  ACTIVE_VARIANTS,
  type HomepageVariant,
} from "@/config/homepageVariants";
import { trackGtmEvent } from "@/lib/trackConversion";

const STORAGE_KEY = "wm_hp_variant";
const SESSION_FIRED_KEY = "wm_hp_variant_fired";

function pickWeightedVariant(): string {
  const candidates = ACTIVE_VARIANTS.map((id) => ALL_VARIANTS[id]).filter(Boolean);
  if (candidates.length === 0) return "accusation";
  const totalWeight = candidates.reduce((sum, v) => sum + v.weight, 0);
  let random = Math.random() * totalWeight;
  for (const variant of candidates) {
    random -= variant.weight;
    if (random <= 0) return variant.id;
  }
  return candidates[0].id;
}

function resolveVariant(): { id: string; isUrlOverride: boolean } {
  if (typeof window === "undefined") {
    return { id: ACTIVE_VARIANTS[0] || "accusation", isUrlOverride: false };
  }

  // 1. URL override (?v=VARIANT_ID) — session-only, NOT persisted
  const urlParams = new URLSearchParams(window.location.search);
  const urlVariant = urlParams.get("v");
  if (urlVariant && ALL_VARIANTS[urlVariant]) {
    return { id: urlVariant, isUrlOverride: true };
  }

  // 2. localStorage (return visitor)
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && ALL_VARIANTS[stored] && ACTIVE_VARIANTS.includes(stored)) {
      return { id: stored, isUrlOverride: false };
    }
  } catch { /* localStorage blocked */ }

  // 3. Random assignment (new visitor)
  return { id: pickWeightedVariant(), isUrlOverride: false };
}

/**
 * useHomepageVariant — assigns, persists, and tracks homepage A/B test variants.
 *
 * Priority: URL ?v= (session-only) → localStorage → weighted random.
 * URL overrides do NOT write to localStorage (prevents shared-link contamination).
 * Analytics fires once per browser session via sessionStorage debounce.
 */
export function useHomepageVariant(): HomepageVariant {
  // Resolve once on mount — same object drives both UI and analytics, eliminating
  // any chance of a re-resolve returning a different variant between renders.
  const [resolved] = useState<{ id: string; isUrlOverride: boolean }>(() => resolveVariant());
  const hasFired = useRef(false);

  useEffect(() => {
    // Persist to localStorage ONLY if organically assigned (not URL override)
    if (!resolved.isUrlOverride) {
      try { localStorage.setItem(STORAGE_KEY, resolved.id); } catch { /* silent */ }
    }

    // Fire analytics once per session (sessionStorage resets on browser close)
    if (!hasFired.current) {
      try {
        if (sessionStorage.getItem(SESSION_FIRED_KEY) !== resolved.id) {
          trackGtmEvent("homepage_variant_viewed", {
            variant_id: resolved.id,
            is_url_override: resolved.isUrlOverride,
          });
          sessionStorage.setItem(SESSION_FIRED_KEY, resolved.id);
        }
      } catch {
        // sessionStorage blocked — fire anyway
        trackGtmEvent("homepage_variant_viewed", {
          variant_id: resolved.id,
          is_url_override: resolved.isUrlOverride,
        });
      }
      hasFired.current = true;
    }
  }, [resolved]);

  return ALL_VARIANTS[resolved.id] || ALL_VARIANTS["accusation"];
}
