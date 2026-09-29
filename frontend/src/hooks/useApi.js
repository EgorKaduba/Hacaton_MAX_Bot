import { useEffect, useState } from "react";

export const useApi = (load, deps = []) => {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    load().then(
      (data) => active && setState({ data, error: null, loading: false }),
      (error) => active && setState({ data: null, error, loading: false }),
    );
    return () => {
      active = false;
    };
  }, [...deps, attempt]);

  return { ...state, retry: () => setAttempt((a) => a + 1) };
};
