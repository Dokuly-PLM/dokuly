import React, { useState, useEffect } from "react";
import { Form, Row, Col } from "react-bootstrap";
import DokulySelect from "../../../dokuly_components/dokulySelect";
import EditableMarkdown from "../../../dokuly_components/dokulyMarkdown/editableMarkdown";
import DokulyCard from "../../../dokuly_components/dokulyCard";
import CardTitle from "../../../dokuly_components/cardTitle";

const ActionConfigurator = ({ action, actions, onUpdate }) => {
  const [actionType, setActionType] = useState(action.action_type || "create_issue");
  const [actionConfig, setActionConfig] = useState(
    action.action_config || {
      title: "",
      template_text: "",
      criticality: "Low",
    }
  );

  useEffect(() => {
    if (action.action_type) {
      setActionType(action.action_type);
    }
    if (action.action_config) {
      setActionConfig(action.action_config);
    }
  }, [action]);

  useEffect(() => {
    // Notify parent of changes
    onUpdate({
      ...action,
      action_type: actionType,
      action_config: actionConfig,
    });
  }, [actionType, actionConfig]);

  const handleConfigChange = (key, value) => {
    setActionConfig({
      ...actionConfig,
      [key]: value,
    });
  };

  const handleActionTypeChange = (newActionType) => {
    setActionType(newActionType);
    // Reset config when action type changes
    if (newActionType === "create_issue") {
      setActionConfig({
        title: "",
        template_text: "",
        criticality: "Low",
      });
    }
  };

  const actionOptions = (actions || []).map((a) => ({
    value: a.value,
    label: a.label,
  }));

  const criticalityOptions = [
    { value: "Low", label: "Low" },
    { value: "Medium", label: "Medium" },
    { value: "High", label: "High" },
    { value: "Critical", label: "Critical" },
  ];

  const renderActionConfig = () => {
    if (actionType === "create_issue") {
      return (
        <div>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Issue Title</Form.Label>
                <Form.Control
                  type="text"
                  value={actionConfig.title || ""}
                  onChange={(e) => handleConfigChange("title", e.target.value)}
                  placeholder="Enter issue title (supports template variables)"
                />
                <Form.Text className="text-muted">
                  Use variables like {"{{entity.display_name}}"}, {"{{entity.full_part_number}}"}
                </Form.Text>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Criticality</Form.Label>
                <DokulySelect
                  value={criticalityOptions.find(opt => opt.value === actionConfig.criticality) || criticalityOptions[0]}
                  onChange={(option) => {
                    const value = option?.value || "Low";
                    handleConfigChange("criticality", value);
                  }}
                  options={criticalityOptions}
                />
              </Form.Group>
            </Col>
          </Row>
          <Row className="mt-3">
            <Col>
              <Form.Group className="mb-3">
                <Form.Label>Issue Template Text (Markdown)</Form.Label>
                <DokulyCard style={{ marginTop: "10px" }}>
                  <EditableMarkdown
                    initialMarkdown={actionConfig.template_text || ""}
                    onSubmit={(markdownText) => {
                      handleConfigChange("template_text", markdownText);
                    }}
                    showEmptyBorder={true}
                    readOnly={false}
                    wrapperStyle={{ marginTop: "-0.5rem" }}
                    projectId={-1}
                  />
                </DokulyCard>
                <Form.Text className="text-muted">
                  <strong>Available template variables:</strong>
                  <br />
                  {"{{entity.display_name}}"} - Entity display name
                  <br />
                  {"{{entity.full_part_number}}"} - Full part number
                  <br />
                  {"{{entity.description}}"} - Entity description
                  <br />
                  {"{{entity.revision}}"} - Entity revision
                  <br />
                  {"{{entity.project.title}}"} - Project title
                  <br />
                  {"{{user.first_name}}"} - User first name
                  <br />
                  {"{{user.last_name}}"} - User last name
                  <br />
                  {"{{user.username}}"} - Username
                </Form.Text>
              </Form.Group>
            </Col>
          </Row>
        </div>
      );
    }
    return <div>Action type configuration coming soon</div>;
  };

  return (
    <div>
      <Form.Group className="mb-3">
        <Form.Label>Action Type</Form.Label>
        <DokulySelect
          value={actionOptions.length > 0 ? (actionOptions.find(opt => opt.value === actionType) || actionOptions[0]) : null}
          onChange={(option) => {
            const value = option?.value || "create_issue";
            handleActionTypeChange(value);
          }}
          options={actionOptions}
        />
      </Form.Group>
      <div style={{ marginTop: "15px" }}>{renderActionConfig()}</div>
    </div>
  );
};

export default ActionConfigurator;

