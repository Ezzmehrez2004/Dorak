/*
 * MOCK API (Milestone 1)
 * -----------------------------------------------------------------
 * get(endpoint, params) and post(endpoint, body) follow the same shape
 * as the get()/post() helpers from the course workshops (Week 9). They
 * return Promises, wait MOCK_DELAY_MS to imitate the network, and read
 * and write mock data kept in the browser's localStorage.
 *
 * The logged-in user is remembered in localStorage as a stand-in for a
 * session cookie. In Milestone 2, replace the body of `request()` with a
 * real fetch() to the Express server; the pages do not need to change.
 * Each handler is labeled with the Express route it stands in for.
 */

import { MOCK_DELAY_MS, RULES, STORAGE_KEYS, VERIFY } from "../config.js";
import { createInitialDb, demoHash } from "../data/mockData.js";
import {
  ACTIVE_STATUSES,
  maskName,
  orderQueue,
  priorityFee,
  remainingMinutes,
  waitAtIndex,
  waitForNewcomer,
  waitingPriorityCount,
} from "../utils/queue.js";
import {
  normalizePhone,
  validateCode,
  validateJoin,
  validateLogin,
  validateRegister,
  validateReview,
} from "../utils/validation.js";

const MIN = 60 * 1000;
const DAY = 24 * 60 * MIN;

export class ApiError extends Error {
  constructor(status, message, fields = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fields = fields; // field-level errors from validation, if any
  }
}

/* ---------- browser storage (stands in for the database and session) ---------- */

function readStorage(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key, value) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // storage full or blocked; the change lasts until the page reloads
  }
}

function loadDb() {
  const raw = readStorage(STORAGE_KEYS.db);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      // corrupted data: fall through to a fresh copy
    }
  }
  const db = createInitialDb();
  saveDb(db);
  return db;
}

function saveDb(db) {
  writeStorage(STORAGE_KEYS.db, JSON.stringify(db));
}

export function resetDemoData() {
  writeStorage(STORAGE_KEYS.db, null);
  writeStorage(STORAGE_KEYS.session, null);
}

export function isErrorSimulationOn() {
  return readStorage(STORAGE_KEYS.simulateError) === "1";
}

export function setErrorSimulation(on) {
  writeStorage(STORAGE_KEYS.simulateError, on ? "1" : null);
}

/* ---------- rules: no-show strikes and "on my way" confirmation ---------- */

// No-shows for this phone number in the last strikeWindowDays.
function strikeStatus(db, phone, now) {
  const since = now - RULES.strikeWindowDays * DAY;
  const noShows = db.queueEntries
    .filter((e) => e.phone === phone && e.status === "no_show" && (e.finishedAt ?? e.joinedAt) >= since)
    .map((e) => e.finishedAt ?? e.joinedAt)
    .sort((a, b) => b - a);
  const blockedUntil = noShows.length >= RULES.strikeLimit ? noShows[0] + RULES.blockDays * DAY : null;
  return {
    strikes: noShows.length,
    limit: RULES.strikeLimit,
    windowDays: RULES.strikeWindowDays,
    blocked: blockedUntil !== null && now < blockedUntil,
    blockedUntil,
  };
}

/*
 * Applied on every request (a real server would run this on a timer):
 * once a waiting customer has `confirmWhenPeopleAhead` or fewer people
 * ahead, they are asked to confirm. If they don't within
 * `confirmWindowMinutes`, they move to the back of their group; after
 * `maxMoveBacks` they are marked as a no-show (a strike).
 */
