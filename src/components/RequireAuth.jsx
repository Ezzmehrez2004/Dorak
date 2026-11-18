import { Navigate, useLocation } from "react-router-dom";
import { homeFor, useAuth } from "../context/AuthContext.jsx";
import { LoadingState } from "./States.jsx";

/*
 * Route guards.
 *   <RequireAuth role="customer"> ... </RequireAuth>
 * Logged-out visitors are sent to /login (and brought back afterwards).
 * A logged-in user with the wrong account type is sent to their own home:
 * customers to "Find a barber", owners to their shop dashboard.
 */
function Checking() {
  return (
    <div className="container py-4">
      <LoadingState label="Checking your account…" />
    </div>
  );
}

export default function RequireAuth({ role, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Checking />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (role && user.role !== role) return <Navigate to={homeFor(user)} replace />;
  return children;
}

// For /login and /signup: someone already logged in goes to their home page.
export function PublicOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Checking />;
  if (user) return <Navigate to={homeFor(user)} replace />;
  return children;
}
