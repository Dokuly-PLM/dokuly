import React, { useState, useEffect } from "react";
import { Form, Row, Col, Dropdown } from "react-bootstrap";
import { editOrg } from "../../functions/queries";
import { toast } from "react-toastify";
import SubmitButton from "../../../dokuly_components/submitButton";
import CheckBox from "../../../dokuly_components/checkBox";
import DokulyDropdown from "../../../dokuly_components/dokulyDropdown";

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

  // Update state when org prop changes
  useEffect(() => {
    if (org) {
      setUseNumberRevisions(org.use_number_revisions || false);
      setRevisionFormat(org.revision_format || "major-minor");
      setRevisionSeparator(org.revision_separator || "-");
    }
  }, [org]);

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
                  When enabled, revisions will use numbers (1, 2, 3...) instead of letters (A, B, C...). Existing letter revisions will be treated as major revisions.
                </Form.Text>
              </Form.Group>
            </Col>
          </Row>

          {useNumberRevisions && (
            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Revision Format</Form.Label>
                  <DokulyDropdown
                    title={revisionFormat === "major-only" ? "Major Only (1, 2, 3...)" : "Major-Minor (1-0, 1-1, 2-0...)"}
                    variant="outline-secondary"
                    disabled={!useNumberRevisions}
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
                          Major Only (1, 2, 3...)
                        </Dropdown.Item>
                        <Dropdown.Item
                          onClick={() => {
                            setRevisionFormat("major-minor");
                            closeDropdown();
                          }}
                          active={revisionFormat === "major-minor"}
                        >
                          Major-Minor (1-0, 1-1, 2-0...)
                        </Dropdown.Item>
                      </>
                    )}
                  </DokulyDropdown>
                  <Form.Text className="text-muted">
                    Choose the format for number-based revisions. Major-minor format allows for more granular versioning.
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
          )}

          {useNumberRevisions && revisionFormat === "major-minor" && (
            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Major-Minor Separator</Form.Label>
                  <DokulyDropdown
                    title={revisionSeparator === "-" ? "Dash (1-0, 1-1, 2-0...)" : "Dot (1.0, 1.1, 2.0...)"}
                    variant="outline-secondary"
                    disabled={!useNumberRevisions || revisionFormat !== "major-minor"}
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
                          Dash (1-0, 1-1, 2-0...)
                        </Dropdown.Item>
                        <Dropdown.Item
                          onClick={() => {
                            setRevisionSeparator(".");
                            closeDropdown();
                          }}
                          active={revisionSeparator === "."}
                        >
                          Dot (1.0, 1.1, 2.0...)
                        </Dropdown.Item>
                      </>
                    )}
                  </DokulyDropdown>
                  <Form.Text className="text-muted">
                    Choose the separator between major and minor revision numbers.
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
          )}

          <Row>
            <Col md={12}>
              <div className="alert alert-info">
                <strong>Note:</strong> When you save these settings:
                <ul className="mb-0 mt-2">
                  <li>Existing letter revisions (A, B, C...) will be automatically converted to numbers (1, 2, 3...)</li>
                  <li>Part numbers will display with underscore separator (e.g., PRT1234_1 instead of PRT1234A)</li>
                  <li>This change affects all parts, assemblies, and PCBAs in your organization</li>
                  <li>The data migration will run automatically when you click "Save Settings"</li>
                </ul>
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
