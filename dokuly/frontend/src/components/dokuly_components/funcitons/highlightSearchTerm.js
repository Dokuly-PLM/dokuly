import React from "react";

/**
 * Highlights a search term within a given text by wrapping the matching portion with <strong> tags.
 *
 * @param {string} text - The text to search within and highlight.
 * @param {string} searchTerm - The search term to be highlighted within the text.
 * @returns {React.ReactNode} - A React component that displays the text with the matching portion in bold.
 *
 * @example
 * // Highlight the search term "apple" within the text "A juicy apple":
 * const highlightedText = highlightSearchTerm("A juicy apple", "apple");
 * // Returns: <><strong>A juicy </strong>apple</>
 */
const highlightSearchTerm = (text, searchTerm) => {
  if (typeof text !== "string") {
    return text; // Return the input text as is if it's not a string
  }

  const index = text.toLowerCase().indexOf(searchTerm.toLowerCase());
  if (index === -1) {
    return text;
  }
  return (
    <>
      {text.slice(0, index)}
      <strong>{text.slice(index, index + searchTerm.length)}</strong>
      {text.slice(index + searchTerm.length)}
    </>
  );
};

export default highlightSearchTerm;
