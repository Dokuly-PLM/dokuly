import React from "react";
import DokulyModal from "../dokuly_components/dokulyModal";
import DokulyCard from "../dokuly_components/dokulyCard";
import CardTitle from "../dokuly_components/cardTitle";
import SubmitButton from "../dokuly_components/submitButton";
import CancelButton from "../dokuly_components/cancelButton";
import { Row, Col } from "react-bootstrap";

/**
 * Workflow execution modal component.
 * Shows when workflows are triggered and allows user to preview and confirm execution.
 * 
 * Note: Currently workflows execute automatically in the backend.
 * This component is available for future enhancements where user confirmation is required.
 */
const WorkflowExecutionModal = ({
  show,
  onHide,
  workflows = [],
  entityData = {},
  onExecute,
  onSkip,
}) => {
  if (!show || workflows.length === 0) {
    return null;
  }

  return (
    <DokulyModal
      show={show}
      onHide={onHide}
      title="Workflows Triggered"
      size="lg"
    >
      <div>
        <p>
          The following workflow{workflows.length > 1 ? "s" : ""} will be executed:
        </p>
        
        {workflows.map((workflow, index) => (
          <DokulyCard key={workflow.id || index} style={{ marginBottom: "15px" }}>
            <CardTitle titleText={workflow.name || `Workflow ${index + 1}`} />
            <Row>
              <Col md={6}>
                <strong>Trigger:</strong> {workflow.trigger_type}
              </Col>
              <Col md={6}>
                <strong>Actions:</strong> {workflow.actions?.length || 0}
              </Col>
            </Row>
            {workflow.description && (
              <Row className="mt-2">
                <Col>
                  <strong>Description:</strong> {workflow.description}
                </Col>
              </Row>
            )}
            {workflow.actions && workflow.actions.length > 0 && (
              <div className="mt-3">
                <strong>Actions to execute:</strong>
                <ul>
                  {workflow.actions.map((action, actionIndex) => (
                    <li key={actionIndex}>
                      {action.action_type === "create_issue" && (
                        <div>
                          <strong>Create Issue</strong>
                          {action.action_config?.title && (
                            <div>Title: {action.action_config.title}</div>
                          )}
                          {action.action_config?.criticality && (
                            <div>Criticality: {action.action_config.criticality}</div>
                          )}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </DokulyCard>
        ))}

        <Row className="mt-3">
          <Col>
            <SubmitButton onClick={onExecute || onHide}>
              Execute Workflows
            </SubmitButton>
            <CancelButton onClick={onSkip || onHide}>
              Skip
            </CancelButton>
          </Col>
        </Row>
      </div>
    </DokulyModal>
  );
};

export default WorkflowExecutionModal;

