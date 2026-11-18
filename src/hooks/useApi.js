import { useCallback, useEffect, useRef, useState } from "react";

/*
 * Loads data from the API and tracks loading / error state.
 *   const { data, loading, error, reload, updatedAt } = useApi(() => get("/api/barbers"), []);
 * With { pollMs }, the data refreshes in the background on that interval
 * (used for live queues). A failed background refresh keeps the last data
 * and sets `error`, so the page can show a warning instead of going blank.
 * Pass { skip: true } to wait (for example, until a shop is selected).
 */
export function useApi(loader, deps, { pollMs = 0, skip = false } = {}) {
  const [state, setState] = useState({ data: null, loading: !skip, error: null, updatedAt: null });
  const [reloadKey, setReloadKey] = useState(0);
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  useEffect(() => {
    if (skip) {
      setState({ data: null, loading: false, error: null, updatedAt: null });
      return undefined;
    }
    let cancelled = false;
    let timer;

    const run = (background) => {
      if (!background) setState((s) => ({ ...s, loading: true, error: null }));
      loaderRef
        .current()
        .then((data) => {
          if (!cancelled) setState({ data, loading: false, error: null, updatedAt: new Date() });
        })
        .catch((error) => {
          if (!cancelled) setState((s) => ({ ...s, data: background ? s.data : null, loading: false, error }));
        })
        .finally(() => {
          if (!cancelled && pollMs) timer = setTimeout(() => run(true), pollMs);
        });
    };

    run(false);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, reloadKey, pollMs, skip]);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);
  return { ...state, reload };
}