function applyConfirmationRules(db, now) {
  let changed = false;
  for (const barber of db.barbers) {
    for (let guard = 0; guard < 25; guard++) {
      const ordered = orderQueue(db.queueEntries.filter((e) => e.barberId === barber.id));
      let reshuffled = false;
      for (let index = 0; index < ordered.length; index++) {
        const e = ordered[index];
        if (e.status !== "waiting" || e.confirmedAt || index > RULES.confirmWhenPeopleAhead) continue;
        if (!e.confirmRequestedAt) {
          e.confirmRequestedAt = now;
          changed = true;
        } else if (now - e.confirmRequestedAt > RULES.confirmWindowMinutes * MIN) {
          e.movedBack = (e.movedBack ?? 0) + 1;
          e.confirmRequestedAt = null;
          if (e.movedBack >= RULES.maxMoveBacks) {
            e.status = "no_show";
            e.finishedAt = now;
          } else {
            e.joinedAt = now; // back of the line
          }
          changed = true;
          reshuffled = true;
          break; // order changed: recompute
        }
      }
      if (!reshuffled) break;
    }
  }
  return changed;
}

/* ---------- helpers that build API responses ---------- */

function publicUser(user) {
  return { id: user.id, name: user.name, phone: user.phone };
}

function withDuration(db, entry) {
  const service = db.services.find((s) => s.id === entry.serviceId);
  return { ...entry, duration: service ? service.duration : 30, serviceName: service ? service.name : "Service" };
}

function barberQueue(db, barberId, now) {
  const entries = db.queueEntries.filter((e) => e.barberId === barberId).map((e) => withDuration(db, e));
  return orderQueue(entries).map((e, index, ordered) => ({ ...e, position: index + 1, waitMinutes: waitAtIndex(ordered, index, now) }));
}

function barberSummary(db, barber, now) {
  const shop = db.shops.find((s) => s.id === barber.shopId);
  const reviews = db.reviews.filter((r) => r.barberId === barber.id);
  const services = db.services.filter((s) => s.barberId === barber.id);
  const queue = barberQueue(db, barber.id, now);
  const walkInWait = waitForNewcomer(queue, "walk_in", now);
  const avg = reviews.length ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : null;
  return {
    ...barber,
    shop,
    rating: avg === null ? null : Math.round(avg * 10) / 10,
    reviewCount: reviews.length,
    queueLength: queue.length,
    waitMinutes: walkInWait,
    priorityWaitMinutes: waitForNewcomer(queue, "priority", now),
    priorityFee: priorityFee(walkInWait),
    priorityWaiting: waitingPriorityCount(queue),
    priorityLimit: RULES.maxPriorityWaiting,
    priorityFull: waitingPriorityCount(queue) >= RULES.maxPriorityWaiting,
    fromPrice: services.length ? Math.min(...services.map((s) => s.price)) : null,
  };
}

function confirmState(entry, now) {
  if (entry.status !== "waiting") return null;
  if (entry.confirmedAt) return { state: "confirmed" };
  if (entry.confirmRequestedAt) {
    const deadline = entry.confirmRequestedAt + RULES.confirmWindowMinutes * MIN;
    return { state: "asked", deadline, minutesLeft: Math.max(0, Math.ceil((deadline - now) / MIN)) };
  }
  return { state: "not_yet" };
}

function publicQueueEntry(e) {
  return {
    id: e.id,
    displayName: maskName(e.customerName),
    serviceName: e.serviceName,
    type: e.type,
    status: e.status,
    position: e.position,
    waitMinutes: e.waitMinutes,
  };
}

function ticketView(db, entry, now) {
  const barber = db.barbers.find((b) => b.id === entry.barberId);
  const shop = db.shops.find((s) => s.id === barber.shopId);
  const full = withDuration(db, entry);
  const inQueue = barberQueue(db, barber.id, now).find((e) => e.id === entry.id);
  return {
    id: entry.id,
    customerName: entry.customerName,
    type: entry.type,
    status: entry.status,
    priorityFee: entry.priorityFee,
    serviceName: full.serviceName,
    duration: full.duration,
    joinedAt: entry.joinedAt,
    position: inQueue ? inQueue.position : null,
    peopleAhead: inQueue ? inQueue.position - 1 : null,
    waitMinutes: inQueue ? inQueue.waitMinutes : null,
    remainingMinutes: entry.status === "in_chair" ? remainingMinutes(full, now) : null,
    confirm: confirmState(entry, now),
    movedBack: entry.movedBack ?? 0,
    barber: { id: barber.id, name: barber.name },
    shop: { id: shop.id, name: shop.name, area: shop.area, address: shop.address },
    hasReview: db.reviews.some((r) => r.queueEntryId === entry.id),
  };
}

