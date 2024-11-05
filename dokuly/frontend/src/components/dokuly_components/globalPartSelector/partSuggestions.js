import React from "react";

export const PartSuggestions = ({
  suggestions,
  onSelectSuggestion,
  style,
  onHide,
  searchTerm,
}) => {
  const highlightSearchTerm = (text) => {
    if (!text) {
      return "";
    }

    const parts = text.split(new RegExp(`(${searchTerm})`, "gi"));
    return parts.map((part, index) =>
      part.toLowerCase() === searchTerm.toLowerCase() ? (
        <strong key={index}>{part}</strong>
      ) : (
        part
      ),
    );
  };

  return (
    <div className="part-suggestions" style={{ ...style }}>
      <ul className="list-group scrollable-list">
        {suggestions.map((suggestion, index) => {
          let formattedProjectTitle = "";
          const { full_part_number, revision, display_name, project_title } =
            suggestion;
          if (project_title !== undefined) {
            formattedProjectTitle = `- ${project_title}`;
          }

          const combinedText = `${full_part_number}${revision}, ${display_name} ${formattedProjectTitle}`;

          return (
            // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
            <li
              key={index}
              className="list-group-item d-flex align-items-center"
              onClick={() => {
                onSelectSuggestion(suggestion);
                onHide();
              }}
            >
              <span>{highlightSearchTerm(combinedText)}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
