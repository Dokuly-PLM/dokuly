import React from "react";

// Depth-based segment colors — muted for shared prefixes, vibrant for unique suffixes.
// Mirrors the Dokuly palette: gray → teal → magenta → primary green
const SEGMENT_COLORS = ["#9CA3AF", "#108e82", "#da4678", "#165216"];
const SEPARATOR_COLOR = "#D1D5DB";
const ELLIPSIS_COLOR = "#9CA3AF";

/**
 * Split an external requirement ID into alternating [segment, separator, ...] tokens.
 * Separators are: optional whitespace around / or -
 */
export function tokenizeExternalId(id) {
  return id.split(/([ \t]*[\/\-][ \t]*)/);
}

/**
 * Semantically shorten a requirement ID by culling middle pure-text segments.
 * Priority: keep first segment, keep any segment containing a digit, replace
 * consecutive "boring" middle segments with a single "…".
 *
 * MIL123/must          → ["MIL123", "/", "…"]
 * MIL/SOMETHING/123    → ["MIL", "/", "…", "/", "123"]
 * MIL/123              → ["MIL", "/", "123"]  (nothing to cull)
 */
export function shortenTokens(tokens) {
  // tokens = [seg0, sep0, seg1, sep1, seg2, ...]
  // even indices = segments, odd indices = separators
  const segments = tokens.filter((_, i) => i % 2 === 0);
  const separators = tokens.filter((_, i) => i % 2 === 1);

  if (segments.length <= 2) return tokens; // nothing to shorten

  const hasDigit = (s) => /\d/.test(s);

  // Decide which segments to keep
  const kept = segments.map((seg, idx) => {
    if (idx === 0) return true;           // always keep first
    if (hasDigit(seg)) return true;       // always keep numeric
    return false;                          // candidate for culling
  });

  // Build output, collapsing consecutive culled segments into one "…"
  const outSegments = [];
  const outSeparators = [];
  let pendingEllipsis = false;

  for (let i = 0; i < segments.length; i++) {
    if (kept[i]) {
      if (pendingEllipsis) {
        outSeparators.push(separators[i - 1] ?? "/");
        outSegments.push("…");
        pendingEllipsis = false;
      }
      if (outSegments.length > 0) {
        outSeparators.push(separators[i - 1] ?? "/");
      }
      outSegments.push(segments[i]);
    } else {
      pendingEllipsis = true;
    }
  }

  // If trailing ellipsis (last segment(s) culled), append it
  if (pendingEllipsis) {
    outSeparators.push(separators[segments.length - 2] ?? "/");
    outSegments.push("…");
  }

  // Interleave back into token array
  const result = [];
  for (let i = 0; i < outSegments.length; i++) {
    result.push(outSegments[i]);
    if (i < outSeparators.length) result.push(outSeparators[i]);
  }
  return result;
}

/**
 * Given tokens and a max character budget, progressively cull until it fits.
 * Levels:
 *   0 – full
 *   1 – shorten (keep numeric + first)
 *   2 – last segment only, prefixed with "…/"
 *   3 – truncate last segment itself to fit
 */
export function shortenTokensToFit(tokens, maxChars) {
  const charCount = (toks) => toks.reduce((sum, t) => sum + t.length, 0);

  // Level 0: full
  if (charCount(tokens) <= maxChars) return tokens;

  // Level 1: semantic shorten
  const level1 = shortenTokens(tokens);
  if (charCount(level1) <= maxChars) return level1;

  // Level 2: last segment only, prefixed with …<sep>
  const segments = tokens.filter((_, i) => i % 2 === 0);
  const separators = tokens.filter((_, i) => i % 2 === 1);
  const lastSeg = segments[segments.length - 1];
  const lastSep = separators[separators.length - 1] ?? "/";
  const level2 = ["…", lastSep, lastSeg];
  if (charCount(level2) <= maxChars) return level2;

  // Level 3: truncate the last segment itself
  const budget = maxChars - 2 - lastSep.length; // 2 for "…" prefix token
  const truncated = budget > 1 ? lastSeg.slice(0, budget) + "…" : "…";
  return ["…", lastSep, truncated];
}

/** 
 * Separators are muted; each path segment gets a progressively more vibrant color.
 * Options:
 *   shorten  – apply semantic shortening (keep numeric + first)
 *   maxChars – if set, cull progressively until text fits within this budget
 */
export function renderExternalId(fullId, { shorten = false, maxChars = null } = {}) {
  if (!fullId) return null;
  let tokens = tokenizeExternalId(fullId);
  if (maxChars !== null) {
    tokens = shortenTokensToFit(tokens, maxChars);
  } else if (shorten) {
    tokens = shortenTokens(tokens);
  }

  let segmentIndex = 0;
  return tokens.map((token, i) => {
    if (i % 2 === 1) {
      return (
        <span key={i} style={{ color: SEPARATOR_COLOR }}>
          {token}
        </span>
      );
    }
    const isEllipsis = token === "…";
    const color = isEllipsis
      ? ELLIPSIS_COLOR
      : SEGMENT_COLORS[Math.min(segmentIndex, SEGMENT_COLORS.length - 1)];
    if (!isEllipsis) segmentIndex++;
    return (
      <span key={i} style={{ color, fontStyle: isEllipsis ? "normal" : undefined }}>
        {token}
      </span>
    );
  });
}
