import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import FormField from "../components/FormField.jsx";
import { afterLoginPath, useAuth } from "../context/AuthContext.jsx";
import { useForm } from "../hooks/useForm.js";
import { validateLogin } from "../utils/validation.js";

const FIELDS = ["phone", "password"];
const idFor = (f) => `login-${f}`;

// Route "/login": the first page visitors see. One form for both account types;
// customers land on "Find a barber", shop owners on their dashboard.
export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from;
  const form = useForm({ phone: "", password: "" }, validateLogin);
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | submitting | error
  const [serverError, setServerError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setServerError("");
    if (!form.trySubmit(FIELDS, idFor)) return;
    setStatus("submitting");
    try {
      const user = await login(form.values);
      navigate(afterLoginPath(user, from), { replace: true });
    } catch (err) {
      setStatus("error");
      setServerError(err.message);
      if (err.fields) form.setServerErrors(err.fields);
    }
  };

  return (
    <div className="container py-4 dk-auth">
      <h1 className="dk-page-title">Log in</h1>
      <p className="text-secondary">Customers log in to join a queue. Shop owners log in to manage their shop.</p>

      <form className="card dk-card" onSubmit={handleSubmit} noValidate>
        <div className="card-body">
          {status === "error" && (
            <div className="alert alert-danger py-2" role="alert">
              {serverError}
            </div>
          )}
          <FormField id={idFor("phone")} label="Mobile number" hint="11 digits, for example 01012345678" error={form.errorFor("phone")}>
            <input type="tel" inputMode="numeric" autoComplete="tel" className="form-control" value={form.values.phone} onChange={form.change("phone")} onBlur={form.blur("phone")} />
          </FormField>
          <FormField id={idFor("password")} label="Password" error={form.errorFor("password")} className="mb-2">
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              className="form-control"
              value={form.values.password}
              onChange={form.change("password")}
              onBlur={form.blur("password")}
            />
          </FormField>
          <div className="form-check mb-3">
            <input className="form-check-input" type="checkbox" id="login-show-password" checked={showPassword} onChange={(e) => setShowPassword(e.target.checked)} />
            <label className="form-check-label" htmlFor="login-show-password">
              Show password
            </label>
          </div>
          <button type="submit" className="btn btn-primary w-100" disabled={status === "submitting"}>
            {status === "submitting" && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>}
            {status === "submitting" ? "Logging in…" : "Log in"}
          </button>
        </div>
      </form>

      <p className="mt-3">
        New to Dorak?{" "}
        <Link to="/signup" state={location.state}>
          Create an account
        </Link>
      </p>

      <aside className="dk-demo-note small" aria-label="Demo accounts">
        <p className="fw-semibold mb-1">Demo accounts (mock data, password demo1234 for all)</p>
        <p className="fw-semibold mb-0 mt-2">Customers</p>
        <ul className="mb-1 ps-3">
          <li>01000000001: regular customer with a visit to review</li>
          <li>01000000002: two no-shows, so walk-in joining is paused</li>
        </ul>
        <p className="fw-semibold mb-0">Shop owners</p>
        <ul className="mb-0 ps-3">
          <li>01000000011: Salon El Ostaz, Nasr City</li>
          <li>01000000012: Gentlemen's Corner, Maadi</li>
          <li>01000000013: Kasr El Shaar, Heliopolis</li>
        </ul>
      </aside>
    </div>
  );
}
