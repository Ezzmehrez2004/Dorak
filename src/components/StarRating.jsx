// Read-only star rating. Screen readers hear "Rated 4.5 out of 5".
export default function StarRating({ value, count }) {
  if (value === null || value === undefined) {
    return <span className="text-secondary small">No reviews yet</span>;
  }
  const full = Math.round(value);
  return (
    <span className="dk-stars">
      <span aria-hidden="true">
        {"★".repeat(full)}
        <span className="dk-stars__empty">{"★".repeat(5 - full)}</span>
      </span>
      <span className="visually-hidden">Rated {value} out of 5</span>
      <span className="dk-stars__value" aria-hidden="true">
        {value.toFixed(1)}
      </span>
      {count !== undefined && (
        <span className="text-secondary small">
          ({count} {count === 1 ? "review" : "reviews"})
        </span>
      )}
    </span>
  );
}
