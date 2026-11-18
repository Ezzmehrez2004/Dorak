import { formatMinutes, ordinal } from "../utils/queue.js";
import { EmptyState } from "./States.jsx";

const STATUS_LABEL = { in_chair: "In the chair", waiting: "Waiting" };

/*
 * Ordered list of a barber's queue. Used read-only on the barber profile
 * and, with `renderActions`, on the shop dashboard.
 *   renderActions(entry, index) -> buttons for that row
 *   showFullName -> dashboard shows the full name and phone ending
 */
export default function QueueList({ entries, renderActions, showFullName = false, highlightId }) {
  if (!entries.length) {
    return <EmptyState title="Nobody in line" message="The chair is free right now." />;
  }

  return (
    <ol className="list-unstyled dk-queue mb-0">
      {entries.map((entry, index) => (
        <li
          key={entry.id}
          className={`dk-queue__row${entry.status === "in_chair" ? " dk-queue__row--chair" : ""}${
            entry.id === highlightId ? " dk-queue__row--mine" : ""
          }`}
        >
          <span className="dk-queue__pos" aria-hidden="true">
            {entry.position}
          </span>
          <div className="dk-queue__who">
            <span className="fw-semibold">
              <span className="visually-hidden">{ordinal(entry.position)}: </span>
              {showFullName ? entry.customerName : entry.displayName}
              {entry.id === highlightId && " (you)"}
            </span>
            <span className="small text-secondary">
              {entry.serviceName}
              {showFullName && entry.phoneEnding && <>, phone ends {entry.phoneEnding}</>}
            </span>
          </div>
          <div className="dk-queue__meta">
            {entry.type === "priority" && <span className="badge dk-badge-priority">Priority</span>}
            {showFullName && entry.confirm?.state === "confirmed" && <span className="badge dk-badge-confirmed">On the way</span>}
            {showFullName && entry.confirm?.state === "asked" && (
              <span className="badge dk-badge-asked">Not confirmed, {entry.confirm.minutesLeft} min left</span>
            )}
            <span className="small">
              {entry.status === "waiting" ? `in ~${formatMinutes(entry.waitMinutes)}` : STATUS_LABEL[entry.status]}
            </span>
          </div>
          {renderActions && <div className="dk-queue__actions">{renderActions(entry, index)}</div>}
        </li>
      ))}
    </ol>
  );
}
