export const QUALIFICATION_RULES = {
  SCORING: {
    INSTALLS_REGULARLY: 2,
    JOB_SIZE_MID: 1,
    JOB_SIZE_HIGH: 2,
    SPEED_ELITE: 3,
    SPEED_GOOD: 1,
    FOLLOW_UP_CONSISTENT: 2,
    QUALITY_ALIGNMENT: 3,
  },
  PENALTIES: {
    JOB_SIZE_LOW: -2,
    SPEED_SLOW: -3,
    FOLLOW_UP_WEAK: -3,
  },
  THRESHOLDS: {
    TIER_1_QUALIFIED: 6,
    TIER_2_REVIEW: 3,
  },
};

export const QUESTIONS = [
  { id: "installs", weight: "INSTALLS_REGULARLY", blockIf: "no_just_exploring" },
  { id: "job_size", mapping: { under_8k: "JOB_SIZE_LOW", "8k_15k": "JOB_SIZE_MID", "15k_25k": "JOB_SIZE_HIGH", "25k_plus": "JOB_SIZE_HIGH" } },
  { id: "speed", mapping: { within_5_15_minutes: "SPEED_ELITE", within_few_hours: "SPEED_GOOD", next_day: "SPEED_SLOW" } },
  { id: "follow_up", mapping: { yes_consistently: "FOLLOW_UP_CONSISTENT", rarely: "FOLLOW_UP_WEAK" } },
  { id: "intent", mapping: { quality: "QUALITY_ALIGNMENT", volume: "BLOCK" } },
] as const;
