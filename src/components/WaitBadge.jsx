import { formatMinutes } from "../utils/queue.js";

// Colored badge for a barber's live wait: short, medium or long.
export default function WaitBadge({ minutes, queueLength, size = "md" }) {
  const level = minutes < 15 ? "short" : minutes < 45 ? "medium" : "long";
  const people = queueLength === 1 ? "1 person" : `${queueLength} people`;
  return (
    <span className={`dk-wait dk-wait--${level} dk-wait--${size}`}>
      <span className="dk-wait__time">{minutes <= 0 ? "No wait" : `~${formatMinutes(minutes)} wait`}</span>
      {queueLength !== undefined && <span className="dk-wait__people">{queueLength ? `${people} in line` : "Chair is free"}</span>}
    </span>
  );
}
