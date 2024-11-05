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
import { editIssue } from "./functions/queries";

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
    if (issue?.title?.length < 50) {
      return issue.title;
    }
    return `${issue.title.substring(0, 50)}...`;
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
      <Heading
        item_number={`Issue #${issue?.id || ""}`}
        display_name={formatTitle(issue) ?? ""}
      />
      <Row>
        <Col md={4}>
          {app && (
            <IssueInfoCard
              issue={issue}
              openModal={setOpenModal}
              app={app}
              setRefresh={refreshIssue}
              updateItemField={updateIssueField}
            />
          )}
        </Col>
        <Col md={8}>
          {app && (
            <IssueDescriptionCard
              markdown={description}
              handleMarkdownSubmit={onEditIssue}
              app={app}
              project={getIssueProject(issue, true)}
            />
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
      />
    </div>
  );
};

export default DisplayIssue;