function requireNumber(value, label) {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) throw new ApiError(400, `${label} must be a positive whole number.`);
  return n;
}

function requireUser(ctx) {
  if (!ctx.user) throw new ApiError(401, "Log in to continue.");
  return ctx.user;
}

// A customer can only see and change their own tickets.
function ownTicket(db, ctx, ticketId) {
  const user = requireUser(ctx);
  const id = requireNumber(ticketId, "Ticket number");
  const entry = db.queueEntries.find((e) => e.id === id);
  if (!entry || entry.phone !== user.phone) throw new ApiError(404, `No ticket #${id} on your account.`);
  return entry;
}

const dateFormat = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long" });

/* ---------- phone verification helpers ---------- */

function newCode(now) {
  const code = String(Math.floor(Math.random() * 10 ** VERIFY.codeLength)).padStart(VERIFY.codeLength, "0");
  return { code, sentAt: now, expiresAt: now + VERIFY.expiresMinutes * MIN, attempts: 0 };
}

function pendingView(pending, now) {
  return {
    pendingId: pending.id,
    phoneMasked: `${pending.phone.slice(0, 3)} •••• ${pending.phone.slice(-4)}`,
    expiresAt: pending.expiresAt,
    resendAvailableAt: pending.sentAt + VERIFY.resendSeconds * 1000,
    serverNow: now,
    demoCode: pending.code, // MOCK ONLY: a real server never returns the code
  };
}

function findPending(db, pendingId) {
  const id = requireNumber(pendingId, "Sign-up id");
  const pending = db.pendingSignups.find((p) => p.id === id);
  if (!pending) throw new ApiError(404, "This sign-up has expired. Start again.");
  return pending;
}

/* ---------- endpoint handlers ---------- */

