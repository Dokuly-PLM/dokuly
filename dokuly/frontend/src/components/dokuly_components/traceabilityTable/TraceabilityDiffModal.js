import React from "react";
import { Modal } from "react-bootstrap";
import DokulyDateFormat from "../../dokuly_components/formatters/dateFormatter";

/**
 * Generic diff modal for a single traceability event.
 * Works for any app (parts, pcbas, assemblies): shows field_name / old_value / new_value when present,
 * otherwise falls back to the details text.
 */
const TraceabilityDiffModal = ({ show, onHide, event: row }) => {
  if (!row) return null;

  const hasStructuredDiff =
    row.field_name != null && (row.old_value != null || row.new_value != null);

  const userName =
    row.user_first_name && row.user_last_name
      ? `${row.user_first_name} ${row.user_last_name}`
      : row.profile?.first_name && row.profile?.last_name
        ? `${row.profile.first_name} ${row.profile.last_name}`
        : "Unknown";

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

        {hasStructuredDiff ? (
          <div className="traceability-diff">
            <div className="mb-2">
              <strong>Field:</strong>{" "}
              <span className="text-capitalize">
                {row.field_name?.replace(/_/g, " ") || "—"}
              </span>
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
                    ? row.old_value
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
                >
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
                    ? row.new_value
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
