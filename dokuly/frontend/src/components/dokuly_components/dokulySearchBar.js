import React, { useRef, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

const DokulySearchBar = ({
  onChange,
  placeholder = "Search...",
  debounceMs = 300,
  maxWidth = "400px",
  className = "mb-3",
  syncWithUrl = false,
  urlParamName = "q",
}) => {
  const debounceTimer = useRef(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const initialValue = syncWithUrl ? searchParams.get(urlParamName) || "" : "";
  const [inputValue, setInputValue] = useState(initialValue);
  const hasInitRef = useRef(false);

  // On mount, if URL has a search param, fire onChange
  useEffect(() => {
    if (syncWithUrl && initialValue && !hasInitRef.current) {
      hasInitRef.current = true;
      onChange(initialValue);
    }
  }, []);

  const updateUrl = useCallback(
    (term) => {
      if (!syncWithUrl || !setSearchParams) return;
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (term) {
          next.set(urlParamName, term);
        } else {
          next.delete(urlParamName);
        }
        return next;
      }, { replace: true });
    },
    [syncWithUrl, setSearchParams, urlParamName]
  );

  const handleChange = useCallback(
    (e) => {
      const term = e.target.value;
      setInputValue(term);
      if (debounceMs > 0) {
        if (debounceTimer.current) {
          clearTimeout(debounceTimer.current);
        }
        debounceTimer.current = setTimeout(() => {
          onChange(term);
          updateUrl(term);
        }, debounceMs);
      } else {
        onChange(term);
        updateUrl(term);
      }
    },
    [onChange, debounceMs, updateUrl]
  );

  return (
    <div className={className} style={{ maxWidth }}>
      <input
        type="text"
        className="form-control"
        placeholder={placeholder}
        value={inputValue}
        onChange={handleChange}
      />
    </div>
  );
};

export default DokulySearchBar;
