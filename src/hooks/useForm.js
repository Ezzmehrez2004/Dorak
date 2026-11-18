import { useState } from "react";

/*
 * Controlled-form helper shared by the login and sign-up forms.
 *   const form = useForm({ phone: "" }, validateLogin);
 *   <input value={form.values.phone} onChange={form.change("phone")} onBlur={form.blur("phone")} />
 * Errors show after a field is left (blur) or after a submit attempt.
 * Server-side field errors (from ApiError.fields) can be added with setServerErrors.
 */
export function useForm(initialValues, validate) {
  const [values, setValues] = useState(initialValues);
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [serverErrors, setServerErrors] = useState({});

  const errors = { ...serverErrors, ...validate(values) };
  const hasErrors = Object.keys(validate(values)).length > 0;

  const change = (field) => (event) => {
    const { type, checked, value } = event.target;
    setValues((v) => ({ ...v, [field]: type === "checkbox" ? checked : value }));
    if (serverErrors[field]) setServerErrors((s) => ({ ...s, [field]: undefined }));
  };

  // Mark a field as visited. Skipped when focus is moving to the submit
  // button: showing an error there would push the button down mid-click.
  const blur = (field) => (event) => {
    if (event?.relatedTarget?.type === "submit") return;
    setTouched((t) => ({ ...t, [field]: true }));
  };

  const errorFor = (field) => ((touched[field] || submitted) && errors[field]) || null;

  // Call at the start of onSubmit. Returns true when the form is valid;
  // otherwise focuses the first field (in `order`) that has an error.
  const trySubmit = (order, idFor) => {
    setSubmitted(true);
    if (!hasErrors) return true;
    const first = order.find((f) => validate(values)[f]);
    if (first) document.getElementById(idFor(first))?.focus();
    return false;
  };

  return { values, errors, errorFor, change, blur, trySubmit, setServerErrors };
}
