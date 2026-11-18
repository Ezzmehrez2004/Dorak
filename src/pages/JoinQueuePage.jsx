import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { get, post } from "../api/api.js";
import FormField from "../components/FormField.jsx";
import { EmptyState, ErrorState, LoadingState } from "../components/States.jsx";
import TicketCard from "../components/TicketCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useApi } from "../hooks/useApi.js";
import { formatMinutes } from "../utils/queue.js";
import { validateJoin } from "../utils/validation.js";

const EMPTY_FORM = { serviceId: "", type: "walk_in", acceptFee: false };

// Order used to move focus to the first field with an error.
const FIELD_ORDER = ["serviceId", "type", "acceptFee"];
const FIELD_IDS = {
  serviceId: "join-service",
  type: "join-type-priority",
  acceptFee: "join-accept-fee",
};

const dateFormat = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long" });

// Route "/barbers/:barberId/join": the join-queue form (logged-in customers only).
export default function JoinQueuePage() {
  const { barberId } = useParams();
  const { user } = useAuth();
  const { data: barber, loading, error, reload } = useApi(() => get("/api/barber", { id: barberId }), [barberId]);
  const me = useApi(() => get("/api/me"), []);

  const [values, setValues] = useState(EMPTY_FORM);
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | submitting | success | error
  const [serverError, setServerError] = useState(null);
  const [ticket, setTicket] = useState(null);
  const summaryRef = useRef(null);
  const successRef = useRef(null);

  useEffect(() => {
    if (status === "success") successRef.current?.focus();
  }, [status]);

  // Customers with too many no-shows can only join as priority.
  // Priority is capped per barber, so it may be full; then only walk-in is open.
  const blocked = me.data?.strikes.blocked ?? false;
  const priorityFull = barber?.priorityFull ?? false;
  const noOption = blocked && priorityFull;
  useEffect(() => {
    if (blocked && !priorityFull) setValues((v) => ({ ...v, type: "priority" }));
    else if (priorityFull) setValues((v) => (v.type === "priority" ? { ...v, type: "walk_in", acceptFee: false } : v));
  }, [blocked, priorityFull]);

  if ((loading && !barber) || (me.loading && !me.data)) return <div className="container py-4"><LoadingState label="Loading the form…" /></div>;
  if (error && !barber) {
    return (
      <div className="container py-4">
        {error.status === 404 || error.status === 400 ? (
          <EmptyState title="We couldn't find that barber">
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

  const serviceIds = barber.services.map((s) => s.id);
  const clientErrors = validateJoin(values, serviceIds);
  const fieldErrors = { ...(serverError?.fields || {}), ...clientErrors };
  const visibleError = (field) => ((touched[field] || submitted) && fieldErrors[field]) || null;
  const errorCount = Object.keys(clientErrors).length;
  const selectedService = barber.services.find((s) => s.id === Number(values.serviceId));
  const estimate = values.type === "priority" ? barber.priorityWaitMinutes : barber.waitMinutes;

  const update = (field) => (event) => {
    const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
    setValues((v) => ({ ...v, [field]: value }));
    if (serverError) {
      setServerError(null);
      setStatus("idle");
    }
  };
  // Skip when focus moves to the submit button, so the button doesn't shift mid-click.
  const markTouched = (field) => (event) => {
    if (event?.relatedTarget?.type === "submit") return;
    setTouched((t) => ({ ...t, [field]: true }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitted(true);
    setServerError(null);

    if (errorCount) {
      summaryRef.current?.focus();
      return;
    }

    setStatus("submitting");
    try {
      const result = await post("/api/queue/join", { ...values, barberId: barber.id });
      setTicket(result);
      setStatus("success");
    } catch (err) {
      setServerError({ message: err.message, fields: err.fields, status: err.status });
      setStatus("error");
      summaryRef.current?.focus();
    }
  };

  const focusField = (field) => (event) => {
    event.preventDefault();
    document.getElementById(FIELD_IDS[field])?.focus();
  };

  if (status === "success" && ticket) {
    return (
      <div className="container py-4 dk-narrow">
        <div className="alert alert-success" role="status">
          <h1 className="h4 mb-1" tabIndex={-1} ref={successRef}>
            You're in the queue
          </h1>
          <p className="mb-0">
            Ticket <strong>#{ticket.id}</strong> is saved on your account under "My turn". When you're 2nd in line, we'll
            ask you to confirm you're on your way.
          </p>
        </div>
        <TicketCard ticket={ticket} />
        <div className="d-flex flex-wrap gap-2 mt-4">
          <Link to={`/my-turn/${ticket.id}`} className="btn btn-primary">
            Track my turn
          </Link>
          <Link to={`/barbers/${barber.id}`} className="btn btn-outline-primary">
            Back to {barber.name}
          </Link>
        </div>
      </div>
    );
  }

  const shownErrors = submitted ? FIELD_ORDER.filter((f) => fieldErrors[f]) : [];

  return (
    <div className="container py-4 dk-narrow">
      <nav aria-label="Breadcrumb">
        <ol className="breadcrumb small">
          <li className="breadcrumb-item">
            <Link to="/">Find a barber</Link>
          </li>
          <li className="breadcrumb-item">
            <Link to={`/barbers/${barber.id}`}>{barber.name}</Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            Join queue
          </li>
        </ol>
      </nav>

      <h1 className="dk-page-title">Join {barber.name}'s queue</h1>
      <p className="text-secondary">
        {barber.shop.name}, {barber.shop.area}.
      </p>
      <p className="dk-joining-as">
        Joining as <strong>{user.name}</strong> ({user.phone.slice(0, 3)} •••• {user.phone.slice(-4)}). The barber sees
        your first name and the last 3 digits of your number.
      </p>

      {blocked && (
        <div className="alert alert-warning" role="status">
          You missed {me.data.strikes.strikes} turns in the last {me.data.strikes.windowDays} days, so walk-in joining is
          paused until {dateFormat.format(new Date(me.data.strikes.blockedUntil))}.{" "}
          {noOption
            ? `Priority is also full for ${barber.name} right now. Try again when a priority customer is seated, or choose another barber.`
            : "You can still join as priority."}
        </div>
      )}

      <div ref={summaryRef} tabIndex={-1} className="dk-summary-anchor">
        {status === "error" && serverError && (
          <div className="alert alert-danger" role="alert">
            <p className="fw-semibold mb-0">{serverError.message}</p>
            {serverError.status === 409 && !serverError.fields?.type && (
              <Link to="/my-turn" className="alert-link">
                Open my ticket
              </Link>
            )}
          </div>
        )}
        {shownErrors.length > 0 && status !== "error" && (
          <div className="alert alert-danger" role="alert">
            <p className="fw-semibold mb-1">
              Fix {shownErrors.length} {shownErrors.length === 1 ? "field" : "fields"} to join the queue:
            </p>
            <ul className="mb-0">
              {shownErrors.map((f) => (
                <li key={f}>
                  <a href={`#${FIELD_IDS[f]}`} onClick={focusField(f)} className="alert-link">
                    {fieldErrors[f]}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <form className="card dk-card" onSubmit={handleSubmit} noValidate>
        <div className="card-body">
          <FormField id="join-service" label="Service" error={visibleError("serviceId")}>
            <select className="form-select" value={values.serviceId} onChange={update("serviceId")} onBlur={markTouched("serviceId")}>
              <option value="">Choose a service</option>
              {barber.services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}: {s.price} EGP, {s.duration} min
                </option>
              ))}
            </select>
          </FormField>

          <fieldset className="mb-3">
            <legend className="form-label fs-6">How do you want to wait?</legend>
            <div className="dk-choice">
              <input
                className="btn-check"
                type="radio"
                name="type"
                id="join-type-walk_in"
                value="walk_in"
                checked={values.type === "walk_in"}
                onChange={update("type")}
                disabled={blocked}
              />
              <label className="btn dk-choice__option" htmlFor="join-type-walk_in">
                <span className="fw-semibold d-block">Walk-in</span>
                <span className="small">
                  {blocked
                    ? "Paused on your account."
                    : `Free. ${barber.waitMinutes <= 0 ? "No wait right now." : `About ${formatMinutes(barber.waitMinutes)}.`}`}
                </span>
              </label>

              <input
                className="btn-check"
                type="radio"
                name="type"
                id="join-type-priority"
                value="priority"
                checked={values.type === "priority"}
                onChange={update("type")}
                disabled={priorityFull}
              />
              <label className="btn dk-choice__option" htmlFor="join-type-priority">
                <span className="fw-semibold d-block">Priority, {barber.priorityFee} EGP</span>
                <span className="small">
                  {priorityFull
                    ? `Full: ${barber.priorityLimit} priority customers already waiting.`
                    : `Served before walk-ins. ${
                        barber.priorityWaitMinutes <= 0 ? "You'd be next." : `About ${formatMinutes(barber.priorityWaitMinutes)}.`
                      } ${barber.priorityLimit - barber.priorityWaiting} of ${barber.priorityLimit} spots left.`}
                </span>
              </label>
            </div>
            {visibleError("type") && (
              <div id="join-type-error" className="invalid-feedback d-block">
                {visibleError("type")}
              </div>
            )}
          </fieldset>

          {values.type === "priority" && (
            <div className="mb-3">
              <div className="form-check">
                <input
                  className={`form-check-input${visibleError("acceptFee") ? " is-invalid" : ""}`}
                  type="checkbox"
                  id="join-accept-fee"
                  checked={values.acceptFee}
                  onChange={update("acceptFee")}
                  aria-invalid={visibleError("acceptFee") ? true : undefined}
                  aria-describedby={visibleError("acceptFee") ? "join-accept-fee-error" : "join-accept-fee-hint"}
                />
                <label className="form-check-label" htmlFor="join-accept-fee">
                  I'll pay the {barber.priorityFee} EGP priority fee at the shop
                </label>
              </div>
              <div id="join-accept-fee-hint" className="form-text">
                The fee rises when the queue is long. Demo build: no payment is taken.
              </div>
              {visibleError("acceptFee") && (
                <div id="join-accept-fee-error" className="invalid-feedback d-block">
                  {visibleError("acceptFee")}
                </div>
              )}
            </div>
          )}

          <div className="dk-estimate mb-3" aria-live="polite">
            Estimated wait if you join now: <strong>{estimate <= 0 ? "under 5 min" : formatMinutes(estimate)}</strong>
            {selectedService && <>. Your {selectedService.name.toLowerCase()} takes about {selectedService.duration} min.</>}
          </div>

          <button type="submit" className="btn btn-primary btn-lg w-100" disabled={status === "submitting" || noOption}>
            {status === "submitting" && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>}
            {status === "submitting" ? "Joining…" : "Join the queue"}
          </button>
        </div>
      </form>
    </div>
  );
}
