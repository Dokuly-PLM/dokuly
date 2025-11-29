import React from "react";
import { Row, Col, Container } from "react-bootstrap";
import { useNavigate } from "react-router";
import { toast } from "react-toastify";

import DokulyCard from "../../dokuly_components/dokulyCard";
import CardTitle from "../../dokuly_components/cardTitle";
import GenericDropdownSelector from "../../dokuly_components/dokulyTable/components/genericDropdownSelector";
import DokulyDateFormat from "../../dokuly_components/formatters/dateFormatter";
import { editEco } from "../functions/queries";
import { releaseStateFormatter } from "../../dokuly_components/formatters/releaseStateFormatter";

const EcoInfoCard = ({
  eco,
  setRefresh,
  readOnly = false,
  profiles = [],
}) => {
  const navigate = useNavigate();

  const getResponsibleOptions = () => {
    return profiles
      .filter((profile) => profile.is_active)
      .map((profile) => ({
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

  const isReleased = eco?.release_state === "Released";
  const keyColumnMaxWidth = "140px";

  return (
    <DokulyCard>
      <CardTitle titleText={"Information"} />

      <Container fluid>
        {/* State - Display only, like partInfoCard */}
        <Row className="align-items-center mb-2">
          <Col className="col-lg-6 col-xl-6" style={{ maxWidth: keyColumnMaxWidth }}>
            <b>State:</b>
          </Col>
          <Col>
            {releaseStateFormatter(eco)}
          </Col>
        </Row>

        {/* Responsible - Inline editing allowed */}
        <Row className="align-items-center mb-2">
          <Col className="col-lg-6 col-xl-6" style={{ maxWidth: keyColumnMaxWidth }}>
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

        {/* Created date */}
        <Row className="align-items-center mb-2">
          <Col className="col-lg-6 col-xl-6" style={{ maxWidth: keyColumnMaxWidth }}>
            <b>Created:</b>
          </Col>
          <Col>
            <DokulyDateFormat date={eco?.created_at} />
          </Col>
        </Row>

        {/* Created by */}
        {eco?.created_by_name && (
          <Row className="align-items-center mb-2">
            <Col className="col-lg-6 col-xl-6" style={{ maxWidth: keyColumnMaxWidth }}>
              <b>Created by:</b>
            </Col>
            <Col>{eco.created_by_name}</Col>
          </Row>
        )}

        {/* Quality assurance */}
        {eco?.quality_assurance && (
          <Row className="align-items-center mb-2">
            <Col className="col-lg-6 col-xl-6" style={{ maxWidth: keyColumnMaxWidth }}>
              <b>Quality assurance:</b>
            </Col>
            <Col>{`${eco.quality_assurance?.first_name} ${eco.quality_assurance?.last_name}`}</Col>
          </Row>
        )}

        {/* Released date */}
        {eco?.released_date && (
          <Row className="align-items-center mb-2">
            <Col className="col-lg-6 col-xl-6" style={{ maxWidth: keyColumnMaxWidth }}>
              <b>Released:</b>
            </Col>
            <Col>
              <DokulyDateFormat date={eco?.released_date} />
            </Col>
          </Row>
        )}

        {/* Released by */}
        {eco?.released_by_name && (
          <Row className="align-items-center mb-2">
            <Col className="col-lg-6 col-xl-6" style={{ maxWidth: keyColumnMaxWidth }}>
              <b>Released by:</b>
            </Col>
            <Col>{eco.released_by_name}</Col>
          </Row>
        )}
      </Container>
    </DokulyCard>
  );
};

export default EcoInfoCard;
