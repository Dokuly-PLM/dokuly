import { useEffect, useRef, useState } from "react";
import { useSearchParams, useLocation } from "react-router-dom";

/**
 * Two-way sync between component state, URL ?search=, and localStorage
 * - URL -> state (reload/back/forward/manual edit) - highest priority
 * - localStorage -> state (when URL is empty, e.g., returning from detail page)
 * - state -> URL (debounced + replace to avoid history spam)
 * - state -> localStorage (persist for navigation to detail pages)
 */
export function useSyncedSearchParam(paramName = "search", debounceMs = 250, tableName = "") {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const urlValue = searchParams.get(paramName) ?? "";
  
  // localStorage key is table-specific
  const storageKey = tableName ? `search_${tableName}` : `search_${location.pathname.split('/')[1]}`;

  // Initialize from URL (highest priority), then localStorage, then empty
  const [value, setValue] = useState(() => {
    if (urlValue) return urlValue;
    try {
      const stored = localStorage.getItem(storageKey);
      return stored || "";
    } catch {
      return "";
    }
  });
  const tRef = useRef(null);

  // URL -> state (highest priority)
  useEffect(() => {
    if (urlValue) {
      setValue(urlValue);
      // Also save to localStorage when URL has value
      try {
        localStorage.setItem(storageKey, urlValue);
      } catch {
        // Ignore localStorage errors
      }
    } else {
      // If URL is empty, try to restore from localStorage
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored && stored !== value) {
          setValue(stored);
        }
      } catch {
        // Ignore localStorage errors
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlValue, storageKey]);

  // state -> URL (debounced)
  useEffect(() => {
    if (value === urlValue) return;

    if (tRef.current) clearTimeout(tRef.current);
    tRef.current = setTimeout(() => {
      const next = new URLSearchParams(searchParams);
      if (value) {
        next.set(paramName, value);
      } else {
        next.delete(paramName);
      }

      setSearchParams(next, { replace: true });
    }, debounceMs);

    return () => {
      if (tRef.current) clearTimeout(tRef.current);
    };
  }, [value, urlValue, searchParams, setSearchParams, paramName, debounceMs]);

  // state -> localStorage (persist immediately)
  useEffect(() => {
    try {
      if (value) {
        localStorage.setItem(storageKey, value);
      } else {
        localStorage.removeItem(storageKey);
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [value, storageKey]);

  return [value, setValue];
}
