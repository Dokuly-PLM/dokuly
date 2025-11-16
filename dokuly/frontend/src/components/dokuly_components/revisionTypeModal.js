import React, { useState } from "react";
import DokulyModal from "./dokulyModal";
import SubmitButton from "./submitButton";
import { Form } from "react-bootstrap";

/**
 * Modal for choosing between major and minor revision types
 */
const RevisionTypeModal = ({ 
  show, 
  onHide, 
  onConfirm, 
  currentRevision = "",
  organization = null 
}) => {
  const [revisionType, setRevisionType] = useState("major");

  const handleConfirm = () => {
    onConfirm(revisionType);
    // Don't close modal here - let the parent component handle it after API call
  };

  // Show minor revision option if major-minor format is enabled (for both letter and number systems)
  // Default to "major-only" if organization or revision_format is not set
  const showMinorOption = organization?.revision_format === "major-minor";

  const radioStyle = {
    accentColor: '#165216ff'
  };

  return (
    <DokulyModal show={show} onHide={onHide} title="Create New Revision">
      <div className="mb-3">
        <p className="mb-3">
          {showMinorOption 
            ? `Choose the type of revision to create for ${currentRevision}:`
            : `Create a new major revision for ${currentRevision}:`
          }
        </p>
      
        
        {showMinorOption && (
          <div className="mb-4">
            <Form.Check
              type="radio"
              id="major-radio"
              name="revisionType"
              label="Major Revision"
              checked={revisionType === "major"}
              onChange={() => setRevisionType("major")}
              className="mb-2"
              style={radioStyle}
            />
            <Form.Check
              type="radio"
              id="minor-radio"
              name="revisionType"
              label="Minor Revision"
              checked={revisionType === "minor"}
              onChange={() => setRevisionType("minor")}
              style={radioStyle}
            />
          </div>
        )}
        
        {!showMinorOption && (
          <div className="mb-3 p-3 border rounded bg-light">
            <div>
              <strong>Major Revision</strong>
            </div>
          </div>
        )}
      </div>
      
      <div className="d-flex gap-3 justify-content-end">
        <button
          className="btn btn-outline-secondary dokuly-button"
          onClick={onHide}
        >
          Cancel
        </button>
        <SubmitButton onClick={handleConfirm}>
          Create Revision
        </SubmitButton>
      </div>
    </DokulyModal>
  );
};

export default RevisionTypeModal;
