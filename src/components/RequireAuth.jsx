import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { LoadingState } from "./States.jsx";

// Wraps pages that need a logged-in customer. Others are sent to /login
// and brought back to the page they wanted after logging in.
export default function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="container py-4">
        <LoadingState label="Checking your account…" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
}