const handlers = {
  GET: {
    // Express: router.get("/shops")
    "/api/shops": (db) => db.shops,

    // Express: router.get("/barbers") -> all barbers with live wait
    "/api/barbers": (db, params, ctx) =>
      db.barbers
        .filter((b) => !params.shopId || b.shopId === Number(params.shopId))
        .map((b) => barberSummary(db, b, ctx.now)),

    // Express: router.get("/barber", req.query.id)
    "/api/barber": (db, params, ctx) => {
      const id = requireNumber(params.id, "Barber id");
      const barber = db.barbers.find((b) => b.id === id);
      if (!barber) throw new ApiError(404, `No barber with id ${id}.`);
      return {
        ...barberSummary(db, barber, ctx.now),
        services: db.services.filter((s) => s.barberId === id),
        reviews: db.reviews.filter((r) => r.barberId === id).sort((a, b) => b.createdAt - a.createdAt),
        queue: barberQueue(db, id, ctx.now).map(publicQueueEntry),
      };
    },

    // Express: router.get("/me") -> account, strikes and tickets
    "/api/me": (db, params, ctx) => {
      const user = requireUser(ctx);
      const mine = db.queueEntries.filter((e) => e.phone === user.phone).sort((a, b) => b.joinedAt - a.joinedAt);
      return {
        user: publicUser(user),
        strikes: strikeStatus(db, user.phone, ctx.now),
        activeTickets: mine.filter((e) => ACTIVE_STATUSES.includes(e.status)).map((e) => ticketView(db, e, ctx.now)),
        pastTickets: mine
          .filter((e) => !ACTIVE_STATUSES.includes(e.status))
          .slice(0, 10)
          .map((e) => ticketView(db, e, ctx.now)),
      };
    },

    // Express: router.get("/ticket", req.query.id) -> owner only
    "/api/ticket": (db, params, ctx) => ticketView(db, ownTicket(db, ctx, params.id), ctx.now),

    // Express: router.get("/queue", req.query.shopId) -> shop dashboard
    "/api/queue": (db, params, ctx) => {
      const shopId = requireNumber(params.shopId, "Shop id");
      const shop = db.shops.find((s) => s.id === shopId);
      if (!shop) throw new ApiError(404, `No shop with id ${shopId}.`);
      return {
        shop,
        barbers: db.barbers
          .filter((b) => b.shopId === shopId)
          .map((b) => ({
            ...barberSummary(db, b, ctx.now),
            queue: barberQueue(db, b.id, ctx.now).map((e) => ({
              ...publicQueueEntry(e),
              customerName: e.customerName,
              phoneEnding: e.phone.slice(-3),
              confirm: confirmState(e, ctx.now),
            })),
            servedToday: db.queueEntries.filter((e) => e.barberId === b.id && e.status === "served").length,
          })),
      };
    },
  },

  POST: {
    /*
     * Sign-up happens in two steps:
     * 1) POST /auth/register checks the details and sends a 6-digit code by SMS.
     * 2) POST /auth/verify checks the code and creates the account.
     * MOCK: no SMS is sent; the code is returned as `demoCode` and shown on screen.
     * Milestone 2 sends it through an SMS gateway and never returns it.
     */
    // Express: router.post("/auth/register", req.body)
    "/api/auth/register": (db, body, ctx) => {
      const fields = validateRegister(body);
      if (Object.keys(fields).length) throw new ApiError(400, "Some fields need attention.", fields);
      const phone = normalizePhone(body.phone);
      if (db.users.some((u) => u.phone === phone)) {
        throw new ApiError(409, "An account with this number already exists.", {
          phone: "This number already has an account. Log in instead.",
        });
      }
      db.pendingSignups = db.pendingSignups.filter((p) => p.phone !== phone); // one pending sign-up per number
      const pending = {
        id: db.nextPendingId++,
        name: String(body.name).trim(),
        phone,
        passwordHash: demoHash(body.password),
        ...newCode(ctx.now),
      };
      db.pendingSignups.push(pending);
      saveDb(db);
      return pendingView(pending, ctx.now);
    },

    // Express: router.post("/auth/resend-code", req.body)
    "/api/auth/resend-code": (db, body, ctx) => {
      const pending = findPending(db, body.pendingId);
      const waitSeconds = Math.ceil((pending.sentAt + VERIFY.resendSeconds * 1000 - ctx.now) / 1000);
      if (waitSeconds > 0) throw new ApiError(429, `Wait ${waitSeconds} seconds before asking for a new code.`);
      Object.assign(pending, newCode(ctx.now));
      saveDb(db);
      return pendingView(pending, ctx.now);
    },

    // Express: router.post("/auth/verify", req.body)
    "/api/auth/verify": (db, body, ctx) => {
      const pending = findPending(db, body.pendingId);
      const fields = validateCode(body);
      if (Object.keys(fields).length) throw new ApiError(400, "Some fields need attention.", fields);
      if (ctx.now > pending.expiresAt) {
        throw new ApiError(410, "This code has expired. Send a new one.", { code: "Code expired. Select \"Send a new code\"." });
      }
      if (pending.attempts >= VERIFY.maxAttempts) {
        throw new ApiError(429, "Too many wrong codes. Send a new one.", { code: "Too many tries. Select \"Send a new code\"." });
      }
      if (String(body.code).trim() !== pending.code) {
        pending.attempts += 1;
        saveDb(db);
        const left = VERIFY.maxAttempts - pending.attempts;
        throw new ApiError(400, "That code isn't right.", {
          code: left > 0 ? `Wrong code. ${left} ${left === 1 ? "try" : "tries"} left.` : "Too many tries. Select \"Send a new code\".",
        });
      }
      const user = { id: db.nextUserId++, name: pending.name, phone: pending.phone, passwordHash: pending.passwordHash, createdAt: ctx.now };
      db.users.push(user);
      db.pendingSignups = db.pendingSignups.filter((p) => p.id !== pending.id);
      saveDb(db);
      writeStorage(STORAGE_KEYS.session, String(user.id));
      return publicUser(user);
    },

    // Express: router.post("/auth/login", req.body)
    "/api/auth/login": (db, body) => {
      const fields = validateLogin(body);
      if (Object.keys(fields).length) throw new ApiError(400, "Some fields need attention.", fields);
      const phone = normalizePhone(body.phone);
      const user = db.users.find((u) => u.phone === phone);
      if (!user || user.passwordHash !== demoHash(body.password)) {
        throw new ApiError(401, "The phone number or password is incorrect.");
      }
      writeStorage(STORAGE_KEYS.session, String(user.id));
      return publicUser(user);
    },

    // Express: router.post("/auth/logout")
    "/api/auth/logout": () => {
      writeStorage(STORAGE_KEYS.session, null);
      return { ok: true };
    },

    // Express: router.post("/queue/join", req.body) -> logged-in customers only
    "/api/queue/join": (db, body, ctx) => {
      const user = requireUser(ctx);
      const barberId = requireNumber(body.barberId, "Barber id");
      const barber = db.barbers.find((b) => b.id === barberId);
      if (!barber) throw new ApiError(404, `No barber with id ${barberId}.`);

      const serviceIds = db.services.filter((s) => s.barberId === barberId).map((s) => s.id);
      const fields = validateJoin(body, serviceIds);
      if (Object.keys(fields).length) throw new ApiError(400, "Some fields need attention.", fields);

      const active = db.queueEntries.find((e) => e.phone === user.phone && ACTIVE_STATUSES.includes(e.status));
      if (active) {
        const other = db.barbers.find((b) => b.id === active.barberId);
        throw new ApiError(409, `You already have ticket #${active.id} in ${other.name}'s queue. Leave that queue first.`);
      }

      const strikes = strikeStatus(db, user.phone, ctx.now);
      if (strikes.blocked && body.type !== "priority") {
        throw new ApiError(
          403,
          `After ${strikes.strikes} no-shows, walk-in joining is paused until ${dateFormat.format(new Date(strikes.blockedUntil))}. You can still join as priority.`,
          { type: "Walk-in is paused on your account. Choose priority." },
        );
      }

      const queue = barberQueue(db, barberId, ctx.now);
      if (body.type === "priority" && waitingPriorityCount(queue) >= RULES.maxPriorityWaiting) {
        throw new ApiError(
          409,
          `${barber.name} already has ${RULES.maxPriorityWaiting} priority customers waiting. Priority opens again when one of them is seated.`,
          { type: "Priority is full right now. Join as walk-in." },
        );
      }
      const entry = {
        id: db.nextEntryId++,
        barberId,
        serviceId: Number(body.serviceId),
        customerName: user.name,
        phone: user.phone,
        type: body.type,
        status: "waiting",
        joinedAt: ctx.now,
        startedAt: null,
        finishedAt: null,
        priorityFee: body.type === "priority" ? priorityFee(waitForNewcomer(queue, "walk_in", ctx.now)) : 0,
        confirmRequestedAt: null,
        confirmedAt: null,
        movedBack: 0,
      };
      db.queueEntries.push(entry);
      applyConfirmationRules(db, ctx.now); // ask right away if they're already near the front
      saveDb(db);
      return ticketView(db, entry, ctx.now);
    },

    // Express: router.post("/queue/confirm", req.body) -> "I'm on my way"
    "/api/queue/confirm": (db, body, ctx) => {
      const entry = ownTicket(db, ctx, body.ticketId);
      if (entry.status !== "waiting") throw new ApiError(409, "Only waiting tickets can be confirmed.");
      entry.confirmedAt = ctx.now;
      saveDb(db);
      return ticketView(db, entry, ctx.now);
    },

    // Express: router.post("/queue/leave", req.body) -> cancel without a strike
    "/api/queue/leave": (db, body, ctx) => {
      const entry = ownTicket(db, ctx, body.ticketId);
      if (entry.status !== "waiting") throw new ApiError(409, "Only waiting tickets can be cancelled.");
      entry.status = "cancelled";
      entry.finishedAt = ctx.now;
      saveDb(db);
      return ticketView(db, entry, ctx.now);
    },

    // Express: router.post("/queue/update", req.body) -> dashboard actions
    "/api/queue/update": (db, body, ctx) => {
      const id = requireNumber(body.entryId, "Ticket number");
      const entry = db.queueEntries.find((e) => e.id === id);
      if (!entry) throw new ApiError(404, `No ticket with number ${id}.`);

      const allowed = { waiting: ["in_chair", "no_show"], in_chair: ["served"] };
      if (!(allowed[entry.status] || []).includes(body.status)) {
        throw new ApiError(409, `Ticket #${id} is already ${entry.status.replace("_", " ")}.`);
      }
      if (body.status === "in_chair") {
        const busy = db.queueEntries.some((e) => e.barberId === entry.barberId && e.status === "in_chair");
        if (busy) throw new ApiError(409, "Finish the customer in the chair before seating the next one.");
        entry.startedAt = ctx.now;
      }
      if (body.status === "served" || body.status === "no_show") entry.finishedAt = ctx.now;
      entry.status = body.status;
      saveDb(db);
      return { id: entry.id, status: entry.status, customerName: maskName(entry.customerName) };
    },

    // Express: router.post("/reviews", req.body) -> owner of a served ticket only
    "/api/reviews": (db, body, ctx) => {
      const entry = ownTicket(db, ctx, body.ticketId);
      if (entry.status !== "served") throw new ApiError(403, "Reviews open after the barber marks your visit as served.");
      if (db.reviews.some((r) => r.queueEntryId === entry.id)) throw new ApiError(409, "This visit already has a review.");

      const fields = validateReview(body);
      if (Object.keys(fields).length) throw new ApiError(400, "Some fields need attention.", fields);

      const review = {
        id: db.nextReviewId++,
        queueEntryId: entry.id,
        barberId: entry.barberId,
        customerName: maskName(entry.customerName),
        rating: Number(body.rating),
        comment: String(body.comment ?? "").trim(),
        createdAt: ctx.now,
      };
      db.reviews.push(review);
      saveDb(db);
      return review;
    },
  },
};

/* ---------- public API ---------- */

function request(method, endpoint, payload = {}) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        if (isErrorSimulationOn()) {
          throw new ApiError(503, "The server didn't respond. Check your connection and try again.");
        }
        const handler = handlers[method][endpoint];
        if (!handler) throw new ApiError(404, `Unknown endpoint ${method} ${endpoint}`);

        const db = loadDb();
        const now = Date.now();
        if (applyConfirmationRules(db, now)) saveDb(db);
        const sessionId = Number(readStorage(STORAGE_KEYS.session));
        const ctx = { now, user: db.users.find((u) => u.id === sessionId) || null };

        const result = handler(db, payload, ctx);
        resolve(JSON.parse(JSON.stringify(result))); // hand back a copy, like a real JSON response
      } catch (err) {
        reject(err instanceof ApiError ? err : new ApiError(500, "Something went wrong on the server."));
      }
    }, MOCK_DELAY_MS);
  });
}

export const get = (endpoint, params) => request("GET", endpoint, params);
export const post = (endpoint, body) => request("POST", endpoint, body);
