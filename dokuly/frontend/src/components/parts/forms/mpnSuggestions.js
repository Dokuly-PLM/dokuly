import React, { useEffect, useRef } from "react";
import "./styles/newPartForm.css";

export const MpnSuggestions = ({
  suggestions,
  onSelectSuggestion,
  style,
  onHide,
  searchTerm,
}) => {
  if (!suggestions || suggestions.length === 0) {
    return <></>;
  }

  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onHide(); // Hide the dropdown if click is outside the dropdown element
      }
    };

    // Add when mounted
    document.addEventListener("mousedown", handleClickOutside);

    // Return function to be called when unmounted
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const highlightSearchTerm = (mpn) => {
    const index = mpn.toLowerCase().indexOf(searchTerm.toLowerCase());
    if (index === -1) {
      return mpn;
    }
    return (
      <>
        {mpn.slice(0, index)}
        <strong>{mpn.slice(index, index + searchTerm.length)}</strong>
        {mpn.slice(index + searchTerm.length)}
      </>
    );
  };

  const thumbnailStyle = {
    width: "50px",
    height: "50px",
    objectFit: "cover",
    marginRight: "0.5rem",
  };

  return (
    <div className="mpn-suggestions" style={style} ref={dropdownRef}>
      <ul className="list-group scrollable-list">
        {suggestions.map((suggestion, index) => {
          const { mpn, manufacturer, part_information } = suggestion;
          const image_link = part_information?.image_link || "";

          return (
            <li
              key={index}
              className="list-group-item d-flex align-items-center"
              onClick={() => {
                onSelectSuggestion(suggestion);
                onHide();
              }}
            >
              {/* Use actual image if available, otherwise use a spacer */}
              {image_link ? (
                <img
                  src={image_link}
                  alt="Part Thumbnail"
                  className="rounded"
                  style={thumbnailStyle}
                />
              ) : (
                <div style={thumbnailStyle}></div>
              )}
              {highlightSearchTerm(mpn)}, {manufacturer}
            </li>
          );
        })}
      </ul>
    </div>
  );
};
