import React, { useState, useEffect } from "react";
import { Row, Col } from "react-bootstrap";
import DokulyCard from "../../../dokuly_components/dokulyCard";
import DokulyTable from "../../../dokuly_components/dokulyTable/dokulyTable";
import { fetchWorkflowAuditLogs } from "../../functions/queries";
import { toast } from "react-toastify";

const WorkflowAuditLogs = ({ workflowId = null }) => {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAuditLogs();
  }, [workflowId]);

  const loadAuditLogs = () => {
    setLoading(true);
    fetchWorkflowAuditLogs(workflowId)
      .then((res) => {
        if (res.status === 200) {
          setAuditLogs(res.data || []);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading workflow audit logs:", err);
        toast.error("Failed to load workflow audit logs");
        setLoading(false);
      });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getActionBadge = (action) => {
    const actionColors = {
      created: "success",
      updated: "info",
      deleted: "danger",
      viewed: "secondary",
      enabled: "success",
      disabled: "warning",
    };
    const color = actionColors[action] || "secondary";
    return (
      <span className={`badge bg-${color}`}>
        {action ? action.charAt(0).toUpperCase() + action.slice(1) : "Unknown"}
      </span>
    );
  };

  const formatChanges = (changes) => {
    if (!changes || Object.keys(changes).length === 0) return "No changes";
    
    return (
      <div>
        {Object.entries(changes).map(([field, change]) => (
          <div key={field} style={{ fontSize: "0.85em", marginBottom: "4px" }}>
            <strong>{field}:</strong>{" "}
            <span className="text-muted">
              {typeof change === "object" && change.old !== undefined
                ? `${JSON.stringify(change.old)} → ${JSON.stringify(change.new)}`
                : JSON.stringify(change)}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const columns = [
    {
      key: "workflow_name_display",
      header: "Workflow",
      sortable: true,
      defaultShowColumn: true,
    },
    {
      key: "action",
      header: "Action",
      sortable: true,
      defaultShowColumn: true,
      formatter: (row) => getActionBadge(row.action),
    },
    {
      key: "performed_by_username",
      header: "Performed By",
      sortable: true,
      defaultShowColumn: true,
    },
    {
      key: "performed_at",
      header: "Performed At",
      sortable: true,
      defaultShowColumn: true,
      formatter: (row) => formatDate(row.performed_at),
    },
    {
      key: "changes",
      header: "Changes",
      sortable: false,
      defaultShowColumn: true,
      formatter: (row) => formatChanges(row.changes),
    },
    {
      key: "ip_address",
      header: "IP Address",
      sortable: true,
      defaultShowColumn: false,
    },
  ];

  return (
    <DokulyCard>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5>Workflow Audit Logs</h5>
        <button
          className="btn btn-sm btn-bg-transparent"
          onClick={loadAuditLogs}
          title="Refresh"
        >
          ↻
        </button>
      </div>
      <DokulyTable
        data={auditLogs}
        columns={columns}
        loading={loading}
        tableName="workflow_audit_logs"
      />
    </DokulyCard>
  );
};

export default WorkflowAuditLogs;

