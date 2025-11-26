import React, { useState, useEffect } from "react";
import { Row, Col } from "react-bootstrap";
import DokulyCard from "../../../dokuly_components/dokulyCard";
import DokulyTable from "../../../dokuly_components/dokulyTable/dokulyTable";
import { fetchWorkflowExecutions } from "../../functions/queries";
import { toast } from "react-toastify";

const WorkflowExecutionLogs = ({ workflowId = null }) => {
  const [executions, setExecutions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExecutions();
  }, [workflowId]);

  const loadExecutions = () => {
    setLoading(true);
    fetchWorkflowExecutions(workflowId)
      .then((res) => {
        if (res.status === 200) {
          setExecutions(res.data || []);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading workflow executions:", err);
        toast.error("Failed to load workflow execution logs");
        setLoading(false);
      });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      success: "success",
      partial: "warning",
      failed: "danger",
    };
    const color = statusColors[status] || "secondary";
    return (
      <span className={`badge bg-${color}`}>
        {status ? status.charAt(0).toUpperCase() + status.slice(1) : "Unknown"}
      </span>
    );
  };

  const columns = [
    {
      key: "workflow_name",
      header: "Workflow",
      sortable: true,
      defaultShowColumn: true,
    },
    {
      key: "trigger_type",
      header: "Trigger",
      sortable: true,
      defaultShowColumn: true,
      formatter: (row) => {
        const triggerLabels = {
          pcba_created: "PCBA Created",
          part_created: "Part Created",
          assembly_created: "Assembly Created",
          document_created: "Document Created",
          revision_created: "Revision Created",
        };
        return triggerLabels[row.trigger_type] || row.trigger_type;
      },
    },
    {
      key: "entity_type",
      header: "Entity Type",
      sortable: true,
      defaultShowColumn: true,
      formatter: (row) => {
        const entityLabels = {
          pcbas: "PCBAs",
          parts: "Parts",
          assemblies: "Assemblies",
          documents: "Documents",
        };
        return entityLabels[row.entity_type] || row.entity_type;
      },
    },
    {
      key: "entity_id",
      header: "Entity ID",
      sortable: true,
      defaultShowColumn: true,
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      defaultShowColumn: true,
      formatter: (row) => getStatusBadge(row.status),
    },
    {
      key: "executed_by_username",
      header: "Executed By",
      sortable: true,
      defaultShowColumn: true,
    },
    {
      key: "executed_at",
      header: "Executed At",
      sortable: true,
      defaultShowColumn: true,
      formatter: (row) => formatDate(row.executed_at),
    },
    {
      key: "actions_executed",
      header: "Actions",
      sortable: false,
      defaultShowColumn: true,
      formatter: (row) => {
        const actions = row.actions_executed || [];
        return actions.length > 0 ? (
          <span title={JSON.stringify(actions, null, 2)}>
            {actions.length} action{actions.length !== 1 ? "s" : ""}
          </span>
        ) : (
          "No actions"
        );
      },
    },
    {
      key: "errors",
      header: "Errors",
      sortable: false,
      defaultShowColumn: true,
      formatter: (row) => {
        const errors = row.errors || [];
        if (errors.length === 0) return <span className="text-success">None</span>;
        return (
          <span className="text-danger" title={JSON.stringify(errors, null, 2)}>
            {errors.length} error{errors.length !== 1 ? "s" : ""}
          </span>
        );
      },
    },
  ];

  return (
    <DokulyCard>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5>Workflow Execution Logs</h5>
        <button
          className="btn btn-sm btn-bg-transparent"
          onClick={loadExecutions}
          title="Refresh"
        >
          ↻
        </button>
      </div>
      <DokulyTable
        data={executions}
        columns={columns}
        loading={loading}
        tableName="workflow_executions"
      />
    </DokulyCard>
  );
};

export default WorkflowExecutionLogs;

