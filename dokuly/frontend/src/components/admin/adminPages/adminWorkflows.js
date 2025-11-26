import React, { useState, useEffect } from "react";
import { Row, Col, Form, Nav, Tab } from "react-bootstrap";
import DokulyCard from "../../dokuly_components/dokulyCard";
import DokulyTable from "../../dokuly_components/dokulyTable/dokulyTable";
import AddButton from "../../dokuly_components/AddButton";
import DokulyModal from "../../dokuly_components/dokulyModal";
import SubmitButton from "../../dokuly_components/submitButton";
import CancelButton from "../../dokuly_components/cancelButton";
import DeleteButton from "../../dokuly_components/deleteButton";
import { toast } from "react-toastify";
import {
  fetchWorkflows,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
  fetchWorkflowTriggers,
  fetchWorkflowActions,
} from "../functions/queries";
import { fetchProjectsWithNumbers } from "../functions/queries";
import WorkflowBuilder from "../adminComponents/workflows/workflowBuilder";
import WorkflowExecutionLogs from "../adminComponents/workflows/workflowExecutionLogs";
import WorkflowAuditLogs from "../adminComponents/workflows/workflowAuditLogs";

const AdminWorkflows = ({ setRefresh }) => {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState(null);
  const [projects, setProjects] = useState([]);
  const [triggers, setTriggers] = useState([]);
  const [actions, setActions] = useState([]);

  useEffect(() => {
    loadWorkflows();
    loadProjects();
    loadTriggers();
    loadActions();
  }, []);

  const loadWorkflows = () => {
    setLoading(true);
    fetchWorkflows()
      .then((res) => {
        if (res.status === 200) {
          setWorkflows(res.data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading workflows:", err);
        toast.error("Failed to load workflows");
        setLoading(false);
      });
  };

  const loadProjects = () => {
    fetchProjectsWithNumbers()
      .then((res) => {
        if (res.status === 200) {
          setProjects(res.data);
        }
      })
      .catch((err) => {
        console.error("Error loading projects:", err);
      });
  };

  const loadTriggers = () => {
    fetchWorkflowTriggers()
      .then((res) => {
        if (res.status === 200) {
          // Backend returns array of objects with value and label
          setTriggers(res.data || []);
        }
      })
      .catch((err) => {
        console.error("Error loading triggers:", err);
        toast.error("Failed to load workflow triggers");
      });
  };

  const loadActions = () => {
    fetchWorkflowActions()
      .then((res) => {
        if (res.status === 200) {
          // Backend returns array of objects with value and label
          setActions(res.data || []);
        }
      })
      .catch((err) => {
        console.error("Error loading actions:", err);
        toast.error("Failed to load workflow actions");
      });
  };

  const handleAddWorkflow = () => {
    setEditingWorkflow(null);
    setShowModal(true);
  };

  const handleEditWorkflow = (workflow) => {
    setEditingWorkflow(workflow);
    setShowModal(true);
  };

  const handleDeleteWorkflow = (workflowId) => {
    if (window.confirm("Are you sure you want to delete this workflow?")) {
      deleteWorkflow(workflowId)
        .then((res) => {
          if (res.status === 200) {
            toast.success("Workflow deleted successfully");
            loadWorkflows();
            if (setRefresh) {
              setRefresh(true);
            }
          }
        })
        .catch((err) => {
          console.error("Error deleting workflow:", err);
          toast.error("Failed to delete workflow");
        });
    }
  };

  const handleSaveWorkflow = (workflowData) => {
    const promise = editingWorkflow
      ? updateWorkflow(editingWorkflow.id, workflowData)
      : createWorkflow(workflowData);

    promise
      .then((res) => {
        console.log("Workflow save response:", res);
        if (res.status === 200 || res.status === 201) {
          toast.success(
            `Workflow ${editingWorkflow ? "updated" : "created"} successfully`
          );
          setShowModal(false);
          setEditingWorkflow(null);
          loadWorkflows();
          if (setRefresh) {
            setRefresh(true);
          }
        } else {
          console.warn("Unexpected response status:", res.status);
          toast.warning(`Unexpected response: ${res.status}`);
        }
      })
      .catch((err) => {
        console.error("Error saving workflow:", err);
        console.error("Error response:", err.response);
        const errorMessage = err.response?.data?.detail || 
                           (typeof err.response?.data === 'object' ? JSON.stringify(err.response.data) : err.message) ||
                           `Failed to ${editingWorkflow ? "update" : "create"} workflow`;
        toast.error(errorMessage);
      });
  };

  const columns = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      defaultShowColumn: true,
      formatter: (row) => (
        <span
          style={{ cursor: "pointer", textDecoration: "underline" }}
          onClick={() => handleEditWorkflow(row)}
        >
          {row.name}
        </span>
      ),
    },
    {
      key: "trigger_type",
      header: "Trigger",
      sortable: true,
      defaultShowColumn: true,
      formatter: (row) => {
        const trigger = triggers.find((t) => t.value === row.trigger_type);
        return trigger ? trigger.label : row.trigger_type;
      },
    },
    {
      key: "scope_type",
      header: "Scope",
      sortable: true,
      defaultShowColumn: true,
      formatter: (row) => {
        if (row.scope_type === "organization") {
          return "Organization-wide";
        } else if (row.scope_type === "project") {
          return row.project_title ? `Project: ${row.project_title}` : "Project-specific";
        }
        return row.scope_type;
      },
    },
    {
      key: "is_enabled",
      header: "Enabled",
      sortable: true,
      defaultShowColumn: true,
      formatter: (row) => (row.is_enabled ? "Yes" : "No"),
    },
    {
      key: "actions_count",
      header: "Actions",
      sortable: false,
      defaultShowColumn: true,
      formatter: (row) => row.actions?.length || 0,
    },
    {
      key: "actions",
      header: "",
      sortable: false,
      defaultShowColumn: true,
      maxWidth: "150px",
      formatter: (row) => (
        <div style={{ display: "flex", gap: "5px" }}>
          <button
            className="btn btn-sm btn-bg-transparent"
            onClick={() => handleEditWorkflow(row)}
            title="Edit"
          >
            <img
              className="icon-dark"
              src="../../static/icons/edit.svg"
              alt="Edit"
              width="16"
            />
          </button>
          <button
            className="btn btn-sm btn-bg-transparent"
            onClick={() => handleDeleteWorkflow(row.id)}
            title="Delete"
          >
            <img
              className="icon-dark"
              src="../../static/icons/trash.svg"
              alt="Delete"
              width="16"
            />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="container-fluid">
      <Row className="mb-3">
        <Col>
          <h2>Workflows</h2>
          <p className="text-muted">
            Create automated workflows that trigger actions when specific events occur.
          </p>
        </Col>
        <Col className="text-right">
          <AddButton
            buttonText="New Workflow"
            onClick={handleAddWorkflow}
          />
        </Col>
      </Row>

      <Tab.Container defaultActiveKey="workflows">
        <Row>
          <Col>
            <Nav variant="tabs">
              <Nav.Item>
                <Nav.Link eventKey="workflows">Workflows</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="executions">Execution Logs</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="audit">Audit Logs</Nav.Link>
              </Nav.Item>
            </Nav>
          </Col>
        </Row>
        <Row className="mt-3">
          <Col>
            <Tab.Content>
              <Tab.Pane eventKey="workflows">
                <DokulyCard>
                  <DokulyTable
                    data={workflows}
                    columns={columns}
                    loading={loading}
                    tableName="workflows"
                  />
                </DokulyCard>
              </Tab.Pane>
              <Tab.Pane eventKey="executions">
                <WorkflowExecutionLogs />
              </Tab.Pane>
              <Tab.Pane eventKey="audit">
                <WorkflowAuditLogs />
              </Tab.Pane>
            </Tab.Content>
          </Col>
        </Row>
      </Tab.Container>

      <DokulyModal
        show={showModal}
        onHide={() => {
          setShowModal(false);
          setEditingWorkflow(null);
        }}
        title={editingWorkflow ? "Edit Workflow" : "Create Workflow"}
        size="full-screen"
      >
        <WorkflowBuilder
          workflow={editingWorkflow}
          projects={projects}
          triggers={triggers}
          actions={actions}
          onSave={handleSaveWorkflow}
          onCancel={() => {
            setShowModal(false);
            setEditingWorkflow(null);
          }}
        />
      </DokulyModal>
    </div>
  );
};

export default AdminWorkflows;

