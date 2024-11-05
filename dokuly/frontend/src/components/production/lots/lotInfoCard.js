import React from "react";
import DokulyCard from "../../dokuly_components/dokulyCard";
import CardTitle from "../../dokuly_components/cardTitle";
import { Col, Container, ProgressBar, Row } from "react-bootstrap";
import EditButton from "../../dokuly_components/editButton";
import { ThumbnailFormatter } from "../../dokuly_components/dokulyTable/functions/formatters";
import DokulyDateFormat from "../../dokuly_components/formatters/dateFormatter";
import { InfoRow } from "../../requirements/components/requirementsInfoCard";
import ProductionProgress from "../components/productionProgress";
import { useNavigate } from "react-router";

const LotInfoCard = ({ lot, openModal, currentProducedCount = 0 }) => {
  const navigate = useNavigate();
  const handleNavigate = () => {
    let itemType = getItemTypeFromModelObject(lot);
    if (itemType === "No item") return;
    if (itemType === "assembly") {
      itemType = "assemblies";
    }
    if (itemType === "pcba") {
      itemType = "pcbas";
    }
    if (itemType === "part") {
      itemType = "parts";
    }
    navigate(`/${itemType}/${getNestedModelObject(lot)?.id}`);
  };

  return (
    <DokulyCard>
      <CardTitle titleText={"Information"} />
      <hr />
      <Container fluid style={{ marginTop: "-0.5rem" }}>
        <Row>
          <Col>
            <EditButton buttonText="Edit" onClick={openModal} />
          </Col>
          <Col className="justify-content-end">
            <ThumbnailFormatter
              thumbnail={getNestedModelObject(lot)?.thumbnail}
            />
          </Col>
        </Row>
        <Row className="mt-3">
          <Col xs="6" sm="6" md="6" lg="4" xl="4">
            <b>Lot item:</b>
          </Col>
          <Col onClick={() => handleNavigate()} style={{ cursor: "pointer" }}>
            {formatLotItemTitle(lot)}
            <img
              src="/static/icons/arrow-right.svg"
              alt="arrow right"
              width={20}
              style={{ marginLeft: "5px" }}
            />
          </Col>
        </Row>
        <Row>
          <Col xs="6" sm="6" md="6" lg="4" xl="4">
            <b>Quantity:</b>
          </Col>
          <Col>{lot?.quantity ?? "Quantity not defined"}</Col>
        </Row>
        <Row className="mt-3">
          <Col xs="6" sm="6" md="6" lg="4" xl="4">
            <b>Title:</b>
          </Col>
          <Col>{lot?.title ?? ""}</Col>
        </Row>
        <Row>
          <Col xs="6" sm="6" md="6" lg="4" xl="4">
            <b>Project:</b>
          </Col>
          <Col>{getLotProjectObject(lot)?.title ?? "No project"}</Col>
        </Row>
        <Row className="mb-3">
          <Col xs="6" sm="6" md="6" lg="4" xl="4">
            <b>Created at:</b>
          </Col>
          <Col>
            <DokulyDateFormat date={lot?.created_at} />
          </Col>
        </Row>
        <Row className="mb-3">
          <Col xs="6" sm="6" md="6" lg="4" xl="4">
            <b>Assembly date:</b>
          </Col>
          <Col>
            <DokulyDateFormat date={lot?.planned_production_date} />
          </Col>
        </Row>
        <ProductionProgress
          lot={lot}
          currentProducedCount={currentProducedCount}
          firstColClassname="col-xl-4 col-lg-4"
        />
      </Container>
    </DokulyCard>
  );
};

export default LotInfoCard;

export const getLotProjectObject = (lot) => {
  if (!lot) return { title: "No project", id: -1 };
  if (lot?.assembly) {
    return lot?.assembly?.project;
  } else if (lot?.pcba) {
    return lot?.pcba?.project;
  } else {
    return lot?.part?.project;
  }
};

export const formatLotItemTitle = (lot) => {
  if (!lot) return "No item";
  if (lot?.assembly) {
    return (
      lot?.assembly?.full_part_number + " - " + lot?.assembly?.display_name
    );
  } else if (lot?.pcba) {
    return lot?.pcba?.full_part_number + " - " + lot?.pcba?.display_name;
  } else {
    return lot?.part?.full_part_number + " - " + lot?.part?.display_name;
  }
};

export const getNestedModelObject = (object) => {
  if (object?.assembly) {
    return object.assembly;
  }
  if (object?.pcba) {
    return object.pcba;
  }
  if (object?.part) {
    return object.part;
  }
  return { id: -1, display_name: "No item" };
};

export const getItemTypeFromModelObject = (object) => {
  if (object?.assembly) {
    return "assembly";
  }
  if (object?.pcba) {
    return "pcba";
  }
  if (object?.part) {
    return "part";
  }
  return "No item";
};

export const getColor = (progress) => {
  if (progress < 33) {
    return "danger"; // Red
  }
  if (progress < 75) {
    return "warning"; // Yellow
  }
  return "success"; // Green
};
