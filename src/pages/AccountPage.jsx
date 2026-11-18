import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { get } from "../api/api.js";
import { ErrorState, LoadingState } from "../components/States.jsx";
import TicketList from "../components/TicketList.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useApi } from "../hooks/useApi.js";

const dateFormat = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long" });

// Route "/account": profile, no-show standing and visit history.
export default function AccountPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { data: me, loading, error, reload } = useApi(() => get("/api/me"), []);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      navigate("/");
    } catch {
      setLoggingOut(false);
    }
  };

  if (loading && !me) return <div className="container py-4"><LoadingState label="Loading your account…" /></div>;
  if (error && !me) return <div className="container py-4"><ErrorState message={error.message} onRetry={reload} /></div>;

  const { user, strikes } = me;
  const masked = `${user.phone.slice(0, 3)} •••• ${user.phone.slice(-4)}`;

  return (
    <div className="container py-4 dk-narrow">
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-3">
        <div>
          <h1 className="dk-page-title mb-0">{user.name}</h1>
          <p className="text-secondary mb-0">{masked}</p>
        </div>
        <button type="button" className="btn btn-outline-primary" onClick={handleLogout} disabled={loggingOut}>
          {loggingOut ? "Logging out…" : "Log out"}
        </button>
      </div>

      <section className="mb-4" aria-labelledby="standing-heading">
        <h2 id="standing-heading" className="h5">
          Queue standing
        </h2>
        {strikes.blocked ? (
          <div className="alert alert-danger" role="status">
            <p className="fw-semibold mb-1">Walk-in joining is paused until {dateFormat.format(new Date(strikes.blockedUntil))}.</p>
            <p className="mb-0">
              You missed {strikes.strikes} turns in the last {strikes.windowDays} days. You can still join as priority.
            </p>
          </div>
        ) : (
          <div className={`alert ${strikes.strikes ? "alert-warning" : "alert-success"}`} role="status">
            {strikes.strikes === 0
              ? "Good standing: no missed turns."
              : `${strikes.strikes} of ${strikes.limit} missed turns in the last ${strikes.windowDays} days. One more pauses walk-in joining.`}
          </div>
        )}
      </section>

      <section className="mb-4" aria-labelledby="active-heading">
        <h2 id="active-heading" className="h5">
          In line now
        </h2>
        <TicketList
          tickets={me.activeTickets}
          emptyTitle="You're not in any queue"
          emptyAction={
            <Link to="/" className="btn btn-primary btn-sm">
              Find a barber
            </Link>
          }
        />
      </section>

      <section aria-labelledby="history-heading">
        <h2 id="history-heading" className="h5">
          Past visits
        </h2>
        <TicketList tickets={me.pastTickets} emptyTitle="No visits yet" emptyMessage="Visits appear here after you join a queue." />
      </section>
    </div>
  );
}
