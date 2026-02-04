import React, { useState, useEffect, useCallback } from "react";
import { Card } from "react-bootstrap";
import axios from "axios";
import { tokenConfig } from "../../../configs/auth";

import DokulyTable from "../dokulyTable/dokulyTable";
import DokulyCard from "../dokulyCard";
import CardTitle from "../cardTitle";
import DokulyDateFormat from "../../dokuly_components/formatters/dateFormatter";
import TraceabilityDiffModal from "./TraceabilityDiffModal";

const ACTION_ICONS = {
  created: "file-plus.svg",
  revision_created: "git-branch.svg",
  bom_edited: "clipboard-list.svg",
  bom_imported: "clipboard-list.svg",
  bom_cleared: "trash.svg",
  approved: "shield-check.svg",
  released: "check.svg",
  updated: "edit.svg",
};

const ACTION_LABELS = {
  created: "Created",
  revision_created: "Revision Created",
  bom_edited: "BOM Edited",
  bom_imported: "BOM Import",
  bom_cleared: "Clear BOM",
  approved: "Approved for Release",
  released: "Released",
  updated: "Updated",
};

const ICON_BASE = "../../../../static/icons/";

const PAGE_SIZE = 50;

const DESIGNATOR_LABEL = { pcbas: "Ref.Des.", assemblies: "F/N", parts: "F/N" };
const designatorLabelForApp = (app) => {
  if (DESIGNATOR_LABEL[app]) {
    return DESIGNATOR_LABEL[app];
  }
  return "F/N";
};

/** Format BOM details for table: no prefix for clear; designator label before → for add/import; "refdes"/"Ref.des" → designatorLabel. */
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
  const [tableTextSize, setTableTextSize] = useState("16px");
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

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    fetchTraceabilityData(pageNumber);
  };

  const handleRowClick = (_rowId, row) => {
    setSelectedEvent(row);
    setShowDiffModal(true);
  };

  const columns = [
    {
      key: "date",
      header: "Date",
      includeInCsv: true,
      sort: true,
      formatter: (row) => {
        if (row.date) {
          return <DokulyDateFormat date={row.date} showTime={true} />;
        }
        return "";
      },
      csvFormatter: (row) => {
        if (row?.date) {
          return `${row?.date}`;
        }
        return "";
      },
    },
    {
      key: "action",
      header: "Action",
      includeInCsv: true,
      sort: true,
      formatter: (row) => {
        const icon = ACTION_ICONS[row.event_type] || "edit.svg";
        const label =
          row.action || ACTION_LABELS[row.event_type] || row.event_type;
        return (
          <span className="d-inline-flex align-items-center gap-1">
            <img
              src={`${ICON_BASE}${icon}`}
              alt=""
              style={{ width: "20px", height: "20px", opacity: 0.9 }}
            />
            <span>{label}</span>
          </span>
        );
      },
      csvFormatter: (row) => row?.action || "",
    },
    {
      key: "user",
      header: "User",
      includeInCsv: true,
      sort: true,
      csvFormatter: (row) => row?.user || "",
    },
    {
      key: "details",
      header: "Details",
      includeInCsv: true,
      formatter: (row) => {
        const isBom = ["bom_edited", "bom_imported", "bom_cleared"].includes(
          row.event_type,
        );
        let text;
        if (isBom) {
          text = formatBomDetailsForTable(
            row.details,
            designatorLabel,
            row.event_type,
          );
        } else {
          text = row.details || "";
        }
        if (text && text.length > 100) {
          return <span title={text}>{text.substring(0, 100)}...</span>;
        }
        return text;
      },
      csvFormatter: (row) => {
        const isBom = ["bom_edited", "bom_imported", "bom_cleared"].includes(
          row.event_type,
        );
        if (isBom) {
          return formatBomDetailsForTable(
            row.details,
            designatorLabel,
            row.event_type,
          );
        }
        return row?.details || "";
      },
    },
  ];

  const defaultSort = {
    columnNumber: 0,
    order: "desc",
  };

  if (loading) {
    return (
      <DokulyCard>
        <CardTitle
          titleText={"Traceability"}
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
          titleText={"Traceability"}
          style={{ paddingLeft: "15px", paddingTop: "15px" }}
        />
        <Card.Body>
          <DokulyTable
            tableName={"TraceabilityTable"}
            data={traceabilityData}
            columns={columns}
            showCsvDownload={true}
            itemsPerPage={PAGE_SIZE}
            showPagination={true}
            showSearch={true}
            defaultSort={defaultSort}
            textSize={tableTextSize}
            setTextSize={setTableTextSize}
            showTableSettings={true}
            onRowClick={handleRowClick}
            serverSidePagination={true}
            totalItemCount={totalCount}
            currentPage={currentPage}
            onPageChange={handlePageChange}
          />
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
