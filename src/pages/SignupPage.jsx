import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import FormField from "../components/FormField.jsx";
import VerifyCodeForm from "../components/VerifyCodeForm.jsx";
import { RULES } from "../config.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useForm } from "../hooks/useForm.js";
import { validateRegister } from "../utils/validation.js";

const FIELDS = ["name", "phone", "password", "confirmPassword", "acceptRules"];
const idFor = (f) => `signup-${f}`;

// Route "/signup": create a customer account in two steps:
// 1) details form, 2) SMS code that proves the phone number is real.
export default function SignupPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/";
  const form = useForm({ name: "", phone: "", password: "", confirmPassword: "", acceptRules: false }, validateRegister);
  const [status, setStatus] = useState("idle");
  const [serverError, setServerError] = useState("");
  const [pending, setPending] = useState(null); // set after step 1 succeeds

  const handleSubmit = async (event) => {
    event.preventDefault();
    setServerError("");
    if (!form.trySubmit(FIELDS, idFor)) return;
    setStatus("submitting");
    try {
      setPending(await register(form.values));
      setStatus("idle");
    } catch (err) {
      setStatus("error");
      setServerError(err.message);
      if (err.fields) form.setServerErrors(err.fields);
    }
  };

  if (pending) {
    return (
      <div className="container py-4 dk-auth">
        <h1 className="dk-page-title">Verify your number</h1>
        <p className="text-secondary small">Step 2 of 2</p>
        <VerifyCodeForm pending={pending} onVerified={() => navigate(from, { replace: true })} onChangeNumber={() => setPending(null)} />
      </div>
    );
  }

  return (
    <div className="container py-4 dk-auth">
      <h1 className="dk-page-title">Create your account</h1>
      <p className="text-secondary small mb-1">Step 1 of 2</p>
      <p className="text-secondary">Your mobile number is your account. We'll text it a code to check it's yours.</p>

      <form className="card dk-card" onSubmit={handleSubmit} noValidate>
        <div className="card-body">
          {status === "error" && (
            <div className="alert alert-danger py-2" role="alert">
              {serverError}
            </div>
          )}
          <FormField id={idFor("name")} label="Your name" error={form.errorFor("name")}>
            <input type="text" autoComplete="name" className="form-control" value={form.values.name} onChange={form.change("name")} onBlur={form.blur("name")} />
          </FormField>
          <FormField id={idFor("phone")} label="Mobile number" hint="11 digits, for example 01012345678" error={form.errorFor("phone")}>
            <input type="tel" inputMode="numeric" autoComplete="tel" className="form-control" value={form.values.phone} onChange={form.change("phone")} onBlur={form.blur("phone")} />
          </FormField>
          <FormField id={idFor("password")} label="Password" hint="At least 8 characters, with a letter and a number" error={form.errorFor("password")}>
            <input type="password" autoComplete="new-password" className="form-control" value={form.values.password} onChange={form.change("password")} onBlur={form.blur("password")} />
          </FormField>
          <FormField id={idFor("confirmPassword")} label="Confirm password" error={form.errorFor("confirmPassword")}>
            <input
              type="password"
              autoComplete="new-password"
              className="form-control"
              value={form.values.confirmPassword}
              onChange={form.change("confirmPassword")}
              onBlur={form.blur("confirmPassword")}
            />
          </FormField>

          <div className="dk-rules mb-3" id="signup-rules">
            <p className="fw-semibold mb-1">Fair queue rules</p>
            <ul className="mb-0 small">
              <li>When you're 2nd in line, confirm you're on your way within {RULES.confirmWindowMinutes} minutes, or you move back.</li>
              <li>Leaving the queue early is always free.</li>
              <li>
                {RULES.strikeLimit} no-shows in {RULES.strikeWindowDays} days pause walk-in joining for {RULES.blockDays} days.
              </li>
            </ul>
          </div>
          <div className="form-check mb-3">
            <input
              className={`form-check-input${form.errorFor("acceptRules") ? " is-invalid" : ""}`}
              type="checkbox"
              id={idFor("acceptRules")}
              checked={form.values.acceptRules}
              onChange={form.change("acceptRules")}
              aria-invalid={form.errorFor("acceptRules") ? true : undefined}
              aria-describedby={form.errorFor("acceptRules") ? "signup-acceptRules-error signup-rules" : "signup-rules"}
            />
            <label className="form-check-label" htmlFor={idFor("acceptRules")}>
              I agree to the fair queue rules
            </label>
            {form.errorFor("acceptRules") && (
              <div id="signup-acceptRules-error" className="invalid-feedback d-block">
                {form.errorFor("acceptRules")}
              </div>
            )}
          </div>

          <button type="submit" className="btn btn-primary w-100" disabled={status === "submitting"}>
            {status === "submitting" && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>}
            {status === "submitting" ? "Sending code…" : "Continue"}
          </button>
        </div>
      </form>

      <p className="mt-3">
        Already have an account?{" "}
        <Link to="/login" state={location.state}>
          Log in
        </Link>
      </p>
    </div>
  );
}
