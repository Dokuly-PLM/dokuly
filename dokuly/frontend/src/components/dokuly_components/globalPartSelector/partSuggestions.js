import React from "react";

export const PartSuggestions = ({
  suggestions,
  onSelectSuggestion,
  style,
  onHide,
  searchTerm,
  organization,
}) => {
  const highlightSearchTerm = (text) => {
    if (!text) {
      return "";
    }

    const parts = text.split(new RegExp(`(${searchTerm})`, "gi"));
    return parts.map((part, index) => {
      const key = `${part}-${index}`;
      return part.toLowerCase() === searchTerm.toLowerCase() ? (
        <strong key={key}>{part}</strong>
      ) : (
        <span key={key}>{part}</span>
      );
    });
  };

  return (
    <div className="part-suggestions" style={{ ...style }}>
      <ul className="list-group scrollable-list">
        {suggestions.map((suggestion) => {
          let formattedProjectTitle = "";
          const { full_part_number, revision, display_name, project_title } =
            suggestion;
          if (project_title !== undefined) {
            formattedProjectTitle = `- ${project_title}`;
          }

          const combinedText = `${(() => {
            const useNumberRevisions = organization?.use_number_revisions || false;
            if (useNumberRevisions) {
              // For number revisions, full_part_number already includes the revision with underscore
              return full_part_number;
            }
            // For letter revisions, append the revision to the base part number
            return `${full_part_number}${revision}`;
          })()}, ${display_name} ${formattedProjectTitle}`;

          return (
            // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
            <li
              key={`${full_part_number}-${revision}`}
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
