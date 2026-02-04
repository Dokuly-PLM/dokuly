import React from "react";
import { Modal } from "react-bootstrap";
import DokulyDateFormat from "../../dokuly_components/formatters/dateFormatter";

const DESIGNATOR_LABEL_BY_APP = {
  pcbas: "Ref.Des.",
  assemblies: "F/N",
  parts: "F/N",
};
const designatorLabelForApp = (app) => {
  if (DESIGNATOR_LABEL_BY_APP[app]) {
    return DESIGNATOR_LABEL_BY_APP[app];
  }
  return "F/N";
};

const parseDesignatorPart = (oldVal) => {
  if (!oldVal || typeof oldVal !== "string") {
    return { designator: "", part: "" };
  }
  const parts = oldVal.split(/\s*→\s*/);
  return {
    designator: (parts[0] || "").trim(),
    part: (parts[1] || "").trim(),
  };
};

/** Insert designator label before → for display (e.g. "11 → ASM" → "11 (F/N) → ASM"). */
const formatValueWithDesignatorLabel = (value, designatorLabel) => {
  if (value == null || typeof value !== "string") {
    return value;
  }
  if (value.includes(" → ")) {
    return value.replace(" → ", ` (${designatorLabel}) → `);
  }
  return value;
};

/**
 * Generic diff modal for a single traceability event.
 * Works for any app (parts, pcbas, assemblies): shows field_name / old_value / new_value when present,
 * otherwise falls back to the details text.
 * For grouped "Clear BOM" actions, row.events is an array; the modal shows all rows removed (designator → part).
 */
const TraceabilityDiffModal = ({ show, onHide, event: row, app }) => {
  if (!row) return null;

  const designatorLabel = designatorLabelForApp(app);
  let events;
  if (row.events && row.events.length > 0) {
    events = row.events;
  } else {
    events = [row];
  }
  const isClearBom = row.event_type === "bom_cleared";

  const hasStructuredDiff =
    !isClearBom &&
    row.field_name != null &&
    (row.old_value != null || row.new_value != null);

  let userName;
  if (row.user_first_name && row.user_last_name) {
    userName = `${row.user_first_name} ${row.user_last_name}`;
  } else if (row.profile?.first_name && row.profile?.last_name) {
    userName = `${row.profile.first_name} ${row.profile.last_name}`;
  } else {
    userName = "Unknown";
  }

  return (
    <Modal show={show} onHide={onHide} size="md" centered>
      <Modal.Header closeButton>
        <Modal.Title>Change details</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="mb-2 small text-muted">
          {row.timestamp && (
            <>
              <DokulyDateFormat date={row.timestamp} />
              {" · "}
            </>
          )}
          {userName}
        </div>

        {isClearBom ? (
          <div className="traceability-diff">
            <div className="mb-2">
              <strong>Removed {designatorLabel}:</strong>
              <span className="ms-2 small text-muted">
                ({events.length} {events.length === 1 ? "row" : "rows"})
              </span>
            </div>
            <div className="table-responsive">
              <table className="table table-sm table-bordered mb-0">
                <thead>
                  <tr>
                    <th scope="col" className="text-nowrap">
                      {designatorLabel}
                    </th>
                    <th scope="col">Part</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((evt, idx) => {
                    const { designator, part } = parseDesignatorPart(
                      evt.old_value,
                    );
                    return (
                      <tr
                        key={evt.id != null ? evt.id : idx}
                        style={{
                          backgroundColor: "rgba(248, 215, 218, 0.3)",
                          borderColor: "rgba(220, 53, 69, 0.2)",
                        }}
                      >
                        <td className="text-break">{designator || "—"}</td>
                        <td className="text-break">{part || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : hasStructuredDiff ? (
          <div className="traceability-diff">
            <div className="mb-2">
              <strong>Field:</strong>{" "}
              <span className="text-capitalize">
                {row.field_name === "refdes"
                  ? designatorLabel
                  : (row.field_name?.replace(/_/g, " ") ?? "").replace(
                      /\bRef\.?\s*des\.?/gi,
                      designatorLabel,
                    ) || "—"}
              </span>
              {[
                "add bom item",
                "remove bom item",
                "bom import",
                "clear bom",
              ].includes(row.field_name) && (
                <span className="text-muted ms-1">({designatorLabel})</span>
              )}
            </div>
            <div className="d-flex align-items-stretch gap-2 flex-wrap">
              <div className="flex-grow-1" style={{ minWidth: "140px" }}>
                <div className="small text-muted mb-1">Previous value</div>
                <div
                  className="p-2 rounded border text-break"
                  style={{
                    minHeight: "2em",
                    backgroundColor: "rgba(248, 215, 218, 0.6)",
                    borderColor: "rgba(220, 53, 69, 0.3)",
                  }}
                >
                  {row.old_value != null && String(row.old_value).trim() !== ""
                    ? formatValueWithDesignatorLabel(
                        row.old_value,
                        designatorLabel,
                      )
                    : "—"}
                </div>
              </div>
              <div
                className="d-flex align-items-center flex-shrink-0"
                style={{ paddingTop: "1.5rem" }}
                aria-hidden
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-muted"
                  aria-hidden
                >
                  <title>Change direction</title>
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </div>
              <div className="flex-grow-1" style={{ minWidth: "140px" }}>
                <div className="small text-muted mb-1">Current value</div>
                <div
                  className="p-2 rounded border text-break"
                  style={{
                    minHeight: "2em",
                    backgroundColor: "rgba(212, 237, 218, 0.6)",
                    borderColor: "rgba(40, 167, 69, 0.3)",
                  }}
                >
                  {row.new_value != null && String(row.new_value).trim() !== ""
                    ? formatValueWithDesignatorLabel(
                        row.new_value,
                        designatorLabel,
                      )
                    : "—"}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-2 rounded border bg-light text-break">
            {row.details || "No details available."}
          </div>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default TraceabilityDiffModal;
