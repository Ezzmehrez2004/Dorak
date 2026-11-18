/*
 * Queue logic for the advanced feature: live estimated wait time.
 * Pure functions, so the same code can move to the Express server in
 * Milestone 2 without changes.
 *
 * Each entry passed in must have: status, type, joinedAt, startedAt,
 * and duration (minutes of the chosen service).
 */

const MIN = 60 * 1000;
export const ACTIVE_STATUSES = ["in_chair", "waiting"];

// Order: the customer in the chair, then priority customers, then walk-ins.
// Within each group, whoever joined first goes first.
function rank(entry) {
  if (entry.status === "in_chair") return 0;
  if (entry.type === "priority") return 1;
  return 2;
}

export function orderQueue(entries) {
  return entries
    .filter((e) => ACTIVE_STATUSES.includes(e.status))
    .sort((a, b) => rank(a) - rank(b) || a.joinedAt - b.joinedAt);
}

// Minutes this entry will still occupy the barber.
export function remainingMinutes(entry, now = Date.now()) {
  if (entry.status === "in_chair" && entry.startedAt) {
    const elapsed = (now - entry.startedAt) / MIN;
    return Math.max(5, Math.round(entry.duration - elapsed));
  }
  return entry.duration;
}

// Wait for the entry at `index` in an ordered queue = time of everyone ahead.
export function waitAtIndex(ordered, index, now = Date.now()) {
  return ordered.slice(0, index).reduce((sum, e) => sum + remainingMinutes(e, now), 0);
}

// Priority customers currently waiting in an ordered queue.
export function waitingPriorityCount(ordered) {
  return ordered.filter((e) => e.status === "waiting" && e.type === "priority").length;
}

// Where a new customer of the given type would be placed (0-based index).
export function insertionIndex(ordered, type) {
  if (type !== "priority") return ordered.length;
  const firstWalkIn = ordered.findIndex((e) => e.status === "waiting" && e.type !== "priority");
  return firstWalkIn === -1 ? ordered.length : firstWalkIn;
}

// Estimated wait (minutes) if someone joins now as walk-in or priority.
export function waitForNewcomer(ordered, type, now = Date.now()) {
  return waitAtIndex(ordered, insertionIndex(ordered, type), now);
}

/*
 * Demand-based priority fee (EGP): starts at 20 and rises by 5 for every
 * 15 minutes of walk-in wait, capped at 150. The formula is an assumption
 * to test with real shops; it only affects what is displayed in Milestone 1.
 */
export function priorityFee(walkInWaitMinutes) {
  return Math.min(150, 20 + 5 * Math.floor(walkInWaitMinutes / 15));
}

// "1st", "2nd", "3rd", "4th"...
export function ordinal(n) {
  const v = n % 100;
  if (v >= 11 && v <= 13) return `${n}th`;
  return `${n}${{ 1: "st", 2: "nd", 3: "rd" }[n % 10] || "th"}`;
}

// "Karim Nabil" -> "Karim N." for public queue lists.
export function maskName(fullName) {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

export function formatMinutes(minutes) {
  if (minutes <= 0) return "No wait";
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}
