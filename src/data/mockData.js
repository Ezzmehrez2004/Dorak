/*
 * MOCK DATA (Milestone 1)
 * -----------------------------------------------------------------
 * Every shop, barber, service, queue entry and review below is invented
 * for demonstration. In Milestone 2 these rows move into MySQL tables
 * (shops, barbers, services, queue_entries, reviews) and are served by
 * an Express backend instead of this file. Milestone 2 adds a `users`
 * table and real password hashing (bcrypt).
 *
 * Timestamps are generated relative to "now" so the queue always looks
 * live the first time the app is opened.
 */

const MIN = 60 * 1000;
const DAY = 24 * 60 * MIN;

/*
 * DEMO-ONLY password scramble so passwords are not stored as plain text
 * in localStorage. This is NOT secure hashing; the Express backend in
 * Milestone 2 uses bcrypt instead.
 */
export function demoHash(text) {
  let h = 5381;
  for (const ch of String(text)) h = ((h << 5) + h + ch.codePointAt(0)) >>> 0;
  return `demo$${h.toString(16)}`;
}

// Demo accounts, listed in the README and on the login page. Password for all: demo1234
// Two account types: customers book and follow queues; owners manage their own shop.
const DEMO_PASSWORD = "demo1234";
const users = [
  { id: 1, role: "customer", shopId: null, name: "Demo Customer", phone: "01000000001" },
  { id: 2, role: "customer", shopId: null, name: "Nour Hany", phone: "01000000002" },
  { id: 3, role: "owner", shopId: 1, name: "Magdy Fawzy", phone: "01000000011" },
  { id: 4, role: "owner", shopId: 2, name: "Tarek Selim", phone: "01000000012" },
  { id: 5, role: "owner", shopId: 3, name: "Nabil Kamel", phone: "01000000013" },
];

const shops = [
  { id: 1, name: "Salon El Ostaz", area: "Nasr City", address: "14 Abbas El Akkad St.", hours: "12 pm to 12 am" },
  { id: 2, name: "Gentlemen's Corner", area: "Maadi", address: "Road 9, near the metro", hours: "1 pm to 1 am" },
  { id: 3, name: "Kasr El Shaar", area: "Heliopolis", address: "Baghdad St., Korba", hours: "11 am to 11 pm" },
];

const barbers = [
  { id: 1, shopId: 1, name: "Hassan Fouad", specialty: "Skin fades", years: 12 },
  { id: 2, shopId: 1, name: "Sherif Adel", specialty: "Classic scissor cuts", years: 20 },
  { id: 3, shopId: 2, name: "Mido Saber", specialty: "Beard sculpting", years: 7 },
  { id: 4, shopId: 2, name: "Ramy Lotfy", specialty: "Textured crops", years: 4 },
  { id: 5, shopId: 3, name: "Am Sayed", specialty: "Hot towel shaves", years: 31 },
  { id: 6, shopId: 3, name: "Karim Hosny", specialty: "Kids' cuts", years: 6 },
  { id: 7, shopId: 3, name: "Youssef Nader", specialty: "Skin fades", years: 2 },
];

// Every barber offers the same three services; prices scale with experience.
const serviceTemplates = [
  { name: "Haircut", duration: 25, basePrice: 150 },
  { name: "Beard trim", duration: 15, basePrice: 80 },
  { name: "Haircut and beard", duration: 40, basePrice: 200 },
];

function buildServices() {
  const list = [];
  let id = 1;
  for (const barber of barbers) {
    const multiplier = barber.years >= 20 ? 1.5 : barber.years >= 7 ? 1.25 : 1;
    for (const t of serviceTemplates) {
      list.push({
        id: id++,
        barberId: barber.id,
        name: t.name,
        duration: t.duration,
        price: Math.round((t.basePrice * multiplier) / 10) * 10,
      });
    }
  }
  return list;
}

// Helper: service id for a barber by template index (0 haircut, 1 beard, 2 both).
const sid = (barberId, templateIndex) => (barberId - 1) * 3 + templateIndex + 1;

