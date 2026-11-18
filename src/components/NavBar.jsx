import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { homeFor, useAuth } from "../context/AuthContext.jsx";

// Links depend on who is logged in: customers book, owners manage their shop.
const LINKS = {
  customer: [
    { to: "/", label: "Find a barber", end: true },
    { to: "/my-turn", label: "My turn" },
    { to: "/account", label: "Account" },
  ],
  owner: [{ to: "/dashboard", label: "Shop dashboard" }],
};

// Site navigation. On small screens the links collapse behind a menu button.
export default function NavBar() {
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, loading, logout } = useAuth();
  const links = user ? LINKS[user.role] || [] : [];

  // Close the mobile menu after navigating.
  useEffect(() => setOpen(false), [pathname]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      navigate("/login", { replace: true });
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <header>
      <nav className="navbar navbar-expand-md dk-navbar" data-bs-theme="dark" aria-label="Main">
        <div className="container">
          <Link className="navbar-brand dk-brand" to={user ? homeFor(user) : "/login"}>
            <span className="dk-brand__ar" lang="ar" dir="rtl">
              دورك
            </span>
            <span className="dk-brand__en">Dorak</span>
          </Link>
          <button
            className="navbar-toggler"
            type="button"
            aria-controls="main-nav"
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((o) => !o)}
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div id="main-nav" className={`collapse navbar-collapse${open ? " show" : ""}`}>
            <ul className="navbar-nav ms-auto align-items-md-center">
              {links.map((link) => (
                <li className="nav-item" key={link.to}>
                  <NavLink to={link.to} end={link.end} className="nav-link">
                    {link.label}
                  </NavLink>
                </li>
              ))}
              {!loading && user && (
                <>
                  <li className="nav-item ms-md-3">
                    <span className="navbar-text small dk-nav-user">
                      {user.role === "owner" ? `Owner, ${user.shop?.name}` : user.name.split(" ")[0]}
                    </span>
                  </li>
                  <li className="nav-item ms-md-2 my-2 my-md-0">
                    <button type="button" className="btn btn-sm btn-outline-light" onClick={handleLogout} disabled={loggingOut}>
                      {loggingOut ? "Logging out…" : "Log out"}
                    </button>
                  </li>
                </>
              )}
              {!loading && !user && (
                <>
                  <li className="nav-item">
                    <NavLink to="/login" className="nav-link">
                      Log in
                    </NavLink>
                  </li>
                  <li className="nav-item ms-md-2 my-2 my-md-0">
                    <Link to="/signup" className="btn btn-sm dk-btn-signup">
                      Sign up
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      </nav>
    </header>
  );
}
