import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { get, post } from "../api/api.js";
import ReviewForm from "../components/ReviewForm.jsx";
import { EmptyState, ErrorState, LoadingState } from "../components/States.jsx";
import TicketCard from "../components/TicketCard.jsx";
import TicketList from "../components/TicketList.jsx";
import { POLL_MS, RULES } from "../config.js";
import { useApi } from "../hooks/useApi.js";

const timeFormat = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

// Routes "/my-turn" (your tickets) and "/my-turn/:ticketId" (one live ticket).
// Both require a logged-in customer (see RequireAuth in App.jsx).
export default function MyTurnPage() {
  const { ticketId } = useParams();
  return <div className="container py-4 dk-narrow">{ticketId ? <LiveTicket ticketId={ticketId} /> : <MyTickets />}</div>;
}

function MyTickets() {
  const { data: me, loading, error, reload } = useApi(() => get("/api/me"), []);

  if (loading && !me) return <LoadingState label="Loading your tickets…" />;
  if (error && !me) return <ErrorState message={error.message} onRetry={reload} />;

  // One active ticket: go straight to it.
  if (me.activeTickets.length === 1) return <Navigate to={`/my-turn/${me.activeTickets[0].id}`} replace />;

  return (
    <>
      <h1 className="dk-page-title">My turn</h1>
      <TicketList
        tickets={me.activeTickets}
        emptyTitle="You're not in any queue"
        emptyMessage="Join a barber's queue and your place shows up here."
        emptyAction={
          <Link to="/" className="btn btn-primary btn-sm">
            Find a barber
          </Link>
        }
      />
      <p className="small text-secondary mt-3">
        Looking for an old visit? See <Link to="/account">your account</Link>.
      </p>
    </>
  );
}

function LiveTicket({ ticketId }) {
  const { data: fetched, loading, error, reload, updatedAt } = useApi(() => get("/api/ticket", { id: ticketId }), [ticketId], {
    pollMs: POLL_MS,
  });
  const [justReviewed, setJustReviewed] = useState(false);
  const [action, setAction] = useState({ busy: null, message: null, kind: null });
  // Ticket returned by confirm/leave, shown until the next refresh arrives.
  const [latest, setLatest] = useState(null);

  useEffect(() => {
    setLatest(null);
  }, [updatedAt]);

  const run = async (endpoint, busy, successText) => {
    setAction({ busy, message: null, kind: null });
    try {
      const result = await post(endpoint, { ticketId: Number(ticketId) });
      setLatest(result);
      setAction({ busy: null, message: successText, kind: "success" });
    } catch (err) {
      setAction({ busy: null, message: err.message, kind: "danger" });
    }
  };

  const leave = () => {
    if (window.confirm("Leave the queue? Leaving early doesn't count as a no-show.")) {
      run("/api/queue/leave", "leave", "You left the queue. No strike was added.");
    }
  };

  const ticket = latest ?? fetched;

  if (loading && !ticket) return <LoadingState label="Loading your ticket…" />;

  if (error && !ticket) {
    if (error.status === 404 || error.status === 400) {
      return (
        <EmptyState title={`Ticket #${ticketId} isn't on your account`} message="Check the number, or open your tickets.">
          <Link to="/my-turn" className="btn btn-primary btn-sm">
            My tickets
          </Link>
        </EmptyState>
      );
    }
    return <ErrorState message={error.message} onRetry={reload} />;
  }

  const waiting = ticket.status === "waiting";
  const confirm = ticket.confirm;

  return (
    <>
      <h1 className="dk-page-title">My turn</h1>

      {error && (
        <div className="alert alert-warning py-2" role="status">
          Couldn't refresh your place. Showing the last update.
        </div>
      )}

      <div aria-live="polite">
        {action.message && (
          <div className={`alert alert-${action.kind} py-2`} role={action.kind === "danger" ? "alert" : "status"}>
            {action.message}
          </div>
        )}

        {waiting && confirm?.state === "asked" && (
          <div className="dk-confirm mb-3" role="alert">
            <p className="dk-confirm__title mb-1">You're almost up. Are you on your way?</p>
            <p className="mb-2">
              Confirm within <strong>{confirm.minutesLeft} min</strong> or you'll move to the back of the line.
            </p>
            {ticket.movedBack > 0 && (
              <p className="mb-2 fw-semibold">You were already moved back once. Missing this one counts as a no-show.</p>
            )}
            <button type="button" className="btn btn-primary" onClick={() => run("/api/queue/confirm", "confirm", "Confirmed. The barber knows you're coming.")} disabled={!!action.busy}>
              {action.busy === "confirm" ? "Confirming…" : "I'm on my way"}
            </button>
          </div>
        )}

        {waiting && ticket.movedBack > 0 && confirm?.state !== "asked" && (
          <div className="alert alert-info py-2" role="status">
            You were moved back once because you didn't confirm in time. Missing the next confirmation counts as a no-show.
          </div>
        )}
      </div>

      <TicketCard ticket={ticket} />

      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-3 small text-secondary">
        <span>
          Updates automatically. Last update {updatedAt ? timeFormat.format(updatedAt) : "just now"}.
        </span>
        <div className="d-flex gap-2">
          <button type="button" className="btn btn-outline-primary btn-sm" onClick={reload} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh now"}
          </button>
          {waiting && (
            <button type="button" className="btn btn-outline-danger btn-sm" onClick={leave} disabled={!!action.busy}>
              {action.busy === "leave" ? "Leaving…" : "Leave the queue"}
            </button>
          )}
        </div>
      </div>

      {waiting && confirm?.state === "not_yet" && (
        <p className="small text-secondary mt-3">
          When you're 2nd in line we'll ask you to confirm you're on your way. You'll have {RULES.confirmWindowMinutes} minutes.
        </p>
      )}

      <div className="mt-4">
        {ticket.status === "served" && !ticket.hasReview && !justReviewed && (
          <ReviewForm
            ticketId={ticket.id}
            barberName={ticket.barber.name}
            onSubmitted={() => {
              setJustReviewed(true);
              reload();
            }}
          />
        )}
        {(justReviewed || (ticket.status === "served" && ticket.hasReview)) && (
          <div className="alert alert-success" role="status">
            Thanks for your review. It's on{" "}
            <Link to={`/barbers/${ticket.barber.id}`} className="alert-link">
              {ticket.barber.name}'s profile
            </Link>{" "}
            as a verified visit.
          </div>
        )}
        {(ticket.status === "no_show" || ticket.status === "cancelled") && (
          <Link to={`/barbers/${ticket.barber.id}/join`} className="btn btn-primary">
            Join {ticket.barber.name}'s queue again
          </Link>
        )}
      </div>
    </>
  );
}
