import React from "react";
import { Row, Col } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import DokulyCard from "../../dokuly_components/dokulyCard";

const ItemInformation = ({ producedItem }) => {
  const navigate = useNavigate();

  // Check if producedItem is not available and return an early fallback or null
  if (!producedItem) {
    // Show one large loading spinner
    return (
      <Row className="justify-content-center mt-3">
        <Col>
          <div className="spinner-border " role="status" />
        </Col>
      </Row>
    );
  }

  const handleOnClickPartNumber = () => {
    const { part, pcba, assembly } = producedItem;
    if (part) {
      navigate(`/parts/${part.id}`);
    } else if (pcba) {
      navigate(`/pcbas/${pcba.id}`);
    } else if (assembly) {
      navigate(`/assemblies/${assembly.id}`);
    }
  };

  return (
    <DokulyCard title=" Information" expandText="Item Information">
      <Row className="mb-2">
        <Col sm={12}>
          <h5>
            <b> Information</b>
          </h5>
        </Col>
      </Row>
      <Row>
        <Col sm={4}>
          <b>Part number:</b>
        </Col>
        <Col
          sm={8}
          onClick={handleOnClickPartNumber}
          style={{
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
          }}
        >
          <span>
            {(() => {
              const part = producedItem.part || producedItem.pcba || producedItem.assembly;
              if (!part) return "";
              // full_part_number already contains the revision
              return part.full_part_number || "";
            })()}
          </span>
          <img
            src="/static/icons/arrow-right.svg"
            alt="arrow right"
            width={20}
            style={{ marginLeft: "5px" }}
          />
        </Col>
      </Row>
      <Row>
        <Col sm={4}>
          <b>Serial number:</b>
        </Col>
        <Col sm={8}>{producedItem.serial_number || "N/A"}</Col>
      </Row>
      <Row>
        <Col sm={4}>
          <b>Lot:</b>
        </Col>
        <Col sm={8}>
          {producedItem?.lot ? (
            <span
              style={{ cursor: "pointer" }}
              className="align-items-center"
              onClick={() => {
                navigate(`/production/lot/${producedItem?.lot?.id}`);
              }}
            >
              Lot {producedItem?.lot?.lot_number} -{" "}
              {producedItem?.lot?.title || "No title"}
              <img
                src="/static/icons/arrow-right.svg"
                alt="arrow right"
                width={20}
                style={{ marginLeft: "5px" }}
              />
            </span>
          ) : (
            <span>No connected lot</span>
          )}
        </Col>
      </Row>
      <Row>
        <Col sm={4}>
          <b>Assembly date:</b>
        </Col>
        <Col sm={8}>
          {producedItem.assembly_date
            ? moment(producedItem.assembly_date).format("YYYY-MM-DD")
            : "N/A"}
        </Col>
      </Row>
      <Row>
        <Col sm={4}>
          <b>Created at:</b>
        </Col>
        <Col sm={8}>
          {moment(producedItem.created_at).format("YYYY-MM-DD HH:mm:ss")}
        </Col>
      </Row>
      <Row>
        <Col sm={4}>
          <b>Last updated:</b>
        </Col>
        <Col sm={8}>
          {producedItem.last_updated
            ? moment(producedItem.last_updated).format("YYYY-MM-DD HH:mm:ss")
            : "Not updated"}
        </Col>
      </Row>
      <Row>
        <Col sm={4}>
          <b>State:</b>
        </Col>
        <Col sm={8}>{producedItem.state || "N/A"}</Col>
      </Row>
      <Row>
        <Col sm={4}>
          <b>Comment:</b>
        </Col>
        <Col sm={8}>{producedItem.comment || "No comment"}</Col>
      </Row>
    </DokulyCard>
  );
};

export default ItemInformation;
