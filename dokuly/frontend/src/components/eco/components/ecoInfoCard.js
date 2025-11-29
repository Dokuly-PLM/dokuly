import React, { useEffect, useState } from "react";
import { Row, Col, Container } from "react-bootstrap";
import { useNavigate } from "react-router";
import { toast } from "react-toastify";

import DokulyCard from "../../dokuly_components/dokulyCard";
import CardTitle from "../../dokuly_components/cardTitle";
import GenericDropdownSelector from "../../dokuly_components/dokulyTable/components/genericDropdownSelector";
import DeleteButton from "../../dokuly_components/deleteButton";
import DokulyDateFormat from "../../dokuly_components/formatters/dateFormatter";
import { editEco, deleteEco } from "../functions/queries";

const RELEASE_STATE_OPTIONS = [
  { value: "Draft", label: "Draft" },
  { value: "Review", label: "Review" },
  { value: "Released", label: "Released" },
];

const EcoInfoCard = ({
  eco,
  setRefresh,
  readOnly = false,
  profiles = [],
}) => {
  const navigate = useNavigate();

  const getResponsibleOptions = () => {
    return profiles.map((profile) => ({
      value: profile.id,
      label: `${profile.first_name} ${profile.last_name}`,
    }));
  };

  const changeField = (key, value) => {
    if (eco?.id == null || key == null) {
      return;
    }

    const data = { [key]: value };
    editEco(eco.id, data).then(
      (result) => {
        if (result.status === 200) {
          setRefresh(true);
        }
      },
      (error) => {
        toast.error("Failed to update ECO");
      }
    );
  };

  const handleDelete = () => {
    if (!confirm("Are you sure you want to delete this ECO?")) {
      return;
    }
    deleteEco(eco.id).then((result) => {
      if (result.status === 204) {
        toast.success("ECO deleted successfully");
        navigate("/eco");
      }
    }).catch((err) => {
      if (err?.response?.status === 400) {
        toast.error(err.response.data);
      } else {
        toast.error("Failed to delete ECO");
      }
    });
  };

  const getReleaseStateStyle = (state) => {
    switch (state) {
      case "Released":
        return { borderColor: "#28a745" };
      case "Review":
        return { borderColor: "#f6c208ff" };
      case "Draft":
        return { borderColor: "#6c757d" };
      default:
        return {};
    }
  };

  const isReleased = eco?.release_state === "Released";

  return (
    <DokulyCard>
      <CardTitle titleText={"Information"} />
      <hr />

      <Container fluid style={{ marginTop: "-0.5rem" }}>
        <Row
          style={{
            border: `2px solid ${getReleaseStateStyle(eco?.release_state).borderColor || "#6c757d"}`,
            borderRadius: "15px",
            paddingBottom: "2.5px",
            marginTop: "0.25rem",
            marginBottom: "1rem",
          }}
        >
          <Col xs="6" sm="6" md="6" lg="4" xl="6">
            <b>State:</b>
          </Col>
          <Col>
            <GenericDropdownSelector
              state={eco?.release_state || "Draft"}
              setState={(value) => changeField("release_state", value)}
              dropdownValues={RELEASE_STATE_OPTIONS}
              placeholder="Select State"
              readOnly={readOnly || isReleased}
              textSize="14px"
            />
          </Col>
        </Row>

        <Row className="align-items-center mb-2">
          <Col className="col-lg-6 col-xl-6" style={{ maxWidth: "140px" }}>
            <b>Responsible:</b>
          </Col>
          <Col>
            <GenericDropdownSelector
              state={eco?.responsible?.id || ""}
              setState={(value) => changeField("responsible", value)}
              dropdownValues={getResponsibleOptions()}
              placeholder="Select responsible"
              borderIfPlaceholder={true}
              readOnly={readOnly || isReleased}
              textSize="14px"
            />
          </Col>
        </Row>

        <hr />

        <Row className="align-items-center mb-2">
          <Col className="col-lg-6 col-xl-6" style={{ maxWidth: "140px" }}>
            <b>Created:</b>
          </Col>
          <Col>
            <DokulyDateFormat date={eco?.created_at} />
          </Col>
        </Row>

        {eco?.released_date && (
          <Row className="align-items-center mb-2">
            <Col className="col-lg-6 col-xl-6" style={{ maxWidth: "140px" }}>
              <b>Released:</b>
            </Col>
            <Col>
              <DokulyDateFormat date={eco?.released_date} />
            </Col>
          </Row>
        )}

        {!readOnly && !isReleased && (
          <Row className="align-items-center mt-3">
            <DeleteButton
              onDelete={handleDelete}
              textSize={"10px"}
              iconWidth={"20px"}
            />
          </Row>
        )}
      </Container>
    </DokulyCard>
  );
};

export default EcoInfoCard;
