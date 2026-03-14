import React, { useRef, useCallback } from "react";

const DokulySearchBar = ({
  value = "",
  onChange,
  placeholder = "Search...",
  debounceMs = 300,
  maxWidth = "400px",
  className = "mb-3",
}) => {
  const debounceTimer = useRef(null);

  const handleChange = useCallback(
    (e) => {
      const term = e.target.value;
      if (debounceMs > 0) {
        if (debounceTimer.current) {
          clearTimeout(debounceTimer.current);
        }
        debounceTimer.current = setTimeout(() => {
          onChange(term);
        }, debounceMs);
      } else {
        onChange(term);
      }
    },
    [onChange, debounceMs]
  );

  return (
    <div className={className} style={{ maxWidth }}>
      <input
        type="text"
        className="form-control"
        placeholder={placeholder}
        defaultValue={value}
        onChange={handleChange}
      />
    </div>
  );
};

export default DokulySearchBar;
