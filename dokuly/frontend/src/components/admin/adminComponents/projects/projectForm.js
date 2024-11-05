import React, { useState, useEffect } from "react";
import { Modal, Form, Button, ListGroup, Row, Col } from "react-bootstrap";
import SubmitButton from "../../../dokuly_components/submitButton";
import {
  addUserToProject,
  removeUserFromProject,
} from "../../../projects/functions/queries";
import { editProject } from "../../functions/queries";
import GenericDropdownSelector from "../../../dokuly_components/dokulyTable/components/genericDropdownSelector";
import { toast } from "react-toastify";
import DokulyCheckFormGroup from "../../../dokuly_components/dokulyCheckFormGroup";

const ProjectForm = ({ show, handleClose, project, users, setRefresh }) => {
  const [projectUsers, setProjectUsers] = useState([]);
  const [nonProjectUsers, setNonProjectUsers] = useState([]);
  const [is_active, setIsActive] = useState(project?.is_active);
  const [projectOwner, setProjectOwner] = useState(null);
  const [notifyOnIssueCreation, setNotifyOnIssueCreation] = useState(false);
  const [notifyOnIssueClose, setNotifyOnIssueClose] = useState(false);
  const [notifyOnItemNewRevision, setNotifyOnItemNewRevision] = useState(false);
  const [notifyOnItemPassedReview, setNotifyOnItemPassedReview] =
    useState(false);
  const [notifyOnItemReleased, setNotifyOnItemReleased] = useState(false);
  const [notifyOnItemStateChangeToReview, setNotifyOnItemStateChangeToReview] =
    useState(false);

  useEffect(() => {
    // Guard against null project
    if (project) {
      const activeUsers = users?.filter((user) => user.is_active);
      const projectUserIds = new Set(project.project_members || []);
      setProjectUsers(
        activeUsers.filter((user) => projectUserIds.has(user.id))
      );
      setNonProjectUsers(
        activeUsers.filter((user) => !projectUserIds.has(user.id))
      );
      const projectOwner = users.find(
        (user) => user.id === project.project_owner
      );
      setProjectOwner(projectOwner);
      setNotifyOnIssueClose(project.notify_project_owner_on_issue_close);
      setNotifyOnIssueCreation(project.notify_project_owner_on_issue_creation);
      setNotifyOnItemNewRevision(
        project.notify_project_owner_on_item_new_revision
      );
      setNotifyOnItemPassedReview(
        project.notify_project_owner_on_item_passed_review
      );
      setNotifyOnItemReleased(project.notify_project_owner_on_item_released);
      setNotifyOnItemStateChangeToReview(
        project.notify_project_owner_on_item_state_change_to_review
      );
    } else {
      // Reset lists if project is null
      setProjectUsers([]);
      setNonProjectUsers([]);
    }
  }, [project, users]);

  const handleSubmit = () => {
    const data = {
      is_active: is_active,
      notify_project_owner_on_issue_creation: notifyOnIssueCreation,
      notify_project_owner_on_issue_close: notifyOnIssueClose,
      notify_project_owner_on_item_new_revision: notifyOnItemNewRevision,
      notify_project_owner_on_item_passed_review: notifyOnItemPassedReview,
      notify_project_owner_on_item_released: notifyOnItemReleased,
      notify_project_owner_on_item_state_change_to_review:
        notifyOnItemStateChangeToReview,
    };

    editProject(project.id, data).then((res) => {
      if (res.status === 200) {
        setRefresh(true);
        handleClose();
      }
    });
  };

  const updateProjectOwner = (user) => {
    const data = {
      project_owner: user.id,
      updateOwner: true,
    };
    editProject(project.id, data).then((res) => {
      if (res.status === 200) {
        toast.success("Project owner updated successfully");
      }
    });
  };

  const removeFromProject = (user, project) => {
    removeUserFromProject(project.id, user.id).then((res) => {
      if (res.status === 200) {
        const activeUsers = users?.filter((user) => user.is_active);
        const projectUserIds = new Set(res.data.project_members || []);
        setProjectUsers(
          activeUsers.filter((user) => projectUserIds.has(user.id))
        );
        setNonProjectUsers(
          activeUsers.filter((user) => !projectUserIds.has(user.id))
        );
      }
    });
  };

  const assignToProject = (user, project) => {
    addUserToProject(project.id, user.id).then((res) => {
      if (res.status === 200) {
        const activeUsers = users?.filter((user) => user.is_active);
        const projectUserIds = new Set(res.data.project_members || []);
        setProjectUsers(
          activeUsers.filter((user) => projectUserIds.has(user.id))
        );
        setNonProjectUsers(
          activeUsers.filter((user) => !projectUserIds.has(user.id))
        );
      }
    });
  };

  if (!project) {
    // This was changed from return null to returning a div. Never return null from a component.
    return <div>No project...</div>;
  }

  return (
    <Modal show={show} onHide={handleClose} size="xl">
      <Modal.Header>
        <Modal.Title>Project Settings</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <h5>
          {project.full_number} - {project.title}
        </h5>
        <Row>
          <Col>
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                className="dokuly-checkbox"
                label="Is project active?"
                name="is_active"
                value={is_active}
                defaultChecked={project.is_active}
                onChange={(e) => setIsActive(e.target.checked)}
              />
            </Form.Group>
          </Col>
          <Col>
            <h5>Project owner:</h5>
            <GenericDropdownSelector
              state={projectOwner?.id}
              setState={(value) => {
                const user = users.find((user) => user.id === value);
                setProjectOwner(user);
                updateProjectOwner(user);
              }}
              dropdownValues={users
                .filter((user) => user?.is_active)
                .map((user) => ({
                  value: user.id,
                  label: `${user.first_name} ${user.last_name}`,
                }))}
              placeholder={
                projectOwner
                  ? `${projectOwner.first_name} ${projectOwner.last_name}`
                  : "Select a project owner"
              }
            />
          </Col>
        </Row>
        <h5>Notification settings:</h5>
        <Row>
          <Col>
            <DokulyCheckFormGroup
              label="Notify on issue creation"
              value={notifyOnIssueCreation}
              onChange={setNotifyOnIssueCreation}
            />
            <DokulyCheckFormGroup
              label="Notify on issue close"
              value={notifyOnIssueClose}
              onChange={setNotifyOnIssueClose}
            />
          </Col>
          <Col>
            <DokulyCheckFormGroup
              label="Notify on item new revision"
              value={notifyOnItemNewRevision}
              onChange={setNotifyOnItemNewRevision}
            />
            <DokulyCheckFormGroup
              label="Notify on item passed review"
              value={notifyOnItemPassedReview}
              onChange={setNotifyOnItemPassedReview}
            />
          </Col>
          <Col>
            <DokulyCheckFormGroup
              label="Notify on item released"
              value={notifyOnItemReleased}
              onChange={setNotifyOnItemReleased}
            />
            <DokulyCheckFormGroup
              label="Notify on item state change to review"
              value={notifyOnItemStateChangeToReview}
              onChange={setNotifyOnItemStateChangeToReview}
            />
          </Col>
        </Row>
        <h5 className="mt-5">Manage User access to this project</h5>
        <Row>
          <Col>
            <ListGroup>
              <ListGroup.Item className="text-center">
                <strong>Non-Project Users</strong>
              </ListGroup.Item>
              {nonProjectUsers.map((user) => (
                <ListGroup.Item key={user.id}>
                  <Row>
                    <Col className="col col-8">
                      {user.first_name} {user.last_name}
                    </Col>
                    <Col className="col col-4">
                      <Button
                        className="btn dokuly-btn-primary ml-2"
                        onClick={() => assignToProject(user, project)}
                      >
                        Add
                      </Button>
                    </Col>
                  </Row>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Col>
          <Col>
            <ListGroup>
              <ListGroup.Item className="text-center">
                <strong>Project Users</strong>
              </ListGroup.Item>
              {projectUsers.map((user) => (
                <ListGroup.Item key={user.id}>
                  <Row>
                    <Col>
                      <Button
                        className="btn dokuly-btn-primary ml-2"
                        onClick={() => {
                          removeFromProject(user, project);
                        }}
                      >
                        Remove
                      </Button>
                    </Col>

                    <Col className="col col-8">
                      {user.first_name} {user.last_name}
                    </Col>
                  </Row>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Col>
        </Row>

        <Row className="mt-5">
          <Col>
            <div style={{ display: "flex", alignItems: "center" }}>
              <SubmitButton
                onClick={() => {
                  handleSubmit();
                }}
              >
                Submit
              </SubmitButton>
            </div>
          </Col>
        </Row>
      </Modal.Body>
    </Modal>
  );
};

export default ProjectForm;
