import { useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import Footer from "./components/Footer.jsx";
import NavBar from "./components/NavBar.jsx";
import RequireAuth, { PublicOnly } from "./components/RequireAuth.jsx";
import AccountPage from "./pages/AccountPage.jsx";
import BarberPage from "./pages/BarberPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import JoinQueuePage from "./pages/JoinQueuePage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import MyTurnPage from "./pages/MyTurnPage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";
import SignupPage from "./pages/SignupPage.jsx";

// Scroll to the top whenever the route changes.
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <div className="d-flex flex-column min-vh-100">
      <a href="#main" className="visually-hidden-focusable dk-skip-link">
        Skip to main content
      </a>
      <ScrollToTop />
      <NavBar />
      <main id="main" className="flex-grow-1" tabIndex={-1}>
        <Routes>
          {/* Public: logged-out visitors start at /login */}
          <Route path="/login" element={<PublicOnly><LoginPage /></PublicOnly>} />
          <Route path="/signup" element={<PublicOnly><SignupPage /></PublicOnly>} />
          {/* Customer accounts only */}
          <Route path="/" element={<RequireAuth role="customer"><HomePage /></RequireAuth>} />
          <Route path="/barbers/:barberId" element={<RequireAuth role="customer"><BarberPage /></RequireAuth>} />
          <Route path="/barbers/:barberId/join" element={<RequireAuth role="customer"><JoinQueuePage /></RequireAuth>} />
          <Route path="/my-turn" element={<RequireAuth role="customer"><MyTurnPage /></RequireAuth>} />
          <Route path="/my-turn/:ticketId" element={<RequireAuth role="customer"><MyTurnPage /></RequireAuth>} />
          <Route path="/account" element={<RequireAuth role="customer"><AccountPage /></RequireAuth>} />
          {/* Shop owner accounts only */}
          <Route path="/dashboard" element={<RequireAuth role="owner"><DashboardPage /></RequireAuth>} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
