import { QUALIFICATION_RULES } from "../config/page.config";

export type QualificationAnswers = {
  installs: "yes_regularly" | "yes_smaller_volume" | "no_just_exploring";
  job_size: "under_8k" | "8k_15k" | "15k_25k" | "25k_plus";
  speed: "within_5_15_minutes" | "within_few_hours" | "same_day" | "next_day";
  follow_up: "yes_consistently" | "sometimes" | "rarely";
  intent: "quality" | "not_sure" | "volume";
};

export function getRoutingTier(
  answers: QualificationAnswers,
): "QUALIFIED" | "REVIEW" | "REJECT" {
  if (answers.installs === "no_just_exploring") return "REJECT";
  if (answers.intent === "volume") return "REJECT";

  let score = 0;

  if (answers.installs === "yes_regularly")
    score += QUALIFICATION_RULES.SCORING.INSTALLS_REGULARLY;

  if (answers.job_size === "under_8k")
    score += QUALIFICATION_RULES.PENALTIES.JOB_SIZE_LOW;
  if (answers.job_size === "8k_15k")
    score += QUALIFICATION_RULES.SCORING.JOB_SIZE_MID;
  if (answers.job_size === "15k_25k" || answers.job_size === "25k_plus")
    score += QUALIFICATION_RULES.SCORING.JOB_SIZE_HIGH;

  if (answers.speed === "within_5_15_minutes")
    score += QUALIFICATION_RULES.SCORING.SPEED_ELITE;
  if (answers.speed === "within_few_hours")
    score += QUALIFICATION_RULES.SCORING.SPEED_GOOD;
  if (answers.speed === "next_day")
    score += QUALIFICATION_RULES.PENALTIES.SPEED_SLOW;

  if (answers.follow_up === "yes_consistently")
    score += QUALIFICATION_RULES.SCORING.FOLLOW_UP_CONSISTENT;
  if (answers.follow_up === "rarely")
    score += QUALIFICATION_RULES.PENALTIES.FOLLOW_UP_WEAK;

  if (answers.intent === "quality")
    score += QUALIFICATION_RULES.SCORING.QUALITY_ALIGNMENT;

  if (score >= QUALIFICATION_RULES.THRESHOLDS.TIER_1_QUALIFIED)
    return "QUALIFIED";
  if (score >= QUALIFICATION_RULES.THRESHOLDS.TIER_2_REVIEW) return "REVIEW";

  return "REJECT";
}

// ── UI-layer types and helpers for QualificationFlow ──────────────────────────

export type Answers = {
  installVolume: "regular" | "small" | "exploring" | null;
  serviceArea: string;
  jobSize: "under8k" | "8to15k" | "15to25k" | "25plus" | null;
  responseSpeed: "under15min" | "fewhours" | "sameday" | "nextday" | null;
  followUpBehavior: "consistent" | "sometimes" | "rarely" | null;
  expectationAlignment: "quality" | "unsure" | "volume" | null;
};

export const INITIAL_ANSWERS: Answers = {
  installVolume: null,
  serviceArea: "",
  jobSize: null,
  responseSpeed: null,
  followUpBehavior: null,
  expectationAlignment: null,
};

export type RoutingTier = "HIGH" | "MID" | "LOW" | "BLOCK";

function mapToInternal(a: Answers): QualificationAnswers {
  const iMap = { regular: "yes_regularly", small: "yes_smaller_volume", exploring: "no_just_exploring" } as const;
  const jMap = { under8k: "under_8k", "8to15k": "8k_15k", "15to25k": "15k_25k", "25plus": "25k_plus" } as const;
  const sMap = { under15min: "within_5_15_minutes", fewhours: "within_few_hours", sameday: "same_day", nextday: "next_day" } as const;
  const fMap = { consistent: "yes_consistently", sometimes: "sometimes", rarely: "rarely" } as const;
  const eMap = { quality: "quality", unsure: "not_sure", volume: "volume" } as const;

  return {
    installs: a.installVolume ? iMap[a.installVolume] : "no_just_exploring",
    job_size: a.jobSize ? jMap[a.jobSize] : "under_8k",
    speed: a.responseSpeed ? sMap[a.responseSpeed] : "next_day",
    follow_up: a.followUpBehavior ? fMap[a.followUpBehavior] : "rarely",
    intent: a.expectationAlignment ? eMap[a.expectationAlignment] : "volume",
  };
}

export function computeRoutingTier(answers: Answers): RoutingTier {
  if (answers.expectationAlignment === "volume" || answers.installVolume === "exploring") return "BLOCK";
  const raw = getRoutingTier(mapToInternal(answers));
  if (raw === "QUALIFIED") return "HIGH";
  if (raw === "REVIEW") return "MID";
  return "LOW";
}

export type OutcomeContent = {
  headline: string;
  subhead: string;
  note?: string;
  bullets?: string[];
};

export function getOutcomeContent(tier: RoutingTier): OutcomeContent {
  switch (tier) {
    case "HIGH":
      return {
        headline: "You're a Strong Fit",
        subhead: "Based on your answers, your profile aligns well with what WindowMan opportunities look like. Book a walkthrough to confirm your territory.",
      };
    case "MID":
      return {
        headline: "You May Be a Fit",
        subhead: "Your profile has potential. Let's talk through specifics to see if this is the right match.",
        note: "We'll review your territory and operational details on the call.",
      };
    case "LOW":
      return {
        headline: "Not a Match Right Now",
        subhead: "Based on your answers, this system may not be the best fit at this time.",
        bullets: [
          "WindowMan works best for contractors who handle mid-to-high ticket jobs",
          "Speed and follow-up consistency are critical to success",
        ],
      };
    case "BLOCK":
      return {
        headline: "This Isn't the Right Fit",
        subhead: "WindowMan is built for contractors focused on quality over volume. Based on your answers, this isn't aligned with what you're looking for.",
      };
  }
}
