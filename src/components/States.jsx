/*
 * Shared loading, error and empty states, so every page reports
 * progress and problems the same way.
 */

export function LoadingState({ label = "Loading…" }) {
  return (
    <div className="dk-state" role="status" aria-live="polite">
      <span className="spinner-border spinner-border-sm text-primary" aria-hidden="true"></span>
      <span>{label}</span>
    </div>
  );
}

export function ErrorState({ title = "Couldn't load this page", message, onRetry }) {
  return (
    <div className="alert alert-danger dk-state-box" role="alert">
      <h2 className="h5 mb-1">{title}</h2>
      {message && <p className="mb-2">{message}</p>}
      {onRetry && (
        <button type="button" className="btn btn-outline-danger btn-sm" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, message, children }) {
  return (
    <div className="dk-empty">
      <p className="dk-empty__title">{title}</p>
      {message && <p className="text-secondary mb-0">{message}</p>}
      {children && <div className="mt-3">{children}</div>}
    </div>
  );
}
