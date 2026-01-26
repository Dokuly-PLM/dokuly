import React, { useState, useEffect } from "react";
import { Card } from "react-bootstrap";
import axios from "axios";
import { tokenConfig } from "../../../configs/auth";

import DokulyTable from "../dokulyTable/dokulyTable";
import DokulyCard from "../dokulyCard";
import CardTitle from "../cardTitle";
import DokulyDateFormat from "../formatters/dateFormatter";

const TraceabilityTable = ({ item, app }) => {
  const [traceabilityData, setTraceabilityData] = useState([]);
  const [tableTextSize, setTableTextSize] = useState("16px");
  const [loading, setLoading] = useState(true);

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
        tokenConfig()
      );

      if (response.status === 200 && response.data) {
        // Transform the API data to match the table format
        const transformedData = response.data.map((event) => {
          // Format user name
          let userName = "Unknown";
          if (event.user_first_name && event.user_last_name) {
            userName = `${event.user_first_name} ${event.user_last_name}`;
          } else if (event.profile?.first_name && event.profile?.last_name) {
            userName = `${event.profile.first_name} ${event.profile.last_name}`;
          }

          // Map event types to display names
          const actionMap = {
            created: "Created",
            revision_created: "Revision Created",
            bom_edited: "BOM Edited",
            approved: "Approved for Release",
            released: "Released",
            updated: "Updated",
          };

          return {
            action: actionMap[event.event_type] || event.event_type,
            user: userName,
            date: event.timestamp,
            revision: event.revision || "",
            details: event.details || "",
          };
        });

        setTraceabilityData(transformedData);
      }
    } catch (err) {
      console.error("Error fetching traceability data:", err);
      // Fallback to empty array if API fails
      setTraceabilityData([]);
    } finally {
      setLoading(false);
    }
  };

  // Configuration for the DokulyTable columns
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
      key: "revision",
      header: "Revision",
      includeInCsv: true,
      sort: true,
      csvFormatter: (row) => row?.revision || "",
    },
    {
      key: "details",
      header: "Details",
      includeInCsv: true,
      formatter: (row) => {
        if (row.details && row.details.length > 100) {
          return (
            <span title={row.details}>
              {row.details.substring(0, 100)}...
            </span>
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
        />
      </Card.Body>
    </DokulyCard>
  );
};

export default TraceabilityTable;
