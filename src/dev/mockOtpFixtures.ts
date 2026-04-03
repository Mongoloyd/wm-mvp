/**
 * Mock fixtures for the OTP Gate scratchpad.
 * No Supabase, no Twilio — pure static data.
 */

export const mockPartialPayload = {
  grade: "C",
  issueCount: 3,
  teaserFields: [
    { label: "Market Average (per opening)", value: "$1,450" },
    { label: "Your Quote (per opening)", value: "$2,180" },
    { label: "Red Flags Found", value: "3" },
  ],
};

export const mockFullPayload = {
  grade: "C",
  issueCount: 3,
  pillars: [
    { name: "Safety & Code Match", score: 62 },
    { name: "Install & Scope Clarity", score: 45 },
    { name: "Price Fairness", score: 38 },
    { name: "Fine Print & Transparency", score: 71 },
    { name: "Warranty Value", score: 55 },
  ],
  redFlags: [
    { label: "DP Rating Not Specified", severity: "critical" },
    { label: "No Permit Handling Mentioned", severity: "critical" },
    { label: "Warranty Duration Below Market Standard", severity: "amber" },
  ],
  negotiationScript:
    "Based on our analysis, your quote is approximately 50% above the county median for similar projects. Key leverage points: missing DP rating documentation, no permit language, and below-market warranty terms.",
};
