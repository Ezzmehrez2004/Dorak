import { useEffect, useState } from "react";
import { get, post } from "../api/api.js";
import QueueList from "../components/QueueList.jsx";
import { ErrorState, LoadingState } from "../components/States.jsx";
import WaitBadge from "../components/WaitBadge.jsx";
import { POLL_MS } from "../config.js";
import { useApi } from "../hooks/useApi.js";

/*
 * Route "/dashboard": the shop owner's view of every barber's queue.
 * Milestone 1 has no login; the shop selector stands in for signing in.
 */
export default function DashboardPage() {
  const shops = useApi(() => get("/api/shops"), []);
  const [shopId, setShopId] = useState("");
  const [pendingId, setPendingId] = useState(null);
  const [notice, setNotice] = useState(null); // { kind: "success" | "danger", text }

  // Pick the first shop once the list arrives.
  useEffect(() => {
    if (shops.data?.length && !shopId) setShopId(String(shops.data[0].id));
  }, [shops.data, shopId]);

  const queue = useApi(() => get("/api/queue", { shopId }), [shopId], { pollMs: POLL_MS, skip: !shopId });

  const act = async (entry, status, message) => {
    setPendingId(entry.id);
    setNotice(null);
    try {
      await post("/api/queue/update", { entryId: entry.id, status });
      setNotice({ kind: "success", text: message });
      queue.reload();
    } catch (err) {
      setNotice({ kind: "danger", text: err.message });
    } finally {
      setPendingId(null);
    }
  };

  const renderActions = (barber) => (entry) => {
    const busy = pendingId === entry.id;
    const name = entry.customerName;
    if (entry.status === "in_chair") {
      return (
        <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={() => act(entry, "served", `${name} marked as served.`)}>
          {busy ? "Saving…" : "Mark served"}
        </button>
      );
    }
    const chairBusy = barber.queue.some((e) => e.status === "in_chair");
    const firstWaiting = barber.queue.find((e) => e.status === "waiting");
    return (
      <div className="d-flex gap-2">
        {firstWaiting?.id === entry.id && (
          <button
            type="button"
            className="btn btn-outline-primary btn-sm"
            disabled={busy || chairBusy}
            title={chairBusy ? "Finish the customer in the chair first" : undefined}
            onClick={() => act(entry, "in_chair", `${name} is now in the chair.`)}
          >
            Seat now
          </button>
        )}
        <button type="button" className="btn btn-outline-danger btn-sm" disabled={busy} onClick={() => act(entry, "no_show", `${name} marked as no-show.`)}>
          No-show
        </button>
      </div>
    );
  };

  return (
    <div className="container py-4">
      <h1 className="dk-page-title">Shop dashboard</h1>

      {shops.loading && <LoadingState label="Loading shops…" />}
      {shops.error && <ErrorState message={shops.error.message} onRetry={shops.reload} />}

      {shops.data && (
        <div className="row g-3 align-items-end mb-3">
          <div className="col-12 col-sm-8 col-md-5">
            <label htmlFor="shop-select" className="form-label">
              Your shop
            </label>
            <select id="shop-select" className="form-select" value={shopId} onChange={(e) => setShopId(e.target.value)} aria-describedby="shop-select-hint">
              {shops.data.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}, {s.area}
                </option>
              ))}
            </select>
            <div id="shop-select-hint" className="form-text">
              Demo build: choosing a shop stands in for signing in.
            </div>
          </div>
          <div className="col-12 col-md-7 text-md-end">
            <button type="button" className="btn btn-outline-primary btn-sm" onClick={queue.reload} disabled={queue.loading}>
              {queue.loading ? "Refreshing…" : "Refresh queues"}
            </button>
          </div>
        </div>
      )}

      <div aria-live="polite">
        {notice && (
          <div className={`alert alert-${notice.kind} py-2 d-flex justify-content-between align-items-center`} role={notice.kind === "danger" ? "alert" : "status"}>
            <span>{notice.text}</span>
            <button type="button" className="btn-close" aria-label="Dismiss message" onClick={() => setNotice(null)}></button>
          </div>
        )}
      </div>

      {queue.loading && !queue.data && shopId && <LoadingState label="Loading queues…" />}
      {queue.error && !queue.data && <ErrorState message={queue.error.message} onRetry={queue.reload} />}
      {queue.error && queue.data && (
        <div className="alert alert-warning py-2" role="status">
          Couldn't refresh the queues. Showing the last update.
        </div>
      )}

      {queue.data && (
        <div className="row row-cols-1 row-cols-xl-2 g-3">
          {queue.data.barbers.map((barber) => (
            <div className="col" key={barber.id}>
              <section className="card dk-card h-100" aria-labelledby={`barber-${barber.id}-heading`}>
                <div className="card-body">
                  <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-3">
                    <div>
                      <h2 id={`barber-${barber.id}-heading`} className="h5 mb-0">
                        {barber.name}
                      </h2>
                      <p className="small text-secondary mb-0">{barber.servedToday} served today</p>
                    </div>
                    <WaitBadge minutes={barber.waitMinutes} queueLength={barber.queueLength} />
                  </div>
                  <QueueList entries={barber.queue} showFullName renderActions={renderActions(barber)} />
                </div>
              </section>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
