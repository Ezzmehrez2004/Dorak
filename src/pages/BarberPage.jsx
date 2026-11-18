import { Link, useParams } from "react-router-dom";
import { get } from "../api/api.js";
import QueueList from "../components/QueueList.jsx";
import ReviewList from "../components/ReviewList.jsx";
import StarRating from "../components/StarRating.jsx";
import { EmptyState, ErrorState, LoadingState } from "../components/States.jsx";
import WaitBadge from "../components/WaitBadge.jsx";
import { POLL_MS } from "../config.js";
import { useApi } from "../hooks/useApi.js";
import { formatMinutes } from "../utils/queue.js";

const timeFormat = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

// Route "/barbers/:barberId": profile, services, live queue and reviews.
export default function BarberPage() {
  const { barberId } = useParams();
  const { data: barber, loading, error, reload, updatedAt } = useApi(() => get("/api/barber", { id: barberId }), [barberId], {
    pollMs: POLL_MS,
  });

  if (loading && !barber) return <div className="container py-4"><LoadingState label="Loading barber…" /></div>;

  if (error && !barber) {
    return (
      <div className="container py-4">
        {error.status === 404 || error.status === 400 ? (
          <EmptyState title="We couldn't find that barber" message="The link may be wrong, or the barber has left Dorak.">
            <Link to="/" className="btn btn-primary btn-sm">
              Find a barber
            </Link>
          </EmptyState>
        ) : (
          <ErrorState message={error.message} onRetry={reload} />
        )}
      </div>
    );
  }

  return (
    <div className="container py-4">
      <nav aria-label="Breadcrumb">
        <ol className="breadcrumb small">
          <li className="breadcrumb-item">
            <Link to="/">Find a barber</Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            {barber.name}
          </li>
        </ol>
      </nav>

      <div className="row g-4">
        <div className="col-12 col-lg-7">
          <header className="mb-4">
            <h1 className="dk-page-title mb-1">{barber.name}</h1>
            <p className="mb-2 text-secondary">
              {barber.shop.name}, {barber.shop.address}, {barber.shop.area}. Open {barber.shop.hours}.
            </p>
            <p className="mb-2">
              {barber.specialty}, {barber.years} {barber.years === 1 ? "year" : "years"} cutting hair
            </p>
            <StarRating value={barber.rating} count={barber.reviewCount} />
          </header>

          <section className="mb-4" aria-labelledby="services-heading">
            <h2 id="services-heading" className="h5">
              Services
            </h2>
            <div className="table-responsive">
              <table className="table dk-table align-middle mb-0">
                <thead>
                  <tr>
                    <th scope="col">Service</th>
                    <th scope="col">Time</th>
                    <th scope="col" className="text-end">
                      Price
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {barber.services.map((s) => (
                    <tr key={s.id}>
                      <td>{s.name}</td>
                      <td>{s.duration} min</td>
                      <td className="text-end">{s.price} EGP</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section aria-labelledby="reviews-heading">
            <h2 id="reviews-heading" className="h5">
              Reviews
            </h2>
            <ReviewList reviews={barber.reviews} />
          </section>
        </div>

        <div className="col-12 col-lg-5">
          <aside className="card dk-card dk-sticky" aria-labelledby="queue-heading">
            <div className="card-body">
              <h2 id="queue-heading" className="h5">
                Live queue
              </h2>
              <WaitBadge minutes={barber.waitMinutes} queueLength={barber.queueLength} size="lg" />

              {error && (
                <div className="alert alert-warning py-2 mt-3 mb-0 small" role="status">
                  Couldn't refresh the queue. Showing the last update.
                </div>
              )}

              <div className="d-grid gap-2 my-3">
                <Link to={`/barbers/${barber.id}/join`} className="btn btn-primary btn-lg">
                  Join the queue
                </Link>
              </div>
              {barber.priorityFull ? (
                <p className="small mb-3">
                  Priority is full right now: {barber.priorityLimit} priority customers are already waiting. It opens again
                  when one of them is seated, so walk-ins aren't pushed back endlessly.
                </p>
              ) : (
                <p className="small mb-3">
                  In a hurry? Priority customers are served before walk-ins. Right now it costs{" "}
                  <strong>{barber.priorityFee} EGP</strong> and cuts your wait to{" "}
                  {barber.priorityWaitMinutes <= 0 ? "almost nothing" : `about ${formatMinutes(barber.priorityWaitMinutes)}`}. Limited to{" "}
                  {barber.priorityLimit} at a time ({barber.priorityLimit - barber.priorityWaiting} left).
                </p>
              )}

              <QueueList entries={barber.queue} />

              <div className="d-flex justify-content-between align-items-center mt-3 small text-secondary">
                <span aria-live="polite">Updated {updatedAt ? timeFormat.format(updatedAt) : "just now"}</span>
                <button type="button" className="btn btn-link btn-sm p-0" onClick={reload}>
                  Refresh now
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
