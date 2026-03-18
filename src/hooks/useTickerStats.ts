// Deterministic daily-increment ticker stats (seed: 3212 total, 14 today, +7-31/day)

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

const EPOCH = new Date("2025-06-01").getTime();
const SEED_TOTAL = 3212;
const DAY_MS = 86400000;

export function useTickerStats(): { total: number; today: number } {
  const now = Date.now();
  const daysSinceEpoch = Math.floor((now - EPOCH) / DAY_MS);

  let total = SEED_TOTAL;
  for (let d = 0; d < daysSinceEpoch; d++) {
    total += 7 + Math.floor(seededRandom(d + 1000) * 25); // 7-31
  }

  const today = 7 + Math.floor(seededRandom(daysSinceEpoch + 5000) * 25);

  return { total, today };
}
