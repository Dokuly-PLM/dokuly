import React from "react";

/**
 * Generic star formatter function for tables.
 * Can be used with assemblies, pcbas, parts, etc.
 * 
 * @param {Object} row - The row data object (must have is_starred property)
 * @param {string} app - The app name (e.g., "assemblies", "pcbas", "parts") - currently unused but kept for future use
 * @param {Function} onStarClick - Callback function when star is clicked: (e, row) => void
 * @returns {JSX.Element|null} The star button component or null if invalid inputs
 */
export function starFormatter(row, app, onStarClick) {
  if (!row || !onStarClick) {
    return null;
  }

  const isStarred = row.is_starred || false;
  const starIconPath = "../../static/icons/star.svg";
  const starFilter = isStarred 
    ? "invert(70%) sepia(100%) saturate(2000%) hue-rotate(0deg) brightness(1) contrast(1)" // Yellow/gold
    : "invert(50%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(0.8) contrast(0.8)"; // Gray
  
  const handleClick = (e) => {
    e.stopPropagation();
    onStarClick(e, row);
  };
  
  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={isStarred ? "Starred - Click to unstar" : "Click to star"}
      style={{
        background: "none",
        border: "none",
        padding: 0,
        cursor: "pointer",
      }}
      title={isStarred ? "Starred" : "Click to star"}
    >
      <img
        src={starIconPath}
        alt={isStarred ? "Starred" : "Not starred"}
        style={{
          width: "20px",
          height: "20px",
          filter: starFilter,
        }}
      />
    </button>
  );
}
