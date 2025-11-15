import React, { useState } from "react";
import DokulyModal from "./dokulyModal";
import SubmitButton from "./submitButton";
import CheckBox from "./checkBox";

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

  const getRevisionPreview = (type) => {
    if (!currentRevision) return "1-0";
    
    // Parse current revision to show what the new one would be
    if (organization?.use_number_revisions) {
      if (organization?.revision_format === "major-minor") {
        const separator = organization?.revision_separator || "-";
        
        if (currentRevision.includes(separator)) {
          const [major, minor] = currentRevision.split(separator);
          
          if (type === "major") {
            return `${parseInt(major) + 1}${separator}0`;
          } else {
            // Ensure we don't add leading zeros
            const newMinor = parseInt(minor) + 1;
            return `${major}${separator}${newMinor}`;
          }
        } else {
          // Check if current revision is a letter (needs conversion)
          if (isNaN(parseInt(currentRevision))) {
            // Convert letter to number: A=1, B=2, C=3, etc.
            const letterValue = currentRevision.charCodeAt(0) - 64; // A=1, B=2, etc.
            if (type === "major") {
              return `${letterValue + 1}${separator}0`;
            } else {
              return `${letterValue}${separator}1`;
            }
          } else {
            // Single number, treat as major
            if (type === "major") {
              return `${parseInt(currentRevision) + 1}${separator}0`;
            } else {
              return `${currentRevision}${separator}1`;
            }
          }
        }
      } else {
        // Major-only format
        if (isNaN(parseInt(currentRevision))) {
          // Convert letter to number: A=1, B=2, C=3, etc.
          const letterValue = currentRevision.charCodeAt(0) - 64; // A=1, B=2, etc.
          return type === "major" ? `${letterValue + 1}` : `${letterValue}.1`;
        } else {
          const currentMajor = parseInt(currentRevision) || 0;
          return type === "major" ? `${currentMajor + 1}` : `${currentMajor}.1`;
        }
      }
    } else {
      // Letter revisions
      if (type === "major") {
        return String.fromCharCode(currentRevision.charCodeAt(0) + 1);
      } else {
        return currentRevision + "1";
      }
    }
  };

  const getDescriptionText = () => {
    if (organization?.use_number_revisions && organization?.revision_format === "major-minor") {
      return "Choose between major (increments major version) or minor (increments minor version) revision.";
    } else if (organization?.use_number_revisions) {
      return "Choose between major (increments version number) or minor (adds decimal) revision.";
    } else {
      return "A new major revision will be created (next letter).";
    }
  };

  // Only show minor revision option if number-based revisions are enabled
  const showMinorOption = organization?.use_number_revisions === true;

  return (
    <DokulyModal show={show} onHide={onHide} title="Create New Revision">
      <div className="mb-3">
        <p className="mb-3">
          {showMinorOption 
            ? `Choose the type of revision to create for ${currentRevision}:`
            : `Create a new major revision for ${currentRevision}:`
          }
        </p>
        
        <p className="text-muted mb-3">
          {getDescriptionText()}
        </p>
        
        <div className="mb-3">
          <CheckBox
            id="major"
            label={
              <div>
                <strong>Major Revision</strong>
                <br />
                <small className="text-muted">
                  New revision: {getRevisionPreview("major")}
                </small>
              </div>
            }
            checked={revisionType === "major"}
            onChange={(e) => setRevisionType("major")}
          />
          
          {showMinorOption && (
            <div className="mt-3">
              <CheckBox
                id="minor"
                label={
                  <div>
                    <strong>Minor Revision</strong>
                    <br />
                    <small className="text-muted">
                      New revision: {getRevisionPreview("minor")}
                    </small>
                  </div>
                }
                checked={revisionType === "minor"}
                onChange={(e) => setRevisionType("minor")}
              />
            </div>
          )}
        </div>
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
