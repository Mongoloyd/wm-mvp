/**
 * Homepage A/B Test Variants
 *
 * Each variant swaps ONLY the hero section text content.
 * Nothing below the hero changes — buttons, flows, CTAs, upload zones stay identical.
 *
 * To add a new variant: add an entry here. The hook handles assignment automatically.
 * To force a variant for review: append ?v=KEY to the URL (e.g., ?v=loss_aversion)
 *   NOTE: URL overrides are session-only — they do NOT persist to localStorage.
 * To disable A/B testing: set ACTIVE_VARIANTS to a single-element array.
 */

export interface HomepageVariant {
  id: string;
  badgeText: string;
  headline: string;
  subheadline: string;
  weight: number;
}

export const ALL_VARIANTS: Record<string, HomepageVariant> = {
  accusation: {
    id: "accusation",
    badgeText: "Forensic Quote Intelligence",
    // Empty strings trigger AuditHero's JSX fallback, preserving the original
    // orange-glow "THEY'RE COUNTING ON." span and the "under 60 seconds" bold.
    headline: "",
    subheadline: "",
    weight: 1,
  },
  direct_action: {
    id: "direct_action",
    badgeText: "AI-Powered Quote Analysis",
    headline: "Scan Your Quote. Beat Your Contractors.",
    subheadline:
      "See exactly where you're being overcharged and get the leverage to negotiate fair pricing — powered by AI that's analyzed thousands of Florida quotes.",
    weight: 1,
  },
  loss_aversion: {
    id: "loss_aversion",
    badgeText: "Exposed: Florida Pricing Data",
    headline: "The Average Florida Homeowner Overpays $4,800 on Impact Windows. Don't Be Average.",
    subheadline:
      "We've analyzed thousands of contractor quotes across all 67 Florida counties. Upload yours and see exactly where your money is going — and where it shouldn't be.",
    weight: 1,
  },
  fine_print: {
    id: "fine_print",
    badgeText: "Quote Intelligence Engine",
    headline: "Your Contractor Hopes You Don't Read the Fine Print. We Read It for You.",
    subheadline:
      "Hidden fees, scope gaps, missing warranties — our AI catches what contractors count on you missing. Free forensic analysis in under 60 seconds.",
    weight: 1,
  },
  pre_sign: {
    id: "pre_sign",
    badgeText: "Free AI Quote Audit",
    headline: "Before You Sign That Quote, Let AI Check the Math.",
    subheadline:
      "Upload your estimate. In seconds, our AI forensically grades it across 5 key areas: safety, scope, pricing, fine print, and warranty. Best of all, it's free.",
    weight: 1,
  },
  question: {
    id: "question",
    badgeText: "Instant AI Analysis",
    headline: "Is Your Contractor Overcharging You? Find Out in 60 Seconds.",
    subheadline:
      "Drop your impact window quote below. Our AI compares your pricing to thousands of verified Florida projects — then tells you exactly what to do about it.",
    weight: 1,
  },
  free_audit: {
    id: "free_audit",
    badgeText: "100% Free · No Signup Required",
    headline: "Free AI Audit: See Exactly Where Your Quote Is Overpriced.",
    subheadline:
      "Upload any contractor estimate — PDF, photo, screenshot. Our AI reads every line item, checks pricing against county benchmarks, and flags what's wrong. Takes 60 seconds.",
    weight: 1,
  },
};

export const ACTIVE_VARIANTS: string[] = [
  "accusation",
  "direct_action",
  "loss_aversion",
  "fine_print",
  "pre_sign",
  "question",
  "free_audit",
];
