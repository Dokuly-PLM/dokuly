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
    
    const separator = organization?.revision_separator || "-";
    const revisionFormat = organization?.revision_format || "major-minor";
    
    // Parse current revision to show what the new one would be
    if (organization?.use_number_revisions) {
      // NUMBER-BASED REVISIONS
      if (revisionFormat === "major-minor") {
        if (currentRevision.includes(separator)) {
          const [major, minor] = currentRevision.split(separator);
          
          if (type === "major") {
            return `${parseInt(major) + 1}${separator}0`;
          } else {
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
          return `${letterValue + 1}`;
        } else {
          const currentMajor = parseInt(currentRevision) || 0;
          return `${currentMajor + 1}`;
        }
      }
    } else {
      // LETTER-BASED REVISIONS
      if (revisionFormat === "major-minor") {
        // Letter-based with major-minor support (A-0, A-1, B-0, etc.)
        if (currentRevision.includes(separator)) {
          const parts = currentRevision.split(separator);
          const letterPart = parts[0];
          const minorPart = parseInt(parts[1]) || 0;
          
          if (type === "major") {
            // Next letter with minor reset to 0
            const nextLetter = String.fromCharCode(letterPart.charCodeAt(letterPart.length - 1) + 1);
            return `${nextLetter}${separator}0`;
          } else {
            // Same letter, increment minor
            return `${letterPart}${separator}${minorPart + 1}`;
          }
        } else {
          // Simple letter, add minor revision
          if (type === "major") {
            // Next letter with minor 0
            const nextLetter = String.fromCharCode(currentRevision.charCodeAt(currentRevision.length - 1) + 1);
            return `${nextLetter}${separator}0`;
          } else {
            // Same letter, add minor 1
            return `${currentRevision}${separator}1`;
          }
        }
      } else {
        // Major-only format (legacy letter revisions)
        if (type === "major") {
          return String.fromCharCode(currentRevision.charCodeAt(0) + 1);
        } else {
          // In major-only mode, minor doesn't make sense
          return currentRevision;
        }
      }
    }
  };

  const getDescriptionText = () => {
    const revisionFormat = organization?.revision_format || "major-minor";
    
    if (revisionFormat === "major-minor") {
      if (organization?.use_number_revisions) {
        return "Choose between major (increments major version) or minor (increments minor version) revision.";
      } else {
        return "Choose between major (next letter, reset minor to 0) or minor (same letter, increment minor) revision.";
      }
    } else {
      if (organization?.use_number_revisions) {
        return "A new major revision will be created (next number).";
      } else {
        return "A new major revision will be created (next letter).";
      }
    }
  };

  // Show minor revision option if major-minor format is enabled (for both letter and number systems)
  const showMinorOption = (organization?.revision_format || "major-minor") === "major-minor";

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
