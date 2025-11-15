import React, { useState, useEffect } from "react";
import { Form, Row, Col, Dropdown, Alert, Button } from "react-bootstrap";
import { editOrg } from "../../functions/queries";
import { toast } from "react-toastify";
import SubmitButton from "../../../dokuly_components/submitButton";
import CheckBox from "../../../dokuly_components/checkBox";
import DokulyDropdown from "../../../dokuly_components/dokulyDropdown";
import axios from "axios";
import { tokenConfig } from "../../../common/queries";

const RevisionSystemSettings = ({ org, setRefresh }) => {
  const [useNumberRevisions, setUseNumberRevisions] = useState(
    org?.use_number_revisions || false
  );
  const [revisionFormat, setRevisionFormat] = useState(
    org?.revision_format || "major-minor"
  );
  const [revisionSeparator, setRevisionSeparator] = useState(
    org?.revision_separator || "-"
  );
  const [isUpdating, setIsUpdating] = useState(false);
  const [corruptedRevisions, setCorruptedRevisions] = useState(null);
  const [isCheckingCorrupted, setIsCheckingCorrupted] = useState(false);
  const [isFixingCorrupted, setIsFixingCorrupted] = useState(false);

  // Update state when org prop changes
  useEffect(() => {
    if (org) {
      setUseNumberRevisions(org.use_number_revisions || false);
      setRevisionFormat(org.revision_format || "major-minor");
      setRevisionSeparator(org.revision_separator || "-");
    }
  }, [org]);

  const checkCorruptedRevisions = async () => {
    setIsCheckingCorrupted(true);
    try {
      const response = await axios.get("/api/organizations/checkCorruptedRevisions/", tokenConfig());
      setCorruptedRevisions(response.data);
      
      if (response.data.has_corrupted_revisions) {
        toast.warning(`Found ${response.data.corrupted_count} corrupted items`);
      } else {
        toast.success("No corrupted revisions found");
      }
    } catch (error) {
      console.error("Error checking corrupted revisions:", error);
      if (error.response?.status === 401) {
        toast.error("Authentication required. Please log in again.");
      } else if (error.response?.status === 403) {
        toast.error("Insufficient permissions to check for corrupted revisions.");
      } else {
        toast.error(`Failed to check for corrupted revisions: ${error.response?.data?.detail || error.message}`);
      }
    } finally {
      setIsCheckingCorrupted(false);
    }
  };

  const fixCorruptedRevisions = async () => {
    setIsFixingCorrupted(true);
    try {
      const response = await axios.post("/api/organizations/fixCorruptedRevisions/", {}, tokenConfig());
      
      if (response.data.success) {
        toast.success(response.data.message);
        setCorruptedRevisions(null);
        setRefresh(true);
      } else {
        toast.error("Failed to fix corrupted revisions.");
      }
    } catch (error) {
      console.error("Error fixing corrupted revisions:", error);
      if (error.response?.status === 401) {
        toast.error("Authentication required. Please log in again.");
      } else if (error.response?.status === 403) {
        toast.error("Insufficient permissions to fix corrupted revisions.");
      } else {
        toast.error(`Failed to fix corrupted revisions: ${error.response?.data?.detail || error.message}`);
      }
    } finally {
      setIsFixingCorrupted(false);
    }
  };

  const handleSave = async () => {
    setIsUpdating(true);
    try {
      const data = {
        use_number_revisions: useNumberRevisions,
        revision_format: revisionFormat,
        revision_separator: revisionSeparator,
      };

      const response = await editOrg(org.id, data);
      
      if (response.status === 200) {
        toast.success("Revision system settings updated successfully.");
        setRefresh(true);
        
        // Don't auto-check for corrupted revisions after saving
      } else {
        toast.error("Failed to update revision system settings.");
      }
    } catch (error) {
      console.error("Error updating revision system settings:", error);
      toast.error("Failed to update revision system settings.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReset = () => {
    setUseNumberRevisions(org?.use_number_revisions || false);
    setRevisionFormat(org?.revision_format || "major-minor");
    setRevisionSeparator(org?.revision_separator || "-");
  };

  const hasChanges = 
    useNumberRevisions !== (org?.use_number_revisions || false) ||
    revisionFormat !== (org?.revision_format || "major-minor") ||
    revisionSeparator !== (org?.revision_separator || "-");

  return (
    <div className="card-body rounded bg-white">
      <h3 className="card-title">
        <b>Revision System Settings</b>
      </h3>
      <p className="text-muted mb-3">
        Configure how revisions are displayed and managed for parts, assemblies, and PCBAs.
      </p>
      
      {/* Corrupted Revisions Alert */}
      {corruptedRevisions && corruptedRevisions.has_corrupted_revisions && (
        <Alert variant="warning" className="mb-3">
          <Alert.Heading>Corrupted Revision Data Detected</Alert.Heading>
          <p>
            We found {corruptedRevisions.corrupted_count} items with corrupted full part numbers. 
            This can happen when migrating from letter to number revisions.
          </p>
          {corruptedRevisions.corrupted_items.length > 0 && (
            <div className="mb-3">
              <strong>Examples:</strong>
              <ul className="mb-0">
                {corruptedRevisions.corrupted_items.map((item, index) => (
                  <li key={index}>
                    <code>{item.current}</code> → <code>{item.correct}</code>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <Button 
            variant="warning" 
            size="sm" 
            onClick={fixCorruptedRevisions}
            disabled={isFixingCorrupted}
          >
            {isFixingCorrupted ? "Fixing..." : "Fix Corrupted Revisions"}
          </Button>
        </Alert>
      )}
      
      {/* Check for corrupted revisions button */}
      {useNumberRevisions && (
        <div className="mb-3">
          <Button 
            variant="outline-secondary" 
            size="sm" 
            onClick={checkCorruptedRevisions}
            disabled={isCheckingCorrupted}
          >
            {isCheckingCorrupted ? "Checking..." : "Check for Corrupted Revisions"}
          </Button>
          <small className="text-muted d-block mt-1">
            Check if any parts have corrupted full part numbers from previous migrations.
          </small>
        </div>
      )}
        
        <Form>
          <Row>
            <Col md={12}>
              <Form.Group className="mb-3">
                <CheckBox
                  id="use-number-revisions"
                  label="Use number-based revisions"
                  checked={useNumberRevisions}
                  onChange={(e) => setUseNumberRevisions(e.target.checked)}
                />
                <Form.Text className="text-muted">
                  When enabled, revisions will use numbers (1, 2, 3...) instead of letters (A, B, C...).
                </Form.Text>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label>Revision Format</Form.Label>
                <DokulyDropdown
                  title={
                    revisionFormat === "major-only" 
                      ? useNumberRevisions ? "Major Only (1, 2, 3...)" : "Major Only (A, B, C...)"
                      : useNumberRevisions ? "Major-Minor (1-0, 1-1, 2-0...)" : "Major-Minor (A-0, A-1, B-0...)"
                  }
                  variant="outline-secondary"
                >
                  {({ closeDropdown }) => (
                    <>
                      <Dropdown.Item
                        onClick={() => {
                          setRevisionFormat("major-only");
                          closeDropdown();
                        }}
                        active={revisionFormat === "major-only"}
                      >
                        {useNumberRevisions ? "Major Only (1, 2, 3...)" : "Major Only (A, B, C...)"}
                      </Dropdown.Item>
                      <Dropdown.Item
                        onClick={() => {
                          setRevisionFormat("major-minor");
                          closeDropdown();
                        }}
                        active={revisionFormat === "major-minor"}
                      >
                        {useNumberRevisions ? "Major-Minor (1-0, 1-1, 2-0...)" : "Major-Minor (A-0, A-1, B-0...)"}
                      </Dropdown.Item>
                    </>
                  )}
                </DokulyDropdown>
                <Form.Text className="text-muted">
                  Choose the format for {useNumberRevisions ? "number" : "letter"}-based revisions. Major-minor format allows for more granular versioning with sub-revisions.
                </Form.Text>
              </Form.Group>
            </Col>
          </Row>

          {revisionFormat === "major-minor" && (
            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Major-Minor Separator</Form.Label>
                  <DokulyDropdown
                    title={
                      revisionSeparator === "-" 
                        ? useNumberRevisions ? "Dash (1-0, 1-1, 2-0...)" : "Dash (A-0, A-1, B-0...)"
                        : useNumberRevisions ? "Dot (1.0, 1.1, 2.0...)" : "Dot (A.0, A.1, B.0...)"
                    }
                    variant="outline-secondary"
                    disabled={revisionFormat !== "major-minor"}
                  >
                    {({ closeDropdown }) => (
                      <>
                        <Dropdown.Item
                          onClick={() => {
                            setRevisionSeparator("-");
                            closeDropdown();
                          }}
                          active={revisionSeparator === "-"}
                        >
                          {useNumberRevisions ? "Dash (1-0, 1-1, 2-0...)" : "Dash (A-0, A-1, B-0...)"}
                        </Dropdown.Item>
                        <Dropdown.Item
                          onClick={() => {
                            setRevisionSeparator(".");
                            closeDropdown();
                          }}
                          active={revisionSeparator === "."}
                        >
                          {useNumberRevisions ? "Dot (1.0, 1.1, 2.0...)" : "Dot (A.0, A.1, B.0...)"}
                        </Dropdown.Item>
                      </>
                    )}
                  </DokulyDropdown>
                  <Form.Text className="text-muted">
                    Choose the separator between major and minor revision {useNumberRevisions ? "numbers" : "identifiers"}.
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
          )}

          <Row>
            <Col md={12}>
              <div className="alert alert-info">
                <strong>Current Configuration:</strong>
                <ul className="mb-0 mt-2">
                  <li>
                    <strong>Revision Type:</strong> {useNumberRevisions ? "Number-based" : "Letter-based"}
                  </li>
                  <li>
                    <strong>Format:</strong> {revisionFormat === "major-only" ? "Major only" : "Major-minor"}
                  </li>
                  {revisionFormat === "major-minor" && (
                    <li>
                      <strong>Separator:</strong> {revisionSeparator === "-" ? "Dash (-)" : "Dot (.)"}
                    </li>
                  )}
                  <li>
                    <strong>Example:</strong>{" "}
                    {useNumberRevisions 
                      ? revisionFormat === "major-only" 
                        ? "1, 2, 3..."
                        : revisionSeparator === "-" 
                          ? "1-0, 1-1, 2-0..."
                          : "1.0, 1.1, 2.0..."
                      : revisionFormat === "major-only"
                        ? "A, B, C..."
                        : revisionSeparator === "-"
                          ? "A-0, A-1, B-0..."
                          : "A.0, A.1, B.0..."
                    }
                  </li>
                </ul>
                {hasChanges && (
                  <>
                    <hr />
                    <strong>Note:</strong> Changing these settings will affect how new revisions are created:
                    <ul className="mb-0 mt-2">
                      {useNumberRevisions !== (org?.use_number_revisions || false) && (
                        <li>Switching between letter and number systems requires a data migration</li>
                      )}
                      {revisionFormat !== (org?.revision_format || "major-minor") && (
                        <li>
                          {revisionFormat === "major-minor" 
                            ? "Enabling major-minor format allows creating sub-revisions (e.g., 1-0, 1-1)" 
                            : "Disabling major-minor format will only allow major revisions (e.g., 1, 2, 3)"}
                        </li>
                      )}
                      <li>This change affects all parts, assemblies, PCBAs, and documents in your organization</li>
                    </ul>
                  </>
                )}
              </div>
            </Col>
          </Row>

          <Row>
            <Col md={12}>
              <div className="mb-3">
                <SubmitButton
                  onClick={handleSave}
                  disabled={!hasChanges || isUpdating}
                  disabledTooltip={!hasChanges ? "No changes to save" : "Saving settings..."}
                >
                  {isUpdating ? "Saving..." : "Save Settings"}
                </SubmitButton>
              </div>
            </Col>
          </Row>
        </Form>
    </div>
  );
};

export default RevisionSystemSettings;
