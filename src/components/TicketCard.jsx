import { formatMinutes, ordinal } from "../utils/queue.js";

/*
 * The customer's queue ticket: ticket number on the stub, live position
 * and estimated wait on the body. Shown after joining and on "My turn".
 */
function statusLine(ticket) {
  switch (ticket.status) {
    case "in_chair":
      return { title: "You're in the chair", detail: `About ${formatMinutes(ticket.remainingMinutes)} left.` };
    case "served":
      return { title: "All done", detail: "Your visit is marked as served." };
    case "cancelled":
      return { title: "You left the queue", detail: "Leaving early doesn't count as a no-show." };
    case "no_show":
      return { title: "Ticket closed", detail: "The shop marked this ticket as a no-show. Join again if you still need a cut." };
    default:
      if (ticket.peopleAhead === 0) return { title: "You're next", detail: "Head to the shop now." };
      return {
        title: `You're ${ordinal(ticket.position)} in line`,
        detail: `${ticket.peopleAhead} ${ticket.peopleAhead === 1 ? "person" : "people"} ahead of you.`,
      };
  }
}

export default function TicketCard({ ticket, headingLevel = 2 }) {
  const Heading = `h${headingLevel}`;
  const { title, detail } = statusLine(ticket);
  const waiting = ticket.status === "waiting";

  return (
    <section className={`dk-ticket dk-ticket--${ticket.status}`} aria-label={`Ticket ${ticket.id}`}>
      <div className="dk-ticket__stub">
        <span className="dk-ticket__label">Ticket</span>
        <span className="dk-ticket__number">{ticket.id}</span>
        {ticket.type === "priority" && <span className="dk-ticket__priority">Priority</span>}
      </div>
      <div className="dk-ticket__body">
        <Heading className="dk-ticket__title">{title}</Heading>
        <p className="mb-2">{detail}</p>
        {waiting && ticket.confirm?.state === "confirmed" && (
          <p className="dk-ticket__confirmed mb-2">You confirmed you're on your way.</p>
        )}
        {waiting && (
          <p className="dk-ticket__wait mb-2">
            Estimated wait <strong>{ticket.waitMinutes <= 0 ? "under 5 min" : formatMinutes(ticket.waitMinutes)}</strong>
          </p>
        )}
        <dl className="dk-ticket__details mb-0">
          <div>
            <dt>Barber</dt>
            <dd>{ticket.barber.name}</dd>
          </div>
          <div>
            <dt>Shop</dt>
            <dd>
              {ticket.shop.name}, {ticket.shop.address}, {ticket.shop.area}
            </dd>
          </div>
          <div>
            <dt>Service</dt>
            <dd>
              {ticket.serviceName} ({ticket.duration} min)
            </dd>
          </div>
          {ticket.type === "priority" && (
            <div>
              <dt>Priority fee</dt>
              <dd>{ticket.priorityFee} EGP, paid at the shop (demo: no payment taken)</dd>
            </div>
          )}
        </dl>
      </div>
    </section>
  );
}