export function createInitialDb(now = Date.now()) {
  const services = buildServices();
  let nextId = 90;

  const entry = (barberId, templateIndex, customerName, minutesAgo, extra = {}) => ({
    id: nextId++,
    barberId,
    serviceId: sid(barberId, templateIndex),
    customerName,
    phone: `0100000${String(nextId).padStart(4, "0")}`,
    type: "walk_in",
    status: "waiting",
    joinedAt: now - minutesAgo * MIN,
    startedAt: null,
    finishedAt: null,
    priorityFee: 0,
    confirmRequestedAt: null, // when the app asked "are you on your way?"
    confirmedAt: null, // when the customer confirmed
    movedBack: 0, // times moved back for not confirming
    ...extra,
  });

  // Customers near the front in the seed data have already confirmed they're on the way.
  const live = (extra = {}) => ({ confirmRequestedAt: now - 2 * MIN, confirmedAt: now - MIN, ...extra });

  const queueEntries = [
    // Finished visits (these have reviews below)
    entry(1, 0, "Omar Khaled", 600, { status: "served", startedAt: now - 590 * MIN, finishedAt: now - 565 * MIN }),
    entry(1, 2, "Ziad Tarek", 420, { status: "served", startedAt: now - 410 * MIN, finishedAt: now - 370 * MIN }),
    entry(2, 0, "Amr Wael", 300, { status: "served", startedAt: now - 295 * MIN, finishedAt: now - 270 * MIN }),
    entry(3, 1, "Tamer Gamal", 500, { status: "served", startedAt: now - 490 * MIN, finishedAt: now - 475 * MIN }),
    entry(5, 2, "Hossam Ashraf", 700, { status: "served", startedAt: now - 690 * MIN, finishedAt: now - 650 * MIN }),
    entry(5, 0, "Mahmoud Fathy", 240, { status: "served", startedAt: now - 230 * MIN, finishedAt: now - 205 * MIN }),
    entry(6, 0, "Ali Samir", 360, { status: "served", startedAt: now - 350 * MIN, finishedAt: now - 325 * MIN }),
    // Two recent no-shows for Nour Hany (demo account 2): walk-ins are blocked for her
    entry(4, 0, "Nour Hany", 200, { status: "no_show", phone: "01000000002", finishedAt: now - 170 * MIN }),
    entry(6, 1, "Nour Hany", 3 * 24 * 60, { status: "no_show", phone: "01000000002", finishedAt: now - 3 * DAY + 30 * MIN }),
    // Served visit WITHOUT a review for the demo account: ticket 99, used to demo the review form
    entry(7, 0, "Demo Customer", 90, {
      status: "served",
      phone: "01000000001",
      startedAt: now - 80 * MIN,
      finishedAt: now - 55 * MIN,
    }),
    // Live queues
    entry(1, 2, "Mostafa Hany", 35, { status: "in_chair", startedAt: now - 12 * MIN }),
    entry(1, 0, "Karim Nabil", 28),
    entry(1, 1, "Youssef Adel", 20),
    entry(1, 0, "Seif Ramadan", 9, live({ type: "priority", priorityFee: 35 })),
    entry(1, 2, "Adham Magdy", 4),
    entry(2, 0, "Ehab Mansour", 15, { status: "in_chair", startedAt: now - 5 * MIN }),
    entry(2, 1, "Fady Raouf", 6, live()),
    entry(3, 2, "Bassem Ezzat", 22, { status: "in_chair", startedAt: now - 18 * MIN }),
    entry(3, 0, "Hany Shaker", 14, live()),
    // Mido Saber has 2 priority customers waiting: priority is full for him
    entry(3, 2, "Waleed Saad", 11, live({ type: "priority", priorityFee: 30 })),
    entry(3, 0, "Islam Fawzy", 3, { type: "priority", priorityFee: 30 }),
    entry(5, 0, "Sameh Labib", 10, { status: "in_chair", startedAt: now - 8 * MIN }),
    entry(6, 0, "Marwan Ayman", 7, live()),
    // Barbers 4 and 7 have nobody waiting: shows the "no wait" and empty states
  ];

  // New tickets continue numbering after the mock entries.
  const firstNewId = nextId;

  const reviews = [
    { id: 1, queueEntryId: 90, barberId: 1, customerName: "Omar K.", rating: 5, comment: "Cleanest fade I've had. Worth the wait.", createdAt: now - 560 * MIN },
    { id: 2, queueEntryId: 91, barberId: 1, customerName: "Ziad T.", rating: 4, comment: "Great cut, a bit slow on the beard.", createdAt: now - 365 * MIN },
    { id: 3, queueEntryId: 92, barberId: 2, customerName: "Amr W.", rating: 5, comment: "Old-school scissor work. Knows exactly what he's doing.", createdAt: now - 265 * MIN },
    { id: 4, queueEntryId: 93, barberId: 3, customerName: "Tamer G.", rating: 4, comment: "", createdAt: now - 470 * MIN },
    { id: 5, queueEntryId: 94, barberId: 5, customerName: "Hossam A.", rating: 5, comment: "The hot towel shave alone is worth the trip.", createdAt: now - 645 * MIN },
    { id: 6, queueEntryId: 95, barberId: 5, customerName: "Mahmoud F.", rating: 5, comment: "Been coming to him for ten years.", createdAt: now - 200 * MIN },
    { id: 7, queueEntryId: 96, barberId: 6, customerName: "Ali S.", rating: 4, comment: "Patient with my son, good result.", createdAt: now - 320 * MIN },
  ];

  return {
    users: users.map((u) => ({ ...u, passwordHash: demoHash(DEMO_PASSWORD), createdAt: now - 30 * DAY })),
    nextUserId: users.length + 1,
    pendingSignups: [], // sign-ups waiting for their SMS code (mock: code shown on screen)
    nextPendingId: 1,
    shops,
    barbers,
    services,
    queueEntries,
    reviews,
    nextEntryId: firstNewId,
    nextReviewId: reviews.length + 1,
  };
}
