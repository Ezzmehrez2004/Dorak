import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { validateCode } from "../utils/validation.js";
import FormField from "./FormField.jsx";

/*
 * Second step of sign-up: enter the 6-digit SMS code.
 * MOCK (Milestone 1): no SMS is sent, so the code is shown in a labeled
 * demo box. Milestone 2 sends it through an SMS gateway instead.
 */
export default function VerifyCodeForm({ pending: initialPending, onVerified, onChangeNumber }) {
  const { verifyCode, resendCode } = useAuth();
  const [pending, setPending] = useState(initialPending);
  const [code, setCode] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [serverFieldError, setServerFieldError] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | verifying | resending
  const [notice, setNotice] = useState(null); // { kind, text }
  const [now, setNow] = useState(Date.now());
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Tick once a second for the resend countdown.
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const resendIn = Math.max(0, Math.ceil((pending.resendAvailableAt - now) / 1000));
  const clientError = validateCode({ code }).code;
  const error = (submitted && clientError) || serverFieldError;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitted(true);
    setNotice(null);
    if (clientError) {
      inputRef.current?.focus();
      return;
    }
    setStatus("verifying");
    try {
      await verifyCode(pending.pendingId, code.trim());
      onVerified();
    } catch (err) {
      setStatus("idle");
      setServerFieldError(err.fields?.code || null);
      if (!err.fields?.code) setNotice({ kind: "danger", text: err.message });
      inputRef.current?.focus();
    }
  };

  const handleResend = async () => {
    setStatus("resending");
    setNotice(null);
    try {
      const fresh = await resendCode(pending.pendingId);
      setPending(fresh);
      setCode("");
      setSubmitted(false);
      setServerFieldError(null);
      setNotice({ kind: "success", text: `New code sent to ${fresh.phoneMasked}.` });
    } catch (err) {
      setNotice({ kind: "danger", text: err.message });
    } finally {
      setStatus("idle");
      inputRef.current?.focus();
    }
  };

  return (
    <form className="card dk-card" onSubmit={handleSubmit} noValidate aria-labelledby="verify-heading">
      <div className="card-body">
        <h2 id="verify-heading" className="h5">
          Check your messages
        </h2>
        <p>
          We sent a 6-digit code to <strong>{pending.phoneMasked}</strong>. It expires in 10 minutes.
        </p>

        <div className="dk-demo-note small mb-3" role="note">
          <p className="fw-semibold mb-1">Demo build: no SMS is sent</p>
          <p className="mb-0">
            Your code is <span className="dk-demo-code">{pending.demoCode}</span>
          </p>
        </div>

        <div aria-live="polite">
          {notice && (
            <div className={`alert alert-${notice.kind} py-2`} role={notice.kind === "danger" ? "alert" : "status"}>
              {notice.text}
            </div>
          )}
        </div>

        <FormField id="verify-code" label="Verification code" error={error}>
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            className="form-control dk-code-input"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.replace(/\D/g, ""));
              setServerFieldError(null);
            }}
          />
        </FormField>

        <button type="submit" className="btn btn-primary w-100 mb-3" disabled={status !== "idle"}>
          {status === "verifying" && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>}
          {status === "verifying" ? "Checking code…" : "Verify and create account"}
        </button>

        <div className="d-flex flex-wrap justify-content-between gap-2 small">
          <button type="button" className="btn btn-link btn-sm p-0" onClick={handleResend} disabled={resendIn > 0 || status !== "idle"}>
            {status === "resending" ? "Sending…" : resendIn > 0 ? `Send a new code in ${resendIn} s` : "Send a new code"}
          </button>
          <button type="button" className="btn btn-link btn-sm p-0" onClick={onChangeNumber}>
            Change number
          </button>
        </div>
      </div>
    </form>
  );
}
