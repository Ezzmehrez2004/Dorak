import { useMemo, useState } from "react";
import { get } from "../api/api.js";
import BarberCard from "../components/BarberCard.jsx";
import { EmptyState, ErrorState, LoadingState } from "../components/States.jsx";
import { POLL_MS } from "../config.js";
import { useApi } from "../hooks/useApi.js";

const SORTS = {
  wait: { label: "Shortest wait", compare: (a, b) => a.waitMinutes - b.waitMinutes },
  rating: { label: "Top rated", compare: (a, b) => (b.rating ?? 0) - (a.rating ?? 0) },
  name: { label: "Name (A to Z)", compare: (a, b) => a.name.localeCompare(b.name) },
};

// Route "/": search and filter barbers, each with a live wait.
export default function HomePage() {
  const { data: barbers, loading, error, reload } = useApi(() => get("/api/barbers"), [], { pollMs: POLL_MS });
  const [search, setSearch] = useState("");
  const [area, setArea] = useState("all");
  const [sort, setSort] = useState("wait");

  const areas = useMemo(() => (barbers ? [...new Set(barbers.map((b) => b.shop.area))].sort() : []), [barbers]);

  const visible = useMemo(() => {
    if (!barbers) return [];
    const q = search.trim().toLowerCase();
    return barbers
      .filter((b) => area === "all" || b.shop.area === area)
      .filter((b) => !q || [b.name, b.specialty, b.shop.name].some((field) => field.toLowerCase().includes(q)))
      .sort(SORTS[sort].compare);
  }, [barbers, search, area, sort]);

  const clearFilters = () => {
    setSearch("");
    setArea("all");
  };

  return (
    <>
      <section className="dk-hero">
        <div className="container">
          <h1 className="dk-hero__title">See the wait before you leave home.</h1>
          <p className="dk-hero__lead">
            Pick your barber, join the line from your phone, and walk in when it's your turn.
          </p>
        </div>
      </section>

      <div className="container">
        <form className="dk-filters row g-3 align-items-end" role="search" aria-label="Find a barber" onSubmit={(e) => e.preventDefault()}>
          <div className="col-12 col-md-5">
            <label htmlFor="search" className="form-label">
              Barber, shop or style
            </label>
            <input
              id="search"
              type="search"
              className="form-control"
              placeholder="For example: fade, Hassan, Maadi"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="col-6 col-md-3">
            <label htmlFor="area" className="form-label">
              Area
            </label>
            <select id="area" className="form-select" value={area} onChange={(e) => setArea(e.target.value)}>
              <option value="all">All areas</option>
              {areas.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
          <div className="col-6 col-md-4">
            <label htmlFor="sort" className="form-label">
              Sort by
            </label>
            <select id="sort" className="form-select" value={sort} onChange={(e) => setSort(e.target.value)}>
              {Object.entries(SORTS).map(([key, s]) => (
                <option key={key} value={key}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </form>

        <section className="mt-4" aria-labelledby="results-heading">
          <h2 id="results-heading" className="visually-hidden">
            Barbers
          </h2>

          {loading && !barbers && <LoadingState label="Loading barbers…" />}

          {error && !barbers && <ErrorState message={error.message} onRetry={reload} />}

          {error && barbers && (
            <div className="alert alert-warning py-2" role="status">
              Couldn't refresh wait times. Showing the last update.
            </div>
          )}

          {barbers && (
            <>
              <p className="small text-secondary" aria-live="polite">
                {visible.length} {visible.length === 1 ? "barber" : "barbers"}
                {area !== "all" ? ` in ${area}` : ""}
              </p>
              {visible.length === 0 ? (
                <EmptyState title="No barbers match your search" message="Try a different name or area.">
                  <button type="button" className="btn btn-outline-primary btn-sm" onClick={clearFilters}>
                    Clear search
                  </button>
                </EmptyState>
              ) : (
                <ul className="row row-cols-1 row-cols-sm-2 row-cols-lg-3 g-3 list-unstyled">
                  {visible.map((barber) => (
                    <li className="col" key={barber.id}>
                      <BarberCard barber={barber} />
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </section>
      </div>
    </>
  );
}
