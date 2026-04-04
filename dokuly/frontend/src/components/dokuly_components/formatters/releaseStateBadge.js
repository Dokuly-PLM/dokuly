import React from "react";

/**
 * Centralized release state badge styles.
 * All release state visual indicators should use these constants
 * so the color scheme can be updated in one place.
 */
const RELEASE_STATE_STYLES = {
  Draft: {
    background: "#E0F0FA",
    color: "#1A5276",
    label: "Draft",
  },
  Review: {
    background: "#FEF3C7",
    color: "#92400E",
    label: "Review",
  },
  Released: {
    background: "#E8F5E9",
    color: "#165216",
    label: "Released",
  },
  Obsolete: {
    background: "#EDEDED",
    color: "#6B7280",
    label: "Obsolete",
  },
};

/**
 * Variant for BOM items that are in Draft/Review — uses a danger style
 * to highlight that this BOM dependency is not yet released.
 */
const BOM_ITEM_STYLES = {
  Draft: {
    background: "#FEE2E2",
    color: "#991B1B",
    label: "Draft",
  },
  Review: {
    background: "#FEE2E2",
    color: "#991B1B",
    label: "Review",
  },
};

const badgeStyle = (config) => ({
  display: "inline-block",
  fontSize: "0.6875rem",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  lineHeight: 1.5,
  padding: "2px 10px",
  borderRadius: "4px",
  background: config.background,
  color: config.color,
});

/**
 * ReleaseStateBadge — the single source of truth for release state badges.
 *
 * @param {string} state - "Draft" | "Review" | "Released" | "Obsolete"
 * @param {boolean} [isBomItem=false] - Use danger variant for unreleased BOM items
 */
export const ReleaseStateBadge = ({ state, isBomItem = false }) => {
  if (!state) return null;

  let config;
  if (isBomItem && BOM_ITEM_STYLES[state]) {
    config = BOM_ITEM_STYLES[state];
  } else {
    config = RELEASE_STATE_STYLES[state];
  }

  if (!config) return <span>{state}</span>;

  return <span style={badgeStyle(config)}>{config.label}</span>;
};

/**
 * releaseStateFormatter — drop-in replacement for the old formatter.
 * Used in DokulyTable column formatters that receive a row object.
 *
 * @param {Object} row - Row with release_state and optional isPoBomItem
 * @returns {JSX.Element|string}
 */
export function releaseStateFormatter(row) {
  if (!row || !row.release_state) return "";
  return (
    <ReleaseStateBadge
      state={row.release_state}
      isBomItem={!!row.isPoBomItem}
    />
  );
}

/**
 * releaseStateFormatterNoObject — for when you have the state string directly.
 *
 * @param {string} state
 * @param {boolean} [isBomItem=false]
 * @returns {JSX.Element|string}
 */
export function releaseStateFormatterNoObject(state, isBomItem = false) {
  if (!state) return "--";
  return <ReleaseStateBadge state={state} isBomItem={isBomItem} />;
}

export default ReleaseStateBadge;
