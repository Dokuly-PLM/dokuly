import React from "react";
import DokulyCard from "../../dokulyCard";
import { Col, Container, Row } from "react-bootstrap";
import CardTitle from "../../cardTitle";
import { useNavigate } from "react-router";
import { appToModelName } from "../issuesTable";
import DokulyTags from "../../dokulyTags/dokulyTags";
import DokulyImage from "../../dokulyImage";
import { formatCloudImageUri } from "../../../pcbas/functions/productionHelpers";
import DokulyDateFormat from "../../formatters/dateFormatter";

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

  // Get the first linked item's thumbnail and display name
  const getAffectedItemInfo = (issue) => {
    if (!issue || !issue[app] || issue[app].length === 0) {
      return null;
    }
    const firstItem = issue[app][0];
    return {
      thumbnail: firstItem.thumbnail,
      display_name: firstItem.display_name,
      full_part_number:
        app === "documents"
          ? firstItem.full_doc_number
          : firstItem.full_part_number,
      revision: app !== "documents" ? firstItem.revision : null,
    };
  };

  const affectedItem = getAffectedItemInfo(issue);

  const formatCreatorName = (createdBy) => {
    if (!createdBy) return "Unknown";
    if (createdBy.first_name || createdBy.last_name) {
      return `${createdBy.first_name || ""} ${createdBy.last_name || ""}`.trim();
    }
    return createdBy.username || "Unknown";
  };

  return (
    <DokulyCard>
      <CardTitle titleText={"Information"} />
      <hr />

      <Container fluid style={{ marginTop: "-0.5rem" }}>
        {affectedItem && (
          
            <Row 
              className="mb-3 align-items-center"
              onClick={() => navigateToRelatedPart(issue[app][0].id)}
              style={{ cursor: "pointer" }}
            >
              <Col xs="auto">
              {affectedItem.thumbnail && (
                <DokulyImage
                  src={formatCloudImageUri(affectedItem.thumbnail)}
                  alt="Thumbnail"
                  style={{
                    maxWidth: "60px",
                    maxHeight: "60px",
                    objectFit: "contain",
                    display: "block",
                  }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "";
                  }}
                />
              )}
            </Col>
            <Col>
              <div style={{ fontSize: "14px" }}>
                <div style={{ fontWeight: "600" }}>
                  {affectedItem.full_part_number}
                </div>
                <div style={{ fontSize: "13px", color: "#666" }}>
                  {affectedItem.display_name}
                </div>
              </div>
            </Col>
          </Row>
        )}
        

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

        <hr />

        <Row className="mt-2">
          <Col xs="6" sm="6" md="6" lg="4" xl="6">
            <b>Created by:</b>
          </Col>
          <Col>{formatCreatorName(issue?.created_by)}</Col>
        </Row>

        <Row className="mt-2">
          <Col xs="6" sm="6" md="6" lg="4" xl="6">
            <b>Created at:</b>
          </Col>
          <Col>
            {issue?.created_at ? (
              <DokulyDateFormat date={issue.created_at} showTime={true} />
            ) : (
              "N/A"
            )}
          </Col>
        </Row>

        <hr />

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
