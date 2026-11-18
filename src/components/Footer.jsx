import { useState } from "react";
import { isErrorSimulationOn, resetDemoData, setErrorSimulation } from "../api/api.js";

/*
 * Footer with a clear mock-data label and two demo tools for grading:
 * simulate a server error (to show error states) and reset the data.
 */
export default function Footer() {
  const [simulate, setSimulate] = useState(isErrorSimulationOn());

  const toggle = (event) => {
    setErrorSimulation(event.target.checked);
    setSimulate(event.target.checked);
  };

  const reset = () => {
    if (window.confirm("Reset all queues, tickets and reviews to the original demo data?")) {
      resetDemoData();
      window.location.assign(import.meta.env.BASE_URL);
    }
  };

  return (
    <footer className="dk-footer mt-5">
      <div className="container py-4 d-flex flex-column flex-md-row gap-3 justify-content-between">
        <p className="mb-0 small">
          <strong>Demo build (Milestone 1).</strong> All shops, barbers, queues and reviews are mock data stored in
          this browser. No payments are taken.
        </p>
        <div className="d-flex flex-wrap align-items-center gap-3 small">
          <div className="form-check form-switch mb-0">
            <input className="form-check-input" type="checkbox" role="switch" id="simulate-error" checked={simulate} onChange={toggle} />
            <label className="form-check-label" htmlFor="simulate-error">
              Simulate server error
            </label>
          </div>
          <button type="button" className="btn btn-sm btn-outline-light" onClick={reset}>
            Reset demo data
          </button>
        </div>
      </div>
    </footer>
  );
}
