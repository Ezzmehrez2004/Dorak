import { useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import Footer from "./components/Footer.jsx";
import NavBar from "./components/NavBar.jsx";
import RequireAuth from "./components/RequireAuth.jsx";
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
          <Route path="/" element={<HomePage />} />
          <Route path="/barbers/:barberId" element={<BarberPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          {/* Customer pages: logged-in users only */}
          <Route path="/barbers/:barberId/join" element={<RequireAuth><JoinQueuePage /></RequireAuth>} />
          <Route path="/my-turn" element={<RequireAuth><MyTurnPage /></RequireAuth>} />
          <Route path="/my-turn/:ticketId" element={<RequireAuth><MyTurnPage /></RequireAuth>} />
          <Route path="/account" element={<RequireAuth><AccountPage /></RequireAuth>} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
