import { cloneElement } from "react";

/*
 * Label + control + hint + error message, wired together for screen
 * readers (aria-describedby, aria-invalid). Pass the input, select or
 * textarea as the only child; this component adds the id and a11y props.
 */
export default function FormField({ id, label, hint, error, children, className = "mb-3" }) {
  const hintId = hint ? `${id}-hint` : null;
  const errorId = error ? `${id}-error` : null;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  const control = cloneElement(children, {
    id,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": describedBy,
    className: `${children.props.className ?? ""}${error ? " is-invalid" : ""}`,
  });

  return (
    <div className={className}>
      <label htmlFor={id} className="form-label">
        {label}
      </label>
      {control}
      {hint && (
        <div id={hintId} className="form-text">
          {hint}
        </div>
      )}
      {error && (
        <div id={errorId} className="invalid-feedback d-block">
          {error}
        </div>
      )}
    </div>
  );
}
