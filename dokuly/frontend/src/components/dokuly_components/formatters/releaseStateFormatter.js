import React from "react";

export function releaseStateFormatter(row) {
  if (!row || !row.release_state) {
    return ""; // Handle null or undefined row and release_state
  }

  if (row.release_state === "Draft") {
    if (row?.isPoBomItem) {
      return <span className="badge badge-pill badge-danger">Draft</span>;
    }
    return <span className="badge badge-pill badge-warning">Draft</span>;
  }

  if (row.release_state === "Review") {
    if (row?.isPoBomItem) {
      return <span className="badge badge-pill badge-danger">Review</span>;
    }
    return <span className="badge badge-pill badge-warning">Review</span>;
  }

  if (row.release_state === "Released") {
    return row.release_state;
  }

  return <span className="badge badge-pill badge-danger">MISSING RELEASE STATE!</span>;
}

export function releaseStateFormatterNoObject(state, isBomItem = false) {
  if (state === "Draft") {
    if (isBomItem) {
      return <span className="badge badge-pill badge-danger">Draft</span>;
    }
    return <span className="badge badge-pill badge-warning">Draft</span>;
  }
  if (state === "Review") {
    if (isBomItem) {
      return <span className="badge badge-pill badge-danger">Review</span>;
    }
    return <span className="badge badge-pill badge-warning">Review</span>;
  }
  if (state === "Released") {
    return state;
  }
  if (state) {
    return state;
  }
  return "--";
}
