import React from "react";
import DokulyCard from "../../dokulyCard";
import { Col, Container, Row } from "react-bootstrap";
import CardTitle from "../../cardTitle";
import EditButton from "../../editButton";
import { useNavigate } from "react-router";
import AddButton from "../../AddButton";
import { appToModelName } from "../issuesTable";
import { toast } from "react-toastify";
import { closeIssue, reopenIssue } from "../functions/queries";
import DokulyTags from "../../dokulyTags/dokulyTags";

export const getIssueProject = (issue, returnObject = false) => {
  if (issue?.parts && issue.parts.length > 0) {
    return returnObject
      ? issue?.parts[0].project
      : issue?.parts[0].project?.title ?? "";
  }
  if (issue?.documents && issue.documents.length > 0) {
    return returnObject
      ? issue?.documents[0].project
      : issue?.documents[0].project?.title ?? "";
  }
  if (issue?.pcbas && issue.pcbas.length > 0) {
    return returnObject
      ? issue?.pcbas[0].project
      : issue?.pcbas[0].project?.title ?? "";
  }
  if (issue?.assemblies && issue.assemblies.length > 0) {
    return returnObject
      ? issue?.assemblies[0].project
      : issue?.assemblies[0].project?.title ?? "";
  }
  return "";
};

const IssueInfoCard = ({
  issue,
  openModal,
  app,
  setRefresh,
  updateItemField = () => {},
}) => {
  const backgroundColor =
    issue?.criticality === "Critical"
      ? "red"
      : issue?.criticality === "High"
      ? "#f6c208ff"
      : "#54a4daff";

  const navigate = useNavigate();

  const navigateToRelatedPart = (id) => {
    navigate(`/${app}/${id}/issues`);
  };

  const formatLinks = (issue) => {
    const items = issue[app];
    if (!items || items.length === 0) return "Not linked";

    return (
      <>
        {items.map((item, index) => (
          // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
          <span
            key={
              app === "documents"
                ? item["full_doc_number"]
                : item["full_part_number"]
            }
            onClick={() => navigateToRelatedPart(item.id)}
            style={{ cursor: "pointer" }}
          >
            <b>
              {app === "documents"
                ? item["full_doc_number"]
                : item["full_part_number"]}
              {app !== "documents" && item["revision"]}
            </b>
            {index < items.length - 1 ? ", " : ""}
          </span>
        ))}
      </>
    );
  };

  const formatStatus = (issue, returnBool) => {
    const modelName = appToModelName[app];
    const statusKey = `closed_in_${modelName}`;

    if (issue[app]) {
      if (returnBool) {
        return issue[statusKey] !== null; // True if closed, false if open
      }
      return issue[statusKey] ? "Closed" : "Open";
    }
    return "Not linked";
  };

  const handleCloseIssue = (issue) => {
    if (!confirm("Are you sure you want to close this issue?")) {
      return;
    }
    // Find max revision in the issue
    const maxRevisionObject = issue[app].reduce((maxObj, item) => {
      return item.revision > maxObj.revision ? item : maxObj;
    }, issue[app][0]);

    if (!maxRevisionObject) {
      toast.error("No revision found for this issue.");
      return;
    }
    const data = {
      object_id: maxRevisionObject?.id, // This is the "closed_in" id field.
      app: app,
    };
    closeIssue(issue?.id, data).then((res) => {
      if (res.status === 200) {
        toast.success("Issue closed successfully.");
        setRefresh(true);
      } else {
        toast.error("Failed to close issue.");
      }
    });
  };

  const handleReopenIssue = (issue) => {
    // Find max revision in the issue
    const maxRevisionObject = issue[app].reduce((maxObj, item) => {
      return item.revision > maxObj.revision ? item : maxObj;
    }, issue[app][0]);

    if (!maxRevisionObject) {
      toast.error("No revision found for this issue.");
      return;
    }
    const data = { object_id: maxRevisionObject?.id, app: app };
    reopenIssue(issue?.id, data)
      .then((res) => {
        if (res.status === 200) {
          toast.success("Issue re-opened successfully.");
          setRefresh(true);
        } else {
          toast.error("Failed to re-open issue.");
        }
      })
      .catch((error) => {
        toast.error("Failed to re-open issue.");
      });
  };

  const changeField = (key, value) => {
    if (issue?.id == null) {
      return;
    }
    if (key == null) {
      return;
    }

    updateItemField(issue.id, key, value, setRefresh);
  };

  const handleTagsChange = (newTags) => {
    // New array with tag ids
    changeField("tags", newTags);
  };

  return (
    <DokulyCard>
      <CardTitle titleText={"Information"} />
      <hr />
      <Container fluid style={{ marginTop: "-0.5rem" }}>
        <Row>
          <Col>
            <EditButton buttonText="Edit" onClick={() => openModal(true)} />
          </Col>
        </Row>
        <Row className="mt-3">
          <Col xs="6" sm="6" md="6" lg="4" xl="6">
            <b>Title:</b>
          </Col>
          <Col>{issue?.title ?? ""}</Col>
        </Row>
        <Row
          style={{
            border: `2px solid ${backgroundColor}`,
            borderRadius: "15px",
            paddingBottom: "2.5px",
            marginTop: "0.25rem",
          }}
        >
          <Col xs="6" sm="6" md="6" lg="4" xl="6">
            <b>Criticality:</b>
          </Col>
          <Col>{issue?.criticality ?? ""}</Col>
        </Row>
        <Row>
          <Col xs="6" sm="6" md="6" lg="4" xl="6">
            <b>Project:</b>
          </Col>
          <Col>{getIssueProject(issue)}</Col>
        </Row>
        <Row>
          <Col xs="6" sm="6" md="6" lg="4" xl="6">
            <b>Linked to:</b>
          </Col>
          <Col>{formatLinks(issue)}</Col>
        </Row>
        <Row>
          <Col xs="6" sm="6" md="6" lg="4" xl="6">
            <b>Status:</b>
          </Col>
          <Col>{formatStatus(issue)}</Col>
        </Row>
        <Row>
          <Col xs="6" sm="6" md="6" lg="4" xl="6">
            {formatStatus(issue, true) ? (
              <AddButton
                onClick={() => handleReopenIssue(issue)}
                buttonText={"Re-open Issue"}
                imgSrc={"../../../static/icons/refresh.svg"}
              />
            ) : (
              <AddButton
                onClick={() => handleCloseIssue(issue)}
                buttonText={"Close Issue"}
                imgSrc={"../../../static/icons/circle-check.svg"}
              />
            )}
          </Col>
        </Row>
        <Row className="mt-2 align-items-top">
          <Col className="col-lg-6 col-xl-6">
            <b>Tags</b>
          </Col>
        </Row>
        <Row className="mt-2 align-items-top">
          <Col className="col-auto">
            <DokulyTags
              tags={issue?.tags ?? []}
              onChange={handleTagsChange}
              readOnly={false}
              project={getIssueProject(issue, true) ?? { id: 0 }}
              setRefresh={setRefresh}
            />
          </Col>
        </Row>
      </Container>
    </DokulyCard>
  );
};

export default IssueInfoCard;
