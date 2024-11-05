import React, { Component } from "react";
import moment from "moment";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";
import DokulyDateFormat from "../../dokuly_components/formatters/dateFormatter";
import QuestionToolTip from "../../dokuly_components/questionToolTip";

// Formatters are separated in own file in an attempt to generalize document tables.

export function dateFormatter(row) {
  const date_str =
    row.release_state === "Released" && row.released_date !== null
      ? row.released_date
      : row.last_updated;

  // Pass the array of formats as the second argument to the moment function
  return <DokulyDateFormat date={date_str} />;
}

export function genericDateFormatter(dateString) {
  return <DokulyDateFormat date={dateString} />;
}

export const titleFormatter = (row) => {
  const displayTitle =
    row?.title?.length > 100 ? `${row?.title.slice(0, 100)}...` : row?.title;

  return row?.title?.length > 100 ? (
    <QuestionToolTip
      optionalHelpText={row?.title}
      titleText={`${row?.title.slice(0, 100)}...`}
      placement="right"
      showTitle
      boldTitle={false}
      renderIcon={false}
    />
  ) : (
    <span>{displayTitle}</span>
  );
};

export const numberFormatter = (cell, row) => {
  if (row !== undefined && row != null) {
    if (row.is_latest_revision || row?.is_latest_revision === "True") {
      return (
        <span>
          {row?.full_document_number}
          <img
            src="../../../static/icons/alert-circle.svg"
            className="ml-1"
            style={{
              filter:
                "invert(42%) sepia(72%) saturate(6100%) hue-rotate(1deg) brightness(101%) contrast(107%)",
            }}
            alt="icon"
            data-toggle="tooltip"
            data-placement="top"
            title="A newer revision of this document exists!"
          />
        </span>
      );
    }
  }
  return row?.full_document_number;
};

export const numberFormatter2 = (row) => {
  if (row !== undefined && row != null) {
    if (!row.is_latest_revision) {
      return (
        <span>
          {row?.full_doc_number}
          <img
            src="../../../static/icons/alert-circle.svg"
            className="ml-1"
            style={{
              filter:
                "invert(42%) sepia(72%) saturate(6100%) hue-rotate(1deg) brightness(101%) contrast(107%)",
            }}
            alt="icon"
            data-toggle="tooltip"
            data-placement="top"
            title="A newer revision of this document exists!"
          />
        </span>
      );
    }
  }
  return row?.full_doc_number;
};
