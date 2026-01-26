import React, { useState, useEffect } from "react";
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
  approved: "shield-check.svg",
  released: "check.svg",
  updated: "edit.svg",
};

const ACTION_LABELS = {
  created: "Created",
  revision_created: "Revision Created",
  bom_edited: "BOM Edited",
  approved: "Approved for Release",
  released: "Released",
  updated: "Updated",
};

const ICON_BASE = "../../../../static/icons/";

const TraceabilityTable = ({ item, app }) => {
  const [traceabilityData, setTraceabilityData] = useState([]);
  const [tableTextSize, setTableTextSize] = useState("16px");
  const [loading, setLoading] = useState(true);
  const [showDiffModal, setShowDiffModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    if (item != null && item !== undefined) {
      fetchTraceabilityData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item]);

  const fetchTraceabilityData = async () => {
    if (!item || !item.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(
        `api/traceability/${app}/${item.id}/`,
        tokenConfig(),
      );

      if (response.status === 200 && response.data) {
        const transformedData = response.data.map((event) => {
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
        setTraceabilityData(transformedData);
      }
    } catch (err) {
      console.error("Error fetching traceability data:", err);
      setTraceabilityData([]);
    } finally {
      setLoading(false);
    }
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
          return <DokulyDateFormat date={row.date} />;
        }
        return "";
      },
      csvFormatter: (row) => (row?.date ? `${row?.date}` : ""),
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
        if (row.details && row.details.length > 100) {
          return (
            <span title={row.details}>{row.details.substring(0, 100)}...</span>
          );
        }
        return row.details || "";
      },
      csvFormatter: (row) => row?.details || "",
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
            itemsPerPage={255}
            showPagination={true}
            showSearch={true}
            defaultSort={defaultSort}
            textSize={tableTextSize}
            setTextSize={setTableTextSize}
            showTableSettings={true}
            onRowClick={handleRowClick}
          />
        </Card.Body>
      </DokulyCard>
      <TraceabilityDiffModal
        show={showDiffModal}
        onHide={() => setShowDiffModal(false)}
        event={selectedEvent}
      />
    </>
  );
};

export default TraceabilityTable;
