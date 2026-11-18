import { EmptyState } from "./States.jsx";

const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });

// Verified reviews on a barber's profile.
export default function ReviewList({ reviews }) {
  if (!reviews.length) {
    return (
      <EmptyState
        title="No reviews yet"
        message="Reviews appear here after customers finish a visit through Dorak."
      />
    );
  }
  return (
    <ul className="list-unstyled dk-reviews mb-0">
      {reviews.map((r) => (
        <li key={r.id} className="dk-reviews__item">
          <div className="d-flex flex-wrap justify-content-between gap-2">
            <span>
              <span className="dk-stars" aria-hidden="true">
                {"★".repeat(r.rating)}
                <span className="dk-stars__empty">{"★".repeat(5 - r.rating)}</span>
              </span>
              <span className="visually-hidden">{r.rating} out of 5 stars</span>
              <span className="fw-semibold ms-2">{r.customerName}</span>
            </span>
            <span className="small text-secondary">
              Verified visit, {dateFormat.format(new Date(r.createdAt))}
            </span>
          </div>
          {r.comment && <p className="mb-0 mt-1">{r.comment}</p>}
        </li>
      ))}
    </ul>
  );
}
