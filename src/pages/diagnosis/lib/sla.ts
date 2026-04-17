import type { SLAPromise } from '../types';

// TIME-AWARE SLA RESOLVER
// Business hours: 8 AM – 7 PM. Weekend → Monday 10 AM.
// Friday-evening submissions correctly promote to Monday (not Saturday).
const BUSINESS_HOURS_START = 8;
const BUSINESS_HOURS_END = 19;

const formatClockTime = (d: Date): string =>
  d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

export const getSLAPromise = (now: Date = new Date()): SLAPromise => {
  const day = now.getDay(); // 0 = Sun, 6 = Sat
  const hour = now.getHours();

  // Weekend → Monday 10 AM
  if (day === 0 || day === 6) {
    const monday = new Date(now);
    monday.setDate(now.getDate() + (day === 6 ? 2 : 1));
    monday.setHours(10, 0, 0, 0);
    return {
      text: 'Your advisor is calling Monday morning (by 10:00 AM)',
      callbackIso: monday.toISOString(),
      urgency: 'monday',
    };
  }

  // After business hours → next business morning, promoting across weekends
  if (hour < BUSINESS_HOURS_START || hour >= BUSINESS_HOURS_END) {
    const next = new Date(now);
    next.setDate(now.getDate() + 1);
    // If tomorrow is Saturday or Sunday, promote to Monday
    if (next.getDay() === 6) next.setDate(next.getDate() + 2);
    else if (next.getDay() === 0) next.setDate(next.getDate() + 1);

    const isMonday = next.getDay() === 1 && (day === 5 || day === 6 || day === 0);
    if (isMonday) {
      next.setHours(10, 0, 0, 0);
      return {
        text: 'Your advisor is calling Monday morning (by 10:00 AM)',
        callbackIso: next.toISOString(),
        urgency: 'monday',
      };
    }
    next.setHours(9, 30, 0, 0);
    return {
      text: 'Your advisor is calling first thing tomorrow (by 9:30 AM)',
      callbackIso: next.toISOString(),
      urgency: 'next_morning',
    };
  }

  // Business hours → +60 minutes
  const callback = new Date(now.getTime() + 60 * 60 * 1000);
  return {
    text: `Your advisor is calling by ${formatClockTime(callback)}`,
    callbackIso: callback.toISOString(),
    urgency: 'hour',
  };
};
