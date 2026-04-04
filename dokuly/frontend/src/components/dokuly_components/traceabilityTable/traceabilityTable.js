import React, { useState, useEffect, useCallback } from "react";
import { Card } from "react-bootstrap";
import axios from "axios";
import { tokenConfig } from "../../../configs/auth";

import DokulyCard from "../dokulyCard";
import CardTitle from "../cardTitle";
import DokulyDateFormat from "../../dokuly_components/formatters/dateFormatter";
import TraceabilityDiffModal from "./TraceabilityDiffModal";

import "./auditLog.css";

const ACTION_DOT_COLORS = {
  created: "#165216",
  revision_created: "#165216",
  bom_edited: "#108E82",
  bom_imported: "#108E82",
  bom_cleared: "#B00020",
  approved: "#165216",
  released: "#165216",
  updated: "#6B7280",
};

const ACTION_LABELS = {
  created: "Created",
  revision_created: "Initial Revision Created",
  bom_edited: "BOM Updated",
  bom_imported: "BOM Import",
  bom_cleared: "BOM Cleared",
  approved: "Approved for Release",
  released: "State Change: Released",
  updated: "Updated",
};

const PAGE_SIZE = 50;

const DESIGNATOR_LABEL = { pcbas: "Ref.Des.", assemblies: "F/N", parts: "F/N" };
const designatorLabelForApp = (app) => {
  if (DESIGNATOR_LABEL[app]) {
    return DESIGNATOR_LABEL[app];
  }
  return "F/N";
};

function formatBomDetailsForTable(details, designatorLabel, eventType) {
  if (!details) {
    return "";
  }
  if (eventType === "bom_cleared") {
    return details;
  }
  let text = details;
  if (text.includes(" → ")) {
    text = text.replace(" → ", ` (${designatorLabel}) → `);
  }
  text = text.replace(/\brefdes\b/gi, designatorLabel);
  text = text.replace(/\bRef\.?\s*des\.?/gi, designatorLabel);
  return text;
}


const TraceabilityTable = ({ item, app }) => {
  const [traceabilityData, setTraceabilityData] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showDiffModal, setShowDiffModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const designatorLabel = designatorLabelForApp(app);

  const fetchTraceabilityData = useCallback(
    async (page = 1) => {
      if (!item || !item.id) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const response = await axios.get(
          `api/traceability/${app}/${item.id}/`,
          {
            ...tokenConfig(),
            params: { page, page_size: PAGE_SIZE },
          },
        );
        if (response.status === 200 && response.data) {
          const { results = [], count = 0 } = response.data;
          const withUserAndAction = results.map((event) => {
            let userName = "Unknown";
            if (event.user_first_name && event.user_last_name) {
              userName = `${event.user_first_name} ${event.user_last_name}`;
            } else if (event.profile?.first_name && event.profile?.last_name) {
              userName = `${event.profile.first_name} ${event.profile.last_name}`;
            }
            const actionLabel =
              ACTION_LABELS[event.event_type] || event.event_type;
            return {
              ...event,
              user: userName,
              action: actionLabel,
              date: event.timestamp,
            };
          });
          // Group "Clear BOM" events: same second + same user = one action row
          const tsSec = (t) => {
            if (t && typeof t === "string") {
              return t.slice(0, 19);
            }
            return (t ?? "").toString().slice(0, 19);
          };
          const parseDesignator = (oldVal) =>
            (oldVal || "").split(/\s*→\s*/)[0]?.trim() || "";
          const grouped = [];
          for (let i = 0; i < withUserAndAction.length; i++) {
            const event = withUserAndAction[i];
            if (
              event.event_type === "bom_cleared" &&
              event.field_name === "clear bom"
            ) {
              const batch = [event];
              while (
                i + 1 < withUserAndAction.length &&
                withUserAndAction[i + 1].event_type === "bom_cleared" &&
                withUserAndAction[i + 1].field_name === "clear bom" &&
                tsSec(withUserAndAction[i + 1].timestamp) ===
                  tsSec(event.timestamp) &&
                withUserAndAction[i + 1].user === event.user
              ) {
                i += 1;
                batch.push(withUserAndAction[i]);
              }
              const designators = batch
                .map((e) => parseDesignator(e.old_value))
                .filter(Boolean);
              let details;
              if (designators.length > 0) {
                details = `Removed ${designatorLabel}: ${designators.join(", ")}`;
              } else {
                details = `${batch.length} row(s) removed from BOM`;
              }
              grouped.push({
                ...event,
                events: batch,
                details,
              });
            } else {
              grouped.push({ ...event, events: [event] });
            }
          }
          setTraceabilityData(grouped);
          setTotalCount(count);
        }
      } catch (err) {
        console.error("Error fetching traceability data:", err);
        setTraceabilityData([]);
        setTotalCount(0);
      } finally {
        setLoading(false);
      }
    },
    [item, app, designatorLabel],
  );

  useEffect(() => {
    if (item != null && item !== undefined) {
      setCurrentPage(1);
      fetchTraceabilityData(1);
    }
  }, [item, fetchTraceabilityData]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchTraceabilityData(page);
  };

  const handleEntryClick = (event) => {
    setSelectedEvent(event);
    setShowDiffModal(true);
  };

  if (loading) {
    return (
      <DokulyCard>
        <CardTitle
          titleText={"Audit Log"}
          style={{ paddingLeft: "15px", paddingTop: "15px" }}
        />
        <Card.Body>
          <div className="d-flex justify-content-center">
            <div className="spinner-border" role="status" />
          </div>
        </Card.Body>
      </DokulyCard>
    );
  }

  return (
    <>
      <DokulyCard>
        <CardTitle
          titleText={"Audit Log"}
          style={{ paddingLeft: "15px", paddingTop: "15px" }}
        />
        <Card.Body>
          <div className="audit-log">
            {traceabilityData.length === 0 && (
              <div className="text-muted" style={{ padding: "1rem 0" }}>
                No audit log entries yet.
              </div>
            )}
            {traceabilityData.map((event, idx) => {
              const dotColor =
                ACTION_DOT_COLORS[event.event_type] || "#6B7280";
              const label = event.action || event.event_type;
              const userName = event.user;

              return (
                <div
                  key={event.id ?? idx}
                  className="audit-log__entry"
                  onClick={() => handleEntryClick(event)}
                >
                  <span
                    className="audit-log__dot"
                    style={{ backgroundColor: dotColor }}
                  />
                  <div className="audit-log__content">
                    <div className="audit-log__action">{label}</div>
                    <div className="audit-log__meta">
                      {userName && userName !== "Unknown" && (
                        <>By {userName}</>
                      )}
                      {userName && userName !== "Unknown" && event.date && (
                        <span className="audit-log__separator">{" \u2022 "}</span>
                      )}
                      {event.date && (
                        <DokulyDateFormat date={event.date} />
                      )}
                    </div>
                    {event.details && (
                      <div className="audit-log__details">
                        {event.details.length > 120
                          ? `${event.details.substring(0, 120)}...`
                          : event.details}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {totalPages > 1 && (
            <div className="audit-log__pagination">
              <button
                type="button"
                className="audit-log__page-btn"
                disabled={currentPage <= 1}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                Previous
              </button>
              <span className="audit-log__page-info">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                className="audit-log__page-btn"
                disabled={currentPage >= totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                Next
              </button>
            </div>
          )}
        </Card.Body>
      </DokulyCard>
      <TraceabilityDiffModal
        show={showDiffModal}
        onHide={() => setShowDiffModal(false)}
        event={selectedEvent}
        app={app}
      />
    </>
  );
};

export default TraceabilityTable;
