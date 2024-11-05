import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import VerticalTimeline from "../verticalTimeline";
import { Col, Row } from "react-bootstrap";
import ReviewFlow from "./reviewFlow";

const ReleaseStateTimeline = ({
  releaseState,
  setReleaseState,
  is_approved_for_release,
  setIsApprovedForRelease,
  quality_assurance,
}) => {
  const [steps, setSteps] = useState([
    { title: "Draft", description: "", status: "empty", value: "Draft" },
    {
      title: "Review",
      description: "",
      status: "empty",
      value: "Review",
    },
    {
      title: "Released",
      description: "",
      status: "empty",
      value: "Released",
    },
  ]);

  useEffect(() => {
    setIsApprovedForRelease(quality_assurance !== null ? true : false);
  }, [quality_assurance]);

  useEffect(() => {
    const updatedSteps = steps.map((step) => {
      let status = "empty";
      if (step.value === releaseState) {
        status = "passed";
        if (step.value === "Draft" && !is_approved_for_release) {
          status = "exclamation";
        } else if (step.value === "Review" && !is_approved_for_release) {
          status = "question";
        }
      }

      return {
        ...step,
        status,
        title: (
          <div
            onClick={() => handleStateChange(step.value)}
            style={{ cursor: "pointer", display: "flex", alignItems: "center" }}
          >
            <div style={{ marginRight: "10px" }}>{step.title}</div>
          </div>
        ),
      };
    });
    setSteps(updatedSteps);
  }, [releaseState, is_approved_for_release]);

  const handleStateChange = (value) => {
    setReleaseState(value);
  };

  return (
    <React.Fragment>
      <label>State</label>
      <div
        style={{
          border: "1px solid #ccc",
          padding: "10px",
          margin: "0px",
          borderRadius: "5px",
        }}
      >
        <Row>
          <Col>
            <div>
              <VerticalTimeline steps={steps} />
            </div>
          </Col>
          <Col>
            <div>
              <ReviewFlow
                releaseState={releaseState}
                is_approved_for_release={is_approved_for_release}
                setIsApprovedForRelease={setIsApprovedForRelease}
              />
            </div>
          </Col>
        </Row>
      </div>
    </React.Fragment>
  );
};

ReleaseStateTimeline.propTypes = {
  releaseState: PropTypes.string.isRequired,
  setReleaseState: PropTypes.func.isRequired,
  is_approved_for_release: PropTypes.bool.isRequired,
  setIsApprovedForRelease: PropTypes.func.isRequired,
  quality_assurance: PropTypes.object,
};

export default ReleaseStateTimeline;
