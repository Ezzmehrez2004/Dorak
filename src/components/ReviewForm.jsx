import { useRef, useState } from "react";
import { post } from "../api/api.js";
import { validateReview } from "../utils/validation.js";
import FormField from "./FormField.jsx";

const LABELS = { 1: "Poor", 2: "Fair", 3: "Good", 4: "Very good", 5: "Excellent" };

// Rating form shown after a visit is marked served. Controlled inputs.
export default function ReviewForm({ ticketId, barberName, onSubmitted }) {
  const [values, setValues] = useState({ rating: "", comment: "" });
  const [touched, setTouched] = useState({});
  const [status, setStatus] = useState("idle"); // idle | submitting | error
  const [serverError, setServerError] = useState("");
  const firstStarRef = useRef(null);
  const commentRef = useRef(null);

  const errors = validateReview(values);
  const show = (field) => (touched[field] || touched.submit) && errors[field];

  const handleSubmit = async (event) => {
    event.preventDefault();
    setTouched({ submit: true });
    if (Object.keys(errors).length) {
      (errors.rating ? firstStarRef : commentRef).current?.focus();
      return;
    }
    setStatus("submitting");
    setServerError("");
    try {
      const review = await post("/api/reviews", { ticketId, ...values });
      onSubmitted?.(review);
    } catch (err) {
      setStatus("error");
      setServerError(err.message);
    }
  };

  return (
    <form className="card dk-card" onSubmit={handleSubmit} noValidate aria-labelledby="review-heading">
      <div className="card-body">
        <h2 id="review-heading" className="h5">
          How was your visit with {barberName}?
        </h2>
        <p className="text-secondary small">Your review is marked as a verified visit on the barber's profile.</p>

        <fieldset className="mb-3" aria-describedby={show("rating") ? "rating-error" : undefined}>
          <legend className="form-label fs-6">Rating</legend>
          <div className="dk-star-input">
            {[1, 2, 3, 4, 5].map((n) => (
              <span key={n}>
                <input
                  ref={n === 1 ? firstStarRef : undefined}
                  className="visually-hidden dk-star-input__radio"
                  type="radio"
                  name="rating"
                  id={`rating-${n}`}
                  value={n}
                  checked={Number(values.rating) === n}
                  onChange={(e) => {
                    setValues((v) => ({ ...v, rating: e.target.value }));
                    setTouched((t) => ({ ...t, rating: true }));
                  }}
                />
                <label
                  htmlFor={`rating-${n}`}
                  className={`dk-star-input__label${Number(values.rating) >= n ? " is-on" : ""}`}
                >
                  <span aria-hidden="true">★</span>
                  <span className="visually-hidden">
                    {n} {n === 1 ? "star" : "stars"}, {LABELS[n]}
                  </span>
                </label>
              </span>
            ))}
            <span className="ms-2 small text-secondary" aria-hidden="true">
              {values.rating ? LABELS[values.rating] : "Choose 1 to 5 stars"}
            </span>
          </div>
          {show("rating") && (
            <div id="rating-error" className="invalid-feedback d-block">
              {errors.rating}
            </div>
          )}
        </fieldset>

        <FormField id="review-comment" label="Comment (optional)" hint={`${values.comment.length}/300 characters`} error={show("comment")}>
          <textarea
            ref={commentRef}
            className="form-control"
            rows={3}
            value={values.comment}
            onChange={(e) => setValues((v) => ({ ...v, comment: e.target.value }))}
            onBlur={(e) => e.relatedTarget?.type !== "submit" && setTouched((t) => ({ ...t, comment: true }))}
          />
        </FormField>

        {status === "error" && (
          <div className="alert alert-danger py-2" role="alert">
            {serverError}
          </div>
        )}

        <button type="submit" className="btn btn-primary" disabled={status === "submitting"}>
          {status === "submitting" && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>}
          {status === "submitting" ? "Posting review…" : "Post review"}
        </button>
      </div>
    </form>
  );
}
