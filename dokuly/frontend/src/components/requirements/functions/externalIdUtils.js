import React from "react";

// Depth-based segment colors — muted for shared prefixes, vibrant for unique suffixes.
// Mirrors the Dokuly palette: gray → teal → magenta → primary green
const SEGMENT_COLORS = ["#9CA3AF", "#108e82", "#da4678", "#165216"];
const SEPARATOR_COLOR = "#D1D5DB";

/**
 * Split an external requirement ID into alternating [segment, separator, ...] tokens.
 * Separators are: optional whitespace around / or -
 */
export function tokenizeExternalId(id) {
  return id.split(/([ \t]*[\/\-][ \t]*)/);
}

/**
 * Render an external requirement ID with depth-based syntax highlighting.
 * Separators are muted; each path segment gets a progressively more vibrant color.
 */
export function renderExternalId(fullId) {
  if (!fullId) return null;
  const tokens = tokenizeExternalId(fullId);
  let segmentIndex = 0;
  return tokens.map((token, i) => {
    if (i % 2 === 1) {
      return (
        <span key={i} style={{ color: SEPARATOR_COLOR }}>
          {token}
        </span>
      );
    }
    const color = SEGMENT_COLORS[Math.min(segmentIndex, SEGMENT_COLORS.length - 1)];
    segmentIndex++;
    return (
      <span key={i} style={{ color }}>
        {token}
      </span>
    );
  });
}
