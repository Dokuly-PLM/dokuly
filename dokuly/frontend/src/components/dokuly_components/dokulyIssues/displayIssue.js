import React, { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { AuthContext } from "../../App";
import Heading from "../Heading";
import useIssue from "../../common/hooks/useIssue";
import IssueInfoCard, { getIssueProject } from "./cards/issueInfoCard";
import IssueDescriptionCard from "./cards/issueDescriptionCard";
import { toast } from "react-toastify";
import { Col, Row } from "react-bootstrap";
import EditIssueForm from "./forms/editIssueForm";
import { editIssue, closeIssue, reopenIssue } from "./functions/queries";
import { appToModelName } from "./issuesTable";
import AddButton from "../AddButton";
import EditButton from "../editButton";

const DisplayIssue = () => {
  const { isAuthenticated, setIsAuthenticated } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [dbObjectId, setDbObjectId] = useState(null);
  const [dbObjectApp, setDbObjectApp] = useState(null);
  const [issueId, setIssueId] = useState(null);
  const [description, setDescription] = useState(null);
  const [title, setTitle] = useState(null);
  const [criticality, setCriticality] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [app, setApp] = useState(null);
  const [issue, refreshIssue, loadingIssue] = useIssue({
    id: issueId,
    setIsAuthenticated: setIsAuthenticated,
  });

  // Closing an issue in the detailed page will close on last revision

  const onEditIssue = (newDescription) => {
    const data = {
      title: title,
      criticality: criticality,
    };
    if (newDescription !== null) {
      data.description = newDescription;
    }
    editIssue(issueId, data).then(
      (result) => {
        if (result.status === 200) {
          toast.success("Issue updated successfully.");
          setOpenModal(false);
          refreshIssue();
        }
      },
      (error) => {
        toast.error(error);
      }
    );
  };

  const updateIssueField = (id, field, value, setRefresh = () => {}) => {
    const data = {
      [field]: value,
    };
    editIssue(id, data).then(
      (result) => {
        if (result.status === 200) {
          toast.success("Issue updated successfully.");
          refreshIssue();
        }
      },
      (error) => {
        toast.error(error);
      }
    );
  };

  const formatTitle = (issue) => {
    if (!issue) {
      return "";
    }
    if (!issue.title) {
      return "";
    }
    return issue.title;
  };

  const formatStatus = (issue, returnBool) => {
    if (!app || !issue[app]) {
      return returnBool ? false : "Not linked";
    }
    const modelName = appToModelName[app];
    const statusKey = `closed_in_${modelName}`;

    if (returnBool) {
      return issue[statusKey] !== null;
    }
    return issue[statusKey] ? "Closed" : "Open";
  };

  const handleCloseIssue = () => {
    if (!confirm("Are you sure you want to close this issue?")) {
      return;
    }
    const maxRevisionObject = issue[app].reduce((maxObj, item) => {
      return item.revision > maxObj.revision ? item : maxObj;
    }, issue[app][0]);

    if (!maxRevisionObject) {
      toast.error("No revision found for this issue.");
      return;
    }
    const data = {
      object_id: maxRevisionObject?.id,
      app: app,
    };
    closeIssue(issue?.id, data).then((res) => {
      if (res.status === 200) {
        toast.success("Issue closed successfully.");
        refreshIssue();
      } else {
        toast.error("Failed to close issue.");
      }
    });
  };

  const handleReopenIssue = () => {
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
          refreshIssue();
        } else {
          toast.error("Failed to re-open issue.");
        }
      })
      .catch((error) => {
        toast.error("Failed to re-open issue.");
      });
  };

  const getStatusPillStyle = () => {
    const isClosed = formatStatus(issue, true);
    return {
      display: "inline-block",
      padding: "4px 12px",
      borderRadius: "12px",
      fontSize: "14px",
      fontWeight: "600",
      marginRight: "1rem",
      backgroundColor: isClosed ? "#6c757d" : "#28a745",
      color: "white",
    };
  };

  useEffect(() => {
    const url = window.location.href.toString();
    const split = url.split("/");
    setIssueId(Number.parseInt(split[5]));
  }, [location]);

  useEffect(() => {
    if (issue) {
      setDescription(issue?.description?.text ?? "");
      setTitle(issue?.title ?? "");
      setCriticality(issue?.criticality ?? "");
      if (issue?.parts && issue?.parts?.length > 0) {
        setApp("parts");
      }
      if (issue?.pcbas && issue?.pcbas?.length > 0) {
        setApp("pcbas");
      }
      if (issue?.assemblies && issue?.assemblies?.length > 0) {
        setApp("assemblies");
      }
      if (issue?.documents && issue?.documents?.length > 0) {
        setApp("documents");
      }
      document.title = `Issue #${issue?.id} | Dokuly`;
    }
  }, [issue]);

  return (
    <div
      className="container-fluid mt-2 mainContainerWidth"
      style={{ paddingBottom: "1rem" }}
    >
      <div style={{ display: "flex", alignItems: "center" }}>
        {app && issue && (
          <span style={getStatusPillStyle()}>
            {formatStatus(issue)}
          </span>
        )}
        <Heading
          item_number={`Issue #${issue?.id || ""}`}
          display_name={formatTitle(issue) ?? ""}
        />
      </div>
      <Row >
        <Col md={4}>
          <div className="mb-2">
            <EditButton buttonText="Edit" onClick={() => setOpenModal(true)} />
          </div>
        </Col>
        
      </Row>
      <Row>
        <Col md={4}>
          {app && (
            <IssueInfoCard
              issue={issue}
              app={app}
              setRefresh={refreshIssue}
              updateItemField={updateIssueField}
            />
        )}
        </Col>
        <Col md={8}>
          {app && (
            <>
              <IssueDescriptionCard
                markdown={description}
                handleMarkdownSubmit={onEditIssue}
                app={app}
                project={getIssueProject(issue, true)}
              />
              <div className="mt-3">
                {formatStatus(issue, true) ? (
                  <AddButton
                    onClick={handleReopenIssue}
                    buttonText={"Re-open Issue"}
                    imgSrc={"../../../static/icons/refresh.svg"}
                  />
                ) : (
                  <AddButton
                    onClick={handleCloseIssue}
                    buttonText={"Close Issue"}
                    imgSrc={"../../../static/icons/circle-check.svg"}
                  />
                )}
              </div>
            </>
          )}
        </Col>
      </Row>
      <EditIssueForm
        title={title}
        setTitle={setTitle}
        criticality={criticality}
        setCriticality={setCriticality}
        isOpen={openModal}
        onClose={() => setOpenModal(false)}
        onSubmit={onEditIssue}
        issueId={issueId}
        app={app}
        issue={issue}
      />
    </div>
  );
};

export default DisplayIssue;
