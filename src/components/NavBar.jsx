import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const LINKS = [
  { to: "/", label: "Find a barber", end: true },
  { to: "/my-turn", label: "My turn" },
  { to: "/dashboard", label: "Shop dashboard" },
];

// Site navigation. On small screens the links collapse behind a menu button.
// The right side shows "Log in / Sign up" or the logged-in customer's account.
export default function NavBar() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const { user, loading } = useAuth();

  // Close the mobile menu after navigating.
  useEffect(() => setOpen(false), [pathname]);

  return (
    <header>
      <nav className="navbar navbar-expand-md dk-navbar" data-bs-theme="dark" aria-label="Main">
        <div className="container">
          <Link className="navbar-brand dk-brand" to="/">
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
              {LINKS.map((link) => (
                <li className="nav-item" key={link.to}>
                  <NavLink to={link.to} end={link.end} className="nav-link">
                    {link.label}
                  </NavLink>
                </li>
              ))}
              {!loading && user && (
                <li className="nav-item">
                  <NavLink to="/account" className="nav-link">
                    Account ({user.name.split(" ")[0]})
                  </NavLink>
                </li>
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
