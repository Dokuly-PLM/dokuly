import React from "react";
import { Form, InputGroup } from "react-bootstrap";

const ReviewFlow = ({
  releaseState,
  is_approved_for_release,
  setIsApprovedForRelease,
}) => {
  const isReviewState = releaseState === "Review";

  return (
    <Form.Group
      className="m-3"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <h6>Quality Assurance</h6>
      <InputGroup>
        <Form.Check
          className="dokuly-checkbox mr-3"
          type="checkbox"
          id="review_status"
          label="Item approved for release."
          checked={is_approved_for_release}
          onChange={() => setIsApprovedForRelease(!is_approved_for_release)}
          disabled={!isReviewState} // Disable checkbox if not in 'Review' state
        />
      </InputGroup>
    </Form.Group>
  );
};

export default ReviewFlow;
