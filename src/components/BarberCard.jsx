import { Link } from "react-router-dom";
import StarRating from "./StarRating.jsx";
import WaitBadge from "./WaitBadge.jsx";

// One barber in the search results. The whole card links to the profile.
export default function BarberCard({ barber }) {
  return (
    <article className="card dk-card h-100">
      <div className="card-body d-flex flex-column gap-2">
        <div>
          <h3 className="h5 mb-0">
            <Link to={`/barbers/${barber.id}`} className="stretched-link dk-card__link">
              {barber.name}
            </Link>
          </h3>
          <p className="text-secondary mb-0 small">
            {barber.shop.name}, {barber.shop.area}
          </p>
        </div>
        <p className="mb-0">{barber.specialty}</p>
        <StarRating value={barber.rating} count={barber.reviewCount} />
        <div className="mt-auto d-flex flex-wrap align-items-end justify-content-between gap-2 pt-2">
          <WaitBadge minutes={barber.waitMinutes} queueLength={barber.queueLength} />
          {barber.fromPrice !== null && <span className="small text-secondary">From {barber.fromPrice} EGP</span>}
        </div>
      </div>
    </article>
  );
}
