import { useState, useEffect } from "react";

/**
 * Deterministic daily-increment ticker stats
 * Seeded at 671 total scans as of April 7, 2026.
 * Growth: ~18-30 per day.
 */

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

// April 7, 2026 - Keeping the count fresh and grounded
const EPOCH = new Date("2026-04-07T00:00:00Z").getTime();
const SEED_TOTAL = 671;
const DAY_MS = 86400000;

export function useTickerStats(): { total: number; today: number } {
  const [stats, setStats] = useState({ total: SEED_TOTAL, today: 16 });

  useEffect(() => {
    const calculateStats = () => {
      const now = Date.now();
      const daysSinceEpoch = Math.floor((now - EPOCH) / DAY_MS);

      // 1. Calculate the rolling total since the seed date
      let currentTotal = SEED_TOTAL;
      for (let d = 0; d < daysSinceEpoch; d++) {
        // Adds between 7 and 31 scans per day deterministically
        currentTotal += 7 + Math.floor(seededRandom(d + 1000) * 25);
      }

      // 2. Calculate "Today's" progress based on the current hour
      const currentHour = new Date().getHours();
      const dayProgress = currentHour / 24;

      // Determine how many scans will happen today (deterministic based on the date)
      const expectedTodayTotal = 7 + Math.floor(seededRandom(daysSinceEpoch + 5000) * 25);

      // Show a portion of "Today's" scans based on the time of day
      const currentTodayCount = Math.max(5, Math.floor(expectedTodayTotal * dayProgress));

      setStats({
        total: currentTotal + currentTodayCount,
        today: currentTodayCount,
      });
    };

    calculateStats();
    // Refresh every 30 minutes to update the "Today" count as time passes
    const interval = setInterval(calculateStats, 1000 * 60 * 30);

    return () => clearInterval(interval);
  }, []);

  return stats;
}
