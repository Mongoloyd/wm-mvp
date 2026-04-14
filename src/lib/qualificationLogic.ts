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
  // 1. HARD BLOCK CONDITIONS
  if (answers.installs === "no_just_exploring") return "REJECT";
  if (answers.intent === "volume") return "REJECT";

  // 2. SCORING EXECUTION
  let score = 0;

  // Industry Experience
  if (answers.installs === "yes_regularly")
    score += QUALIFICATION_RULES.SCORING.INSTALLS_REGULARLY;

  // Economics
  if (answers.job_size === "under_8k")
    score += QUALIFICATION_RULES.PENALTIES.JOB_SIZE_LOW;
  if (answers.job_size === "8k_15k")
    score += QUALIFICATION_RULES.SCORING.JOB_SIZE_MID;
  if (answers.job_size === "15k_25k" || answers.job_size === "25k_plus")
    score += QUALIFICATION_RULES.SCORING.JOB_SIZE_HIGH;

  // Behavior
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

  // Alignment
  if (answers.intent === "quality")
    score += QUALIFICATION_RULES.SCORING.QUALITY_ALIGNMENT;

  // 3. TIER ROUTING
  if (score >= QUALIFICATION_RULES.THRESHOLDS.TIER_1_QUALIFIED)
    return "QUALIFIED";
  if (score >= QUALIFICATION_RULES.THRESHOLDS.TIER_2_REVIEW) return "REVIEW";

  return "REJECT";
}
