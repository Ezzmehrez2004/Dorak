// App-wide settings.

// How often live pages re-fetch the queue (milliseconds).
export const POLL_MS = 30000;

// Simulated network delay of the mock API (milliseconds).
export const MOCK_DELAY_MS = 450;

// Browser storage keys used by the mock data layer. The mock database lives
// in localStorage; the logged-in session lives in sessionStorage, so closing
// the browser logs you out and the site always starts at the login page.
export const STORAGE_KEYS = {
  db: "dorak:mockdb:v3",
  simulateError: "dorak:simulateError",
  session: "dorak:session",
};

// Anti no-show rules (business assumptions, tune after testing with shops).
export const RULES = {
  confirmWhenPeopleAhead: 1, // ask "on my way?" once 1 or fewer people are ahead (2nd in line)
  confirmWindowMinutes: 10, // time to confirm before being moved back
  maxMoveBacks: 2, // moved back this many times -> counted as a no-show
  strikeLimit: 2, // no-shows within the window that trigger a block
  strikeWindowDays: 30,
  blockDays: 7, // walk-in joining blocked for this long after the limit is hit
  maxPriorityWaiting: 2, // at most this many priority customers waiting per barber, so walk-ins aren't bumped endlessly
};

// Phone verification during sign-up (mock in Milestone 1: code shown on screen).
export const VERIFY = {
  codeLength: 6,
  expiresMinutes: 10,
  maxAttempts: 5,
  resendSeconds: 30,
};
