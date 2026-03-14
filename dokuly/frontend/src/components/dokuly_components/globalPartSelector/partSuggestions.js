import React from "react";
import DokulyImage from "../dokulyImage";
import { formatCloudImageUri } from "../../pcbas/functions/productionHelpers";

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

        const combinedText = `${full_part_number}, ${display_name} ${formattedProjectTitle}`;          return (
            // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
            <li
              key={`${full_part_number}-${revision}`}
              className="list-group-item d-flex align-items-center"
              style={{ gap: "10px", cursor: "pointer" }}
              onClick={() => {
                onSelectSuggestion(suggestion);
                onHide();
              }}
            >
              <div
                style={{
                  flex: "0 0 40px",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "40px",
                }}
              >
                {(suggestion.thumbnail || suggestion.image_url) ? (
                  <DokulyImage
                    src={
                      suggestion.thumbnail
                        ? formatCloudImageUri(suggestion.thumbnail)
                        : suggestion.image_url
                    }
                    alt="Thumbnail"
                    style={{
                      maxWidth: "40px",
                      maxHeight: "40px",
                      objectFit: "contain",
                      display: "block",
                    }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.style.display = "none";
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      backgroundColor: "#f0f0f0",
                      borderRadius: "3px",
                    }}
                  />
                )}
              </div>
              <span style={{ flex: 1, minWidth: 0 }}>{highlightSearchTerm(combinedText)}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
