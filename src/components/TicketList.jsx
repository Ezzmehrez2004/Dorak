import { Link } from "react-router-dom";
import { formatMinutes, ordinal } from "../utils/queue.js";
import { EmptyState } from "./States.jsx";

const STATUS = {
  waiting: "Waiting",
  in_chair: "In the chair",
  served: "Served",
  no_show: "No-show",
  cancelled: "Left the queue",
};

const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

// Compact list of a customer's tickets, each linking to its live page.
export default function TicketList({ tickets, emptyTitle, emptyMessage, emptyAction }) {
  if (!tickets.length) {
    return (
      <EmptyState title={emptyTitle} message={emptyMessage}>
        {emptyAction}
      </EmptyState>
    );
  }
  return (
    <ul className="list-unstyled dk-ticket-list mb-0">
      {tickets.map((t) => (
        <li key={t.id} className="dk-ticket-list__item">
          <div>
            <Link to={`/my-turn/${t.id}`} className="fw-semibold">
              Ticket #{t.id} with {t.barber.name}
            </Link>
            <div className="small text-secondary">
              {t.serviceName} at {t.shop.name}, {dateFormat.format(new Date(t.joinedAt))}
            </div>
          </div>
          <div className="text-end small">
            <span className={`dk-status dk-status--${t.status}`}>{STATUS[t.status]}</span>
            {t.status === "waiting" && (
              <div className="text-secondary">
                {ordinal(t.position)} in line, ~{formatMinutes(t.waitMinutes)}
              </div>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
