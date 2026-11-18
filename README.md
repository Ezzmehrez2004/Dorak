# Dorak (دورك): live barber queues

Milestone 1 frontend for the Web-Based Design course project.
Customers pick a barber, see the live wait, join the queue from their phone and follow their place in line. Shop owners manage each barber's queue from a dashboard. Customers leave verified reviews after a visit.

Customers have accounts, with the mobile number as the account identity, checked with a 6-digit SMS code at sign-up. Three fair-queue rules reduce no-shows and fake bookings:
- **On my way:** when you're 2nd in line, you must confirm within 10 minutes, or you move to the back of the line. Missing twice counts as a no-show.
- **Strikes:** 2 no-shows in 30 days pause walk-in joining for 7 days. Priority joining still works.
- **Leave free:** leaving the queue early never counts as a no-show.

**Student:** [Your full name] ([Your student ID]), solo project.

**Live site:** https://ezzmehrez2004.github.io/Dorak/ (GitHub Pages, rebuilt automatically on every push to `main`). Also deployed at https://dorak-barber.netlify.app.

> **Mock data notice.** This milestone has no server. Every shop, barber, service, queue entry and review is mock data defined in `src/data/mockData.js` and served by a mock API in `src/api/api.js`. Changes are saved in the browser's localStorage, including accounts, joining a queue, dashboard actions and reviews. Customer login is mocked: the logged-in user is kept in localStorage instead of a server session, and passwords are scrambled with a demo-only function, not real hashing. **SMS verification is mocked too:** no text message is sent; the 6-digit code is shown on screen in a box labeled "Demo build". Shop owners have no login yet: on the dashboard a shop selector stands in for signing in. Priority fees are calculated and displayed, but no payment is taken. Milestone 2 replaces the mock API with an Express + MySQL backend.

## Demo accounts

