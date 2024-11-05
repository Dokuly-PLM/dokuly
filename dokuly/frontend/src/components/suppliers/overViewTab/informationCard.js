import React from "react";
import { Row, Col } from "react-bootstrap";
import ThumbnailDisplay from "../../dokuly_components/thumbnailDisplay";
import DokulyCard from "../../dokuly_components/dokulyCard";
import CardTitle from "../../dokuly_components/cardTitle";

export default function Information({ supplier, setRefresh }) {
  return (
    <DokulyCard>
      <CardTitle titleText={"Information"} />
      <Row>
        <Col className="col-2">
          <ThumbnailDisplay
            item_id={supplier?.id}
            app={"procurement"}
            releaseState={"draft"}
            setRefresh={setRefresh}
            thumbnailId={supplier?.thumbnail}
          />
        </Col>
        <Col className="col-10">
          {supplier?.website !== null && supplier?.website !== "" && (
            <Row>
              <button
                className="btn btn-link"
                onClick={() => {
                  window.open(supplier.website, "_blank");
                }}
              >
                <img
                  src="../../static/icons/world.svg"
                  alt="website"
                  style={{ width: "1.5rem" }}
                />
              </button>
            </Row>
          )}
          <Row>
            <Col className="col-3">
              <b>Address:</b>
            </Col>
            <Col>{supplier?.address}</Col>
          </Row>
          <Row>
            <Col className="col-3">
              <b>Contact:</b>
            </Col>
            <Col>{supplier?.contact}</Col>
          </Row>
          <Row>
            <Col className="col-3">
              <b>Phone:</b>
            </Col>
            <Col>{supplier?.phone}</Col>
          </Row>
          <Row>
            <Col className="col-3">
              <b>Email:</b>
            </Col>
            <Col>{supplier?.email}</Col>
          </Row>
          <Row>
            <Col className="col-3">
              <b>Default currency:</b>
            </Col>
            <Col>{supplier?.default_currency}</Col>
          </Row>
          <Row>
            <Col className="col-3">
              <b>Default payment terms:</b>
            </Col>
            <Col>{supplier?.default_payment_terms}</Col>
          </Row>
          <Row>
            <Col className="col-3">
              <b>Default incoterms:</b>
            </Col>
            <Col>{supplier?.default_shipping_terms}</Col>
          </Row>
          <Row>
            <Col className="col-3">
              <b>Default VAT (%):</b>
            </Col>
            <Col>{supplier?.default_vat ?? 0}</Col>
          </Row>
        </Col>
      </Row>
    </DokulyCard>
  );
}
