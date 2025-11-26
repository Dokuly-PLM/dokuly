import React, { useState, useEffect } from "react";
import { Row, Col, Form } from "react-bootstrap";
import DokulyCard from "../../../dokuly_components/dokulyCard";
import CardTitle from "../../../dokuly_components/cardTitle";
import SubmitButton from "../../../dokuly_components/submitButton";
import CancelButton from "../../../dokuly_components/cancelButton";
import DokulySelect from "../../../dokuly_components/dokulySelect";
import ActionConfigurator from "./actionConfigurator";

const WorkflowBuilder = ({
  workflow,
  projects,
  triggers,
  actions,
  onSave,
  onCancel,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [entityType, setEntityType] = useState("");
  const [eventType, setEventType] = useState("");
  const [scopeType, setScopeType] = useState("organization");
  const [selectedProject, setSelectedProject] = useState(null);
  const [isEnabled, setIsEnabled] = useState(true);
  const [workflowActions, setWorkflowActions] = useState([]);

  useEffect(() => {
    if (workflow) {
      setName(workflow.name || "");
      setDescription(workflow.description || "");
      
      // Parse trigger_type to extract entity type and event
      const triggerType = workflow.trigger_type || "";
      if (triggerType === "revision_created") {
        setEntityType(workflow.trigger_entity_type || "");
        setEventType("revision_created");
      } else if (triggerType) {
        // Extract entity type from trigger_type (e.g., "pcba_created" -> "pcbas")
        const entityMap = {
          "pcba_created": "pcbas",
          "part_created": "parts",
          "assembly_created": "assemblies",
          "document_created": "documents",
        };
        setEntityType(entityMap[triggerType] || "");
        setEventType("created");
      } else {
        setEntityType("");
        setEventType("");
      }
      
      setScopeType(workflow.scope_type || "organization");
      setSelectedProject(workflow.project || null);
      setIsEnabled(workflow.is_enabled !== false);
      setWorkflowActions(workflow.actions || []);
    } else {
      // Reset to defaults for new workflow
      setName("");
      setDescription("");
      setEntityType("");
      setEventType("");
      setScopeType("organization");
      setSelectedProject(null);
      setIsEnabled(true);
      setWorkflowActions([]);
    }
  }, [workflow]);

  const handleAddAction = () => {
    const newAction = {
      action_type: "create_issue",
      action_config: {
        title: "",
        template_text: "",
        criticality: "Low",
      },
      order: workflowActions.length,
      is_enabled: true,
    };
    setWorkflowActions([...workflowActions, newAction]);
  };

  const handleUpdateAction = (index, updatedAction) => {
    const newActions = [...workflowActions];
    newActions[index] = updatedAction;
    setWorkflowActions(newActions);
  };

  const handleRemoveAction = (index) => {
    const newActions = workflowActions.filter((_, i) => i !== index);
    // Reorder actions
    newActions.forEach((action, i) => {
      action.order = i;
    });
    setWorkflowActions(newActions);
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      alert("Please enter a workflow name");
      return;
    }
    if (!entityType) {
      alert("Please select an entity type");
      return;
    }
    if (!eventType) {
      alert("Please select an event type");
      return;
    }
    if (scopeType === "project" && !selectedProject) {
      alert("Please select a project for project-specific workflow");
      return;
    }
    if (workflowActions.length === 0) {
      alert("Please add at least one action");
      return;
    }

    // Build trigger_type from entity type and event type
    let trigger_type = "";
    let trigger_entity_type = entityType;
    
    if (eventType === "created") {
      // Map entity type to trigger type
      const triggerMap = {
        "pcbas": "pcba_created",
        "parts": "part_created",
        "assemblies": "assembly_created",
        "documents": "document_created",
      };
      trigger_type = triggerMap[entityType] || "";
    } else if (eventType === "revision_created") {
      trigger_type = "revision_created";
      // trigger_entity_type is already set to entityType
    }

    // Prepare actions data - remove any undefined fields and ensure proper structure
    const actionsData = workflowActions.map((action, index) => ({
      action_type: action.action_type || "create_issue",
      action_config: action.action_config || {},
      order: action.order !== undefined ? action.order : index,
      is_enabled: action.is_enabled !== undefined ? action.is_enabled : true,
    }));

    const workflowData = {
      name: name.trim(),
      description: description.trim(),
      trigger_type: trigger_type,
      trigger_entity_type: trigger_entity_type,
      scope_type: scopeType,
      project: scopeType === "project" ? selectedProject : null,
      is_enabled: isEnabled,
      actions: actionsData,
    };

    console.log("Sending workflow data:", workflowData);
    onSave(workflowData);
  };

  const entityTypeOptions = [
    { value: "pcbas", label: "PCBAs" },
    { value: "parts", label: "Parts" },
    { value: "assemblies", label: "Assemblies" },
    { value: "documents", label: "Documents" },
  ];

  const eventTypeOptions = [
    { value: "created", label: "Created" },
    { value: "revision_created", label: "New Revision Created" },
  ];

  const scopeTypeOptions = [
    { value: "organization", label: "Organization-wide" },
    { value: "project", label: "Project-specific" },
  ];

  const projectOptions = (projects || []).map((p) => ({
    value: p.id,
    label: `${p.title} (${p.full_project_number || p.id})`,
  }));

  return (
    <div>
      <DokulyCard>
        <CardTitle titleText="Workflow Details" />
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Name</Form.Label>
            <Form.Control
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter workflow name"
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter workflow description (optional)"
            />
          </Form.Group>
        </Form>
      </DokulyCard>

      <DokulyCard>
        <CardTitle titleText="When (Trigger)" />
        <Form>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Entity Type</Form.Label>
                <DokulySelect
                  value={entityTypeOptions.find(opt => opt.value === entityType) || null}
                  onChange={(option) => {
                    const newEntityType = option?.value || "";
                    setEntityType(newEntityType);
                    // Reset event type when entity type changes
                    if (newEntityType !== entityType) {
                      setEventType("");
                    }
                  }}
                  options={entityTypeOptions}
                  placeholder="Select entity type"
                />
                <Form.Text className="text-muted">
                  Choose which type of entity this workflow applies to
                </Form.Text>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Event</Form.Label>
                <DokulySelect
                  value={eventTypeOptions.find(opt => opt.value === eventType) || null}
                  onChange={(option) => setEventType(option?.value || "")}
                  options={eventTypeOptions}
                  placeholder={entityType ? "Select event" : "Select entity type first"}
                  isDisabled={!entityType}
                />
                <Form.Text className="text-muted">
                  Choose when the workflow should trigger
                </Form.Text>
              </Form.Group>
            </Col>
          </Row>
        </Form>
      </DokulyCard>

      <DokulyCard>
        <CardTitle titleText="Scope" />
        <Form>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Scope Type</Form.Label>
                <DokulySelect
                  value={scopeTypeOptions.find(opt => opt.value === scopeType) || scopeTypeOptions[0]}
                  onChange={(option) => {
                    const newValue = option?.value || "organization";
                    setScopeType(newValue);
                    if (newValue === "organization") {
                      setSelectedProject(null);
                    }
                  }}
                  options={scopeTypeOptions}
                />
              </Form.Group>
            </Col>
            {scopeType === "project" && (
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Project</Form.Label>
                  <DokulySelect
                    value={projectOptions.find(opt => opt.value === selectedProject) || null}
                    onChange={(option) => {
                      setSelectedProject(option?.value || null);
                    }}
                    options={projectOptions}
                    placeholder="Select project"
                  />
                </Form.Group>
              </Col>
            )}
          </Row>
        </Form>
      </DokulyCard>

      <DokulyCard>
        <CardTitle titleText="Then (Actions)" />
        <div style={{ marginBottom: "15px" }}>
          {workflowActions.map((action, index) => (
            <div
              key={index}
              style={{
                border: "1px solid #ddd",
                borderRadius: "8px",
                padding: "15px",
                marginBottom: "10px",
                backgroundColor: "#f9f9f9",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "10px",
                }}
              >
                <strong>Action {index + 1}</strong>
                <button
                  className="btn btn-sm btn-bg-transparent"
                  onClick={() => handleRemoveAction(index)}
                  title="Remove action"
                >
                  <img
                    className="icon-dark"
                    src="../../static/icons/trash.svg"
                    alt="Remove"
                    width="16"
                  />
                </button>
              </div>
              <ActionConfigurator
                action={action}
                actions={actions}
                onUpdate={(updatedAction) => handleUpdateAction(index, updatedAction)}
              />
            </div>
          ))}
          <button
            className="btn btn-bg-transparent"
            onClick={handleAddAction}
            style={{ width: "100%" }}
          >
            <img
              className="icon-dark"
              src="../../static/icons/circle-plus.svg"
              alt="Add"
              style={{ marginRight: "5px" }}
            />
            Add Action
          </button>
        </div>
      </DokulyCard>

      <DokulyCard>
        <Form.Check
          type="checkbox"
          label="Enable this workflow"
          checked={isEnabled}
          onChange={(e) => setIsEnabled(e.target.checked)}
        />
      </DokulyCard>

      <Row className="mt-3">
        <Col>
          <SubmitButton onClick={handleSubmit}>
            {workflow ? "Update Workflow" : "Create Workflow"}
          </SubmitButton>
          <CancelButton onClick={onCancel}>Cancel</CancelButton>
        </Col>
      </Row>
    </div>
  );
};

export default WorkflowBuilder;

