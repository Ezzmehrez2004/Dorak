import { Link } from "react-router-dom";

// Route "*": any unknown address.
export default function NotFoundPage() {
  return (
    <div className="container py-5 dk-narrow">
      <h1 className="dk-page-title">This page doesn't exist</h1>
      <p className="text-secondary">The link may be broken or the page may have moved.</p>
      <Link to="/" className="btn btn-primary">
        Find a barber
      </Link>
    </div>
  );
}
