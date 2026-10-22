import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Loads data when the dependencies change and exposes reload().
 * Late responses of an outdated request are ignored.
 */
export function useLoader(load, deps) {
  const [state, setState] = useState({ loading: true, error: '', data: null });
  const [tick, setTick] = useState(0);
  const loadRef = useRef(load);
  loadRef.current = load;

  useEffect(() => {
    let cancelled = false;
    setState((previous) => ({ ...previous, loading: true, error: '' }));
    loadRef
      .current()
      .then((data) => !cancelled && setState({ loading: false, error: '', data }))
      .catch((error) => !cancelled && setState((previous) => ({ ...previous, loading: false, error: error.message })));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const reload = useCallback(() => setTick((value) => value + 1), []);
  return { ...state, reload };
}

/** The selected tab lives in the URL hash, so a refresh keeps the user where they were. */
export function useTab(tabs, fallback) {
  const read = () => {
    const hash = window.location.hash.replace('#', '');
    return tabs.some((tab) => tab.id === hash) ? hash : fallback;
  };
  const [tab, setTab] = useState(read);

  useEffect(() => {
    const onHashChange = () => setTab(read());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const select = (id) => {
    window.location.hash = id;
    setTab(id);
  };
  return [tab, select];
}
