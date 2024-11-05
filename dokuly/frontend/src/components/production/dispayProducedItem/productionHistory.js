import React from "react";
import VerticalTimeline from "../../dokuly_components/verticalTimeline";
import { Row, Col } from "react-bootstrap";

const ProductionHistory = () => {
  const productionSteps = [
    { title: "Step 1", description: "Part placement", status: "passed" },
    { title: "Step 2", description: "Optical inspection", status: "passed" },
    { title: "Step 3", description: "Programming", status: "passed" },
    { title: "Step 4", description: "Voltage rails present", status: "failed" },
    // { title: "Step 5", description: "Test passed" },
    // { title: "Step 6", description: "Packaging" },
    // { title: "Step 7", description: "Shipping" },
    // { title: "Step 8", description: "Delivered" },
    // Add more steps as needed
  ];

  return (
    <div className="card-body m-3 card rounded">
      <Row>
        <Col sm={4}>
          <h5>
            <b>Last test run</b>
          </h5>
        </Col>
      </Row>
      <Row>
        <Col>
          <VerticalTimeline steps={productionSteps} />
        </Col>
      </Row>
    </div>
  );
};

export default ProductionHistory;
