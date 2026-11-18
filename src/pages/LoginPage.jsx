import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import FormField from "../components/FormField.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useForm } from "../hooks/useForm.js";
import { validateLogin } from "../utils/validation.js";

const FIELDS = ["phone", "password"];
const idFor = (f) => `login-${f}`;

// Route "/login": log in with mobile number and password.
export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/";
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
      await login(form.values);
      navigate(from, { replace: true });
    } catch (err) {
      setStatus("error");
      setServerError(err.message);
      if (err.fields) form.setServerErrors(err.fields);
    }
  };

  return (
    <div className="container py-4 dk-auth">
      <h1 className="dk-page-title">Log in</h1>
      {location.state?.from && <p className="text-secondary">Log in to join a queue and follow your turn.</p>}

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
        <p className="fw-semibold mb-1">Demo accounts (mock data)</p>
        <p className="mb-1">01000000001 with password demo1234: a regular customer with a visit to review.</p>
        <p className="mb-0">01000000002 with password demo1234: has two no-shows, so walk-in joining is paused.</p>
      </aside>
    </div>
  );
}