| Mobile number | Password | Use it to show |
| --- | --- | --- |
| `01000000001` | `demo1234` | A regular customer with a finished visit to review (ticket #99) |
| `01000000002` | `demo1234` | A customer with 2 no-shows: walk-in joining is paused |

You can also create a new account at `/signup`.

## Requirements

- Node.js 18 or newer (check with `node -v`)
- npm (comes with Node)

## Install and run

```bash
npm install
npm run dev
```

Vite prints a local address (normally http://localhost:5173) and opens it in your browser.

Other scripts:

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Build a production version into `dist/` |
| `npm run preview` | Serve the production build locally |

## Technologies and versions

Exact versions are pinned in `package.json`.

| Package | Version | Used for |
| --- | --- | --- |
| react, react-dom | 18.3.1 | Components, props and state |
| react-router-dom | 6.28.0 | Navigation bar and routed views |
| bootstrap | 5.3.3 | CSS framework: grid, forms, buttons, alerts, responsive navbar |
| vite | 5.4.11 | Development server and build (as in the course workshops) |
| @vitejs/plugin-react | 4.3.4 | JSX support for Vite |

Bootstrap's CSS is imported once in `src/main.jsx`. `src/styles/theme.css` overrides Bootstrap's color and font variables so the whole app uses one consistent theme. The Cairo font is loaded from Google Fonts, with system fonts as fallback.

## Routes

| Route | Page component | What it shows |
| --- | --- | --- |
| `/` | `HomePage` | Search, filter by area and sort barbers; each card shows rating and live wait |
| `/barbers/:barberId` | `BarberPage` | Profile, services and prices, live queue, priority fee, verified reviews |
| `/login` | `LoginPage` | Log in with mobile number and password |
| `/signup` | `SignupPage` | Step 1: details and agreement to the fair queue rules. Step 2: 6-digit SMS code |
| `/barbers/:barberId/join` | `JoinQueuePage` | Join-queue form: service and walk-in or priority (login required) |
| `/my-turn` | `MyTurnPage` | Your active tickets; opens the ticket directly if you have one (login required) |
| `/my-turn/:ticketId` | `MyTurnPage` | Live ticket: position, wait, "I'm on my way", leave queue, review after the visit (login required) |
| `/account` | `AccountPage` | Profile, queue standing (strikes), tickets and past visits, log out (login required) |
| `/dashboard` | `DashboardPage` | Shop owner view: seat, mark served or no-show; shows who confirmed they're on the way |
| `*` | `NotFoundPage` | Friendly 404 with a link home |

## Components

| Component | Responsibility | Used in |
| --- | --- | --- |
| `NavBar` | Main navigation; shows Log in / Sign up or the account link; collapses on small screens | `App` |
| `RequireAuth` | Sends logged-out visitors to `/login`, then back to the page they wanted | `App` routes |
| `VerifyCodeForm` | Enter the SMS code, with resend countdown, attempt limit and "Change number" | `SignupPage` |
| `TicketList` | A customer's tickets with status, linking to each live ticket | `MyTurnPage`, `AccountPage` |
| `Footer` | Mock-data label and demo tools (simulate server error, reset data) | `App` |
| `BarberCard` | One barber in search results, links to the profile | `HomePage` |
| `WaitBadge` | Live wait and people in line, colored short / medium / long | `BarberCard`, `BarberPage`, `DashboardPage` |
| `StarRating` | Read-only star rating with screen-reader text | `BarberCard`, `BarberPage` |
| `QueueList` | Ordered queue; read-only on profiles, with action buttons on the dashboard | `BarberPage`, `DashboardPage` |
| `TicketCard` | The customer's ticket: number, position, wait, confirmation, barber and shop | `JoinQueuePage`, `MyTurnPage` |
| `ReviewList` | Verified reviews, with an empty state | `BarberPage` |
| `ReviewForm` | Star rating and comment form, with validation | `MyTurnPage` |
| `FormField` | Label, control, hint and error message wired for accessibility | `LoginPage`, `SignupPage`, `VerifyCodeForm`, `JoinQueuePage`, `ReviewForm` |
| `LoadingState`, `ErrorState`, `EmptyState` | Consistent loading, error and empty states | All pages |

Supporting modules:

| File | Purpose |
| --- | --- |
| `src/api/api.js` | Mock `get()` / `post()` API with the same endpoints planned for Express, including the fair-queue rules |
| `src/context/AuthContext.jsx` | Logged-in customer for the whole app: `login`, `register`, `verifyCode`, `resendCode`, `logout` |
| `src/hooks/useApi.js` | Loads data, tracks loading and error, optional live polling |
| `src/hooks/useForm.js` | Controlled-form state, validation timing and focus on the first error |
| `src/utils/queue.js` | Queue order, wait estimate and priority fee (the advanced feature) |
| `src/utils/validation.js` | Validation rules shared by the forms and the mock API |
| `src/data/mockData.js` | All mock data |
| `src/config.js` | Polling interval, mock delay, storage keys and the fair-queue rule numbers |

## Advanced feature: live estimated wait

Each barber's queue is ordered: the customer in the chair first, then priority customers, then walk-ins, each group by arrival time. A customer's estimated wait is the sum of the remaining service times of everyone ahead. For the person in the chair, only the time left on their service counts. Pages that show the queue refresh every 30 seconds, and have a "Refresh now" button.

The priority fee depends on demand: 20 EGP plus 5 EGP for every 15 minutes of walk-in wait, capped at 150 EGP. The formula is a business assumption to be tested.

Each barber can have at most **2 priority customers waiting at a time**, so walk-ins are never pushed back endlessly. When both spots are taken, the priority option is disabled until one of them is seated (the mock server also rejects it). In the demo data, Mido Saber's priority is full.

## Acceptance demo (Milestone 1 checks)

1. **Complete navigation path:**
   1. On Find a barber, open Hassan Fouad and select **Join the queue**. You're sent to Log in.
   2. Select **Create an account**, fill in your details, then enter the 6-digit code shown in the demo box. You return to the join form.
   3. Join, then select **Track my turn**.
   4. Use the navbar to reach **Account** and **Shop dashboard**.
2. **Valid form submissions:** create an account (details, then SMS code), join a queue, post a review.
3. **Invalid input feedback:**
   - Submit Sign up empty, or with passwords that don't match.
   - Enter a wrong SMS code: the form says how many tries are left. **Send a new code** unlocks after 30 seconds.
   - Log in with a wrong password.
   - Submit the join form without a service: a summary lists the problem and links to the field.
   - Choose Priority without ticking the fee box.
   - Try to join a second queue while you already have a ticket.
4. **Fair-queue rules:**
   - Join Ramy Lotfy, who has an empty queue. You're immediately asked "Are you on your way?". Confirm, then check the dashboard (Gentlemen's Corner) for the "On the way" badge.
   - **Leave the queue** on a ticket: no strike is added.
   - Log in as `01000000002`: walk-in is disabled on the join form, and Account shows walk-in joining as paused.
   - Open Mido Saber: priority is full (2 of 2), so only walk-in is available. Join Hassan Fouad as priority to fill his last spot.
5. **Loading, empty, success and error states:**
   - Loading: a spinner appears on every page while the mock API responds (about half a second).
   - Empty: search for `zzz`; open My turn with no active ticket; open a barber with no queue.
   - Success: after signing up, joining, confirming, reviewing, or using a dashboard action.
   - Error: turn on **Simulate server error** in the footer and reload any page. Turn it off and select **Try again** to recover.
6. **Review flow:** log in as `01000000001` and open `/my-turn/99`, a finished visit with no review yet. Post a rating and it appears on Youssef Nader's profile.
7. **Responsive check:** use your browser's developer tools device toolbar at 375 px, 768 px and 1440 px. See `docs/screenshots/README.md`.

**Reset demo data** in the footer restores the original mock data and logs you out.

## Accessibility

- Semantic landmarks: `header`, `nav`, `main`, `footer`, `section`, and headings in order.
- A "Skip to main content" link appears on the first Tab.
- Every input has a visible `<label>`. Errors are linked with `aria-describedby` and marked with `aria-invalid`.
- Error summaries use `role="alert"`; status updates use `aria-live`.
- Visible focus outline (brass color) on every interactive element.
- Fully keyboard operable, including the star rating (arrow keys) and the mobile menu.
- Color is never the only signal: wait badges and ticket states also use text.
- Animations are disabled when the user's system requests reduced motion.

## Project structure

```
dorak/
├── index.html
├── package.json
├── vite.config.js
├── public/favicon.svg
├── docs/screenshots/        screenshots at 375, 768 and 1440 px
└── src/
    ├── main.jsx             entry: Bootstrap, theme, BrowserRouter, AuthProvider
    ├── App.jsx              layout and route table
    ├── config.js
    ├── api/api.js           mock API (replaced in Milestone 2)
    ├── context/AuthContext.jsx
    ├── data/mockData.js     mock data
    ├── hooks/               useApi, useForm
    ├── utils/               queue math, validation
    ├── components/          reusable components
    ├── pages/               one component per route
    └── styles/theme.css
```

## Milestone 2 plan

Replace `request()` in `src/api/api.js` with `fetch()` calls to an Express server, using these endpoints:
- Accounts: `POST /api/auth/register` (sends SMS code), `POST /api/auth/verify`, `POST /api/auth/resend-code`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/me`
- Browsing: `GET /api/shops`, `GET /api/barbers`, `GET /api/barber?id=`
- Tickets: `GET /api/ticket?id=`, `POST /api/queue/join`, `POST /api/queue/confirm`, `POST /api/queue/leave`
- Dashboard: `GET /api/queue?shopId=`, `POST /api/queue/update`
- Reviews: `POST /api/reviews`

The handlers in `api.js` already show what each endpoint returns and which rules it enforces. The data moves into seven MySQL tables: `users`, `phone_verifications`, `shops`, `barbers`, `services`, `queue_entries` and `reviews`. Passwords will be hashed with bcrypt, and the logged-in user kept in a server session. Verification codes will be sent through an SMS gateway; the server will stop returning `demoCode`.
