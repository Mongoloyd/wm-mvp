
/** @type {import('./qualificationLogic').Answers} */
export const INITIAL_ANSWERS = {
  installVolume: null,
  jobSize: null,
  responseSpeed: null,
  followUpBehavior: null,
  expectationAlignment: null,
  serviceArea: ""
};

export function getRoutingTier(answers) {
  if (answers.expectationAlignment === "volume") return "BLOCK";
  if (answers.installVolume === "exploring" && answers.jobSize === "under8k") return "BLOCK";

  let score = 0;
  if (answers.installVolume === "regular") score += 2;
  else if (answers.installVolume === "small") score += 1;

  if (answers.jobSize === "25plus") score += 3;
  else if (answers.jobSize === "15to25k") score += 2;
  else if (answers.jobSize === "8to15k") score += 1;
  else if (answers.jobSize === "under8k") score -= 1;

  if (answers.responseSpeed === "under15min") score += 2;
  else if (answers.responseSpeed === "fewhours") score += 1;
  else if (answers.responseSpeed === "nextday") score -= 2;

  if (answers.followUpBehavior === "consistent") score += 2;
  else if (answers.followUpBehavior === "rarely") score -= 2;

  if (answers.expectationAlignment === "quality") score += 1;
  else if (answers.expectationAlignment === "unsure") score -= 1;

  if (score >= 7) return "HIGH";
  if (score >= 3) return "MID";
  return "LOW";
}

export function getOutcomeContent(tier) {
  switch (tier) {
    case "HIGH":
      return {
        headline: "You're a strong fit.",
        subhead: "See if your territory is still available.",
        showCalendly: true,
        showPhone: true,
        showEmailCapture: false,
        showClose: false,
        ctaLabel: "Book Your 10-Minute Walkthrough"
      };
    case "MID":
      return {
        headline: "Let's take a closer look together.",
        subhead: "This works best for contractors moving quickly on mid-to-high value jobs. If that's your direction, let's talk.",
        showCalendly: true,
        showPhone: true,
        showEmailCapture: false,
        showClose: false,
        note: "We may ask a few more questions on the call."
      };
    case "LOW":
      return {
        headline: "This may not be the right fit right now.",
        subhead: "WindowMan works best when contractors can move fast and handle higher-value jobs.",
        bullets: [
          "Move quickly on new opportunities",
          "Handle mid-to-high value jobs ($8k+)",
          "Actively close deals in their market"
        ],
        showCalendly: false,
        showPhone: false,
        showEmailCapture: true,
        showClose: true,
        ctaLabel: "Notify Me When Things Change"
      };
    case "BLOCK":
      return {
        headline: "This system isn't built for volume lead gen.",
        subhead: "WindowMan focuses on high-intent buyers already comparing competitor quotes. If that changes, we're here.",
        showCalendly: false,
        showPhone: false,
        showEmailCapture: false,
        showClose: true
      };
    default:
      return {
        headline: "Something went wrong.",
        subhead: "Please try again.",
        showCalendly: false,
        showPhone: false,
        showEmailCapture: false,
        showClose: true
      };
  }
}