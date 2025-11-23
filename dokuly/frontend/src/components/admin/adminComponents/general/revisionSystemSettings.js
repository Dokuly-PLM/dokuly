import React, { useState, useEffect } from "react";
import { Form, Row, Col, Dropdown } from "react-bootstrap";
import { editOrg, previewPartNumberTemplate, previewFormattedRevisionTemplate } from "../../functions/queries";
import { toast } from "react-toastify";
import SubmitButton from "../../../dokuly_components/submitButton";
import CheckBox from "../../../dokuly_components/checkBox";
import DokulyDropdown from "../../../dokuly_components/dokulyDropdown";
import QuestionToolTip from "../../../dokuly_components/questionToolTip";

const RevisionSystemSettings = ({ org, setRefresh }) => {
  const [useNumberRevisions, setUseNumberRevisions] = useState(
    org?.use_number_revisions || false
  );
  const [revisionFormat, setRevisionFormat] = useState(
    org?.revision_format || "major-minor"
  );
  const [revisionStartAtOne, setRevisionStartAtOne] = useState(
    org?.start_major_revision_at_one || false
  );
  const [fullPartNumberTemplate, setFullPartNumberTemplate] = useState(
    org?.full_part_number_template || "<prefix><part_number><revision>"
  );
  const [formattedRevisionTemplate, setFormattedRevisionTemplate] = useState(
    org?.formatted_revision_template || "<major_revision>"
  );
  const [isUpdating, setIsUpdating] = useState(false);
  const [previewExamples, setPreviewExamples] = useState([]);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [revisionPreviewExamples, setRevisionPreviewExamples] = useState([]);
  const [isLoadingRevisionPreview, setIsLoadingRevisionPreview] = useState(false);

  // Update state when org prop changes
  useEffect(() => {
    if (org) {
      setUseNumberRevisions(org.use_number_revisions || false);
      setRevisionFormat(org.revision_format || "major-minor");
      setFullPartNumberTemplate(org.full_part_number_template || "<prefix><part_number><revision>");
      setFormattedRevisionTemplate(org.formatted_revision_template || "<major_revision>");
      setRevisionStartAtOne(org.start_major_revision_at_one || false);
    }
  }, [org]);

  // Fetch preview from backend whenever settings change
  useEffect(() => {
    const fetchPreview = async () => {
      setIsLoadingPreview(true);
      try {
        const response = await previewPartNumberTemplate({
          template: fullPartNumberTemplate,
          use_number_revisions: useNumberRevisions,
          start_major_revision_at_one: revisionStartAtOne,
        });
        
        if (response.status === 200) {
          setPreviewExamples(response.data.examples || []);
        }
      } catch (error) {
        console.error('Error fetching template preview:', error);
        setPreviewExamples([]);
      } finally {
        setIsLoadingPreview(false);
      }
    };

    // Debounce the preview fetch
    const timeoutId = setTimeout(fetchPreview, 300);
    return () => clearTimeout(timeoutId);
  }, [fullPartNumberTemplate, useNumberRevisions, revisionStartAtOne]);

  // Fetch formatted revision preview from backend whenever settings change
  useEffect(() => {
    const fetchRevisionPreview = async () => {
      setIsLoadingRevisionPreview(true);
      try {
        const response = await previewFormattedRevisionTemplate({
          template: formattedRevisionTemplate,
          use_number_revisions: useNumberRevisions,
          revision_format: revisionFormat,
          start_major_revision_at_one: revisionStartAtOne,
        });
        
        if (response.status === 200) {
          setRevisionPreviewExamples(response.data.examples || []);
        }
      } catch (error) {
        console.error('Error fetching revision template preview:', error);
        setRevisionPreviewExamples([]);
      } finally {
        setIsLoadingRevisionPreview(false);
      }
    };

    // Debounce the preview fetch
    const timeoutId = setTimeout(fetchRevisionPreview, 300);
    return () => clearTimeout(timeoutId);
  }, [formattedRevisionTemplate, useNumberRevisions, revisionFormat, revisionStartAtOne]);

  const handleSave = async () => {
    setIsUpdating(true);
    try {
      const data = {
        use_number_revisions: useNumberRevisions,
        revision_format: revisionFormat,
        full_part_number_template: fullPartNumberTemplate,
        formatted_revision_template: formattedRevisionTemplate,
        start_major_revision_at_one: revisionStartAtOne,
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
    setFullPartNumberTemplate(org?.full_part_number_template || "<prefix><part_number><revision>");
    setFormattedRevisionTemplate(org?.formatted_revision_template || "<major_revision>");
    setRevisionStartAtOne(org?.start_major_revision_at_one || false);
  };

  const hasChanges = 
    useNumberRevisions !== (org?.use_number_revisions || false) ||
    revisionFormat !== (org?.revision_format || "major-minor") ||
    fullPartNumberTemplate !== (org?.full_part_number_template || "<prefix><part_number><revision>") ||
    formattedRevisionTemplate !== (org?.formatted_revision_template || "<major_revision>") ||
    revisionStartAtOne !== (org?.start_major_revision_at_one || false);

  // Available template keywords
  const availableKeywords = [
    { keyword: '<prefix>', description: 'Part type (PRT, ASM, PCBA)' },
    { keyword: '<part_number>', description: 'Numeric part number' },
    { keyword: '<major_revision>', description: 'Major revision (A, B, C or 0, 1, 2)' },
    { keyword: '<minor_revision>', description: 'Minor revision (A, B, C or 0, 1, 2)' },
    { keyword: '<revision>', description: 'Major Revision (A, B, C or 0, 1, 2)' },
    { keyword: '<project_number>', description: 'Project number (if applicable)' },
    { keyword: '<day>', description: 'Day of creation (01-31)' },
    { keyword: '<month>', description: 'Month of creation (01-12)' },
    { keyword: '<year>', description: 'Year of creation (e.g., 2025)' },
  ];

  // Helper function to render template with highlighted keywords
  const renderTemplateWithHighlights = (template) => {
    if (!template) return null;
    
    const keywords = availableKeywords.map(k => k.keyword);
    const parts = [];
    let lastIndex = 0;
    
    // Find all keyword matches and their positions
    const matches = [];
    keywords.forEach(keyword => {
      let index = template.indexOf(keyword);
      while (index !== -1) {
        matches.push({ keyword, index });
        index = template.indexOf(keyword, index + 1);
      }
    });
    
    // Sort matches by position
    matches.sort((a, b) => a.index - b.index);
    
    // Build the rendered output
    matches.forEach(({ keyword, index }) => {
      // Add text before the keyword
      if (index > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`}>
            {template.substring(lastIndex, index)}
          </span>
        );
      }
      
      // Add the highlighted keyword
      parts.push(
        <span
          key={`keyword-${index}`}
          style={{
            backgroundColor: '#155216',
            color: '#ffffff',
            padding: '2px 4px',
            borderRadius: '3px',
            fontFamily: 'monospace',
            fontSize: '0.9em',
          }}
        >
          {keyword}
        </span>
      );
      
      lastIndex = index + keyword.length;
    });
    
    // Add remaining text
    if (lastIndex < template.length) {
      parts.push(
        <span key={`text-${lastIndex}`}>
          {template.substring(lastIndex)}
        </span>
      );
    }
    
    return <div style={{ fontFamily: 'monospace', fontSize: '1em' }}>{parts}</div>;
  };

  return (
    <div className="card-body rounded bg-white">
      <h3 className="card-title">
        <b>Revision System Settings</b>
      </h3>
      <p className="text-muted mb-3">
        Configure how revisions are displayed and managed for parts, assemblies, PCBAs, and documents. 
        Use the template to control the exact formatting including separators.
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
                  When enabled, revisions will use numbers instead of letters. By default, number revisions start at 0 (0, 1, 2...), but you can configure them to start at 1 using the setting below.
                </Form.Text>
              </Form.Group>
            </Col>
          </Row>

          {useNumberRevisions && (
            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <CheckBox
                    id="revision-start-at-one"
                    label="Start major revisions at 1"
                    checked={revisionStartAtOne}
                    onChange={(e) => setRevisionStartAtOne(e.target.checked)}
                  />
                  <Form.Text className="text-muted">
                    When enabled, major revisions will display starting at 1 instead of 0 (e.g., 1, 2, 3... instead of 0, 1, 2...). 
                    Minor revisions always start at 0 regardless of this setting (e.g., 1-0, 1-1, 1-2, 2-0...). 
                    This only affects how revisions are displayed, not how they are stored in the database.
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
          )}

          <Row>
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label>Revision Format</Form.Label>
                <DokulyDropdown
                  title={
                    revisionFormat === "major-only" 
                      ? useNumberRevisions 
                        ? (revisionStartAtOne ? "Major Only (1, 2, 3...)" : "Major Only (0, 1, 2...)")
                        : "Major Only (A, B, C...)"
                      : useNumberRevisions 
                        ? (revisionStartAtOne ? "Major-Minor (1-0, 1-1, 2-0...)" : "Major-Minor (0-0, 0-1, 1-0...)")
                        : "Major-Minor (A-A, A-B, B-A...)"
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
                        {useNumberRevisions 
                          ? (revisionStartAtOne ? "Major Only (1, 2, 3...)" : "Major Only (0, 1, 2...)")
                          : "Major Only (A, B, C...)"}
                      </Dropdown.Item>
                      <Dropdown.Item
                        onClick={() => {
                          setRevisionFormat("major-minor");
                          closeDropdown();
                        }}
                        active={revisionFormat === "major-minor"}
                      >
                        {useNumberRevisions 
                          ? (revisionStartAtOne ? "Major-Minor (1-0, 1-1, 2-0...)" : "Major-Minor (0-0, 0-1, 1-0...)")
                          : "Major-Minor (A-A, A-B, B-A...)"}
                      </Dropdown.Item>
                    </>
                  )}
                </DokulyDropdown>
                <Form.Text className="text-muted">
                  Choose the format for {useNumberRevisions ? "number" : "letter"}-based revisions. Major-minor format allows for more granular versioning with sub-revisions. 
                  {useNumberRevisions && `For number-based revisions, the starting value shown above depends on the "Start major revisions at 1" setting.`}
                </Form.Text>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label>
                  Part Number Template 
                  <QuestionToolTip
                    placement="right"
                    optionalHelpText={
                      "Configure how full part numbers are formatted. Available variables:\n" +
                      "• <prefix> - Part type (PRT, ASM, PCBA, DOC)\n" +
                      "• <part_number> - Numeric part number\n" +
                      "• <major_revision> - Major revision (A, B, C or 0, 1, 2)\n" +
                      "• <minor_revision> - Minor revision (A, B, C or 0, 1, 2)\n" +
                      "• <revision> - Complete revision string (includes separator)\n" +
                      "• <project_number> - Project number from associated project\n" +
                      "• <day> - Day from creation date (01-31)\n" +
                      "• <month> - Month from creation date (01-12)\n" +
                      "• <year> - Year from creation date (e.g., 2025)\n\n" +
                      "Example: '<prefix><part_number>-<revision>' → 'PRT10001-A-0'"
                    }
                  />
                </Form.Label>
                <Form.Control
                  type="text"
                  value={fullPartNumberTemplate}
                  onChange={(e) => setFullPartNumberTemplate(e.target.value)}
                  placeholder="<prefix><part_number><revision>"
                  style={{ fontFamily: 'monospace' }}
                />
                <Form.Text className="text-muted d-block mt-2">
                  Preview: {renderTemplateWithHighlights(fullPartNumberTemplate)}
                </Form.Text>
                {isLoadingPreview ? (
                  <Form.Text className="text-muted d-block mt-2">
                    Loading examples...
                  </Form.Text>
                ) : previewExamples.length > 0 ? (
                  <div className="mt-2">
                    <Form.Text className="text-muted d-block">
                      <strong>Examples:</strong>
                    </Form.Text>
                    {previewExamples.map((example, index) => (
                      <Form.Text key={index} className="text-muted d-block" style={{ marginLeft: '1rem' }}>
                        • {example.description}: <strong style={{ fontFamily: 'monospace' }}>{example.formatted}</strong>
                      </Form.Text>
                    ))}
                  </div>
                ) : null}
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label>
                  Standalone Revision Template 
                  <QuestionToolTip
                    placement="right"
                    optionalHelpText={
                      "Configure how standalone revisions are displayed (separate from full part numbers). Available variables:\n" +
                      "• <major_revision> - Major revision (A, B, C or 0, 1, 2)\n" +
                      "• <minor_revision> - Minor revision (A, B, C or 0, 1, 2)\n\n" +
                      "Common examples:\n" +
                      "• '<major_revision>' → 'A' or '0'\n" +
                      "• '<major_revision>-<minor_revision>' → 'A-0' or '0-1'\n" +
                      "• 'Rev <major_revision>' → 'Rev A' or 'Rev 0'\n" +
                      "• 'v<major_revision>.<minor_revision>' → 'vA.0' or 'v0.1'"
                    }
                  />
                </Form.Label>
                <Form.Control
                  type="text"
                  value={formattedRevisionTemplate}
                  onChange={(e) => setFormattedRevisionTemplate(e.target.value)}
                  placeholder="<major_revision>"
                  style={{ fontFamily: 'monospace' }}
                />
                <Form.Text className="text-muted d-block mt-2">
                  This controls how revisions are displayed in standalone contexts (e.g., revision columns in tables).
                </Form.Text>
                <Form.Text className="text-muted d-block mt-2">
                  Preview: {renderTemplateWithHighlights(formattedRevisionTemplate)}
                </Form.Text>
                {isLoadingRevisionPreview ? (
                  <Form.Text className="text-muted d-block mt-2">
                    Loading examples...
                  </Form.Text>
                ) : revisionPreviewExamples.length > 0 ? (
                  <div className="mt-2">
                    <Form.Text className="text-muted d-block">
                      <strong>Examples:</strong>
                    </Form.Text>
                    {revisionPreviewExamples.map((example, index) => (
                      <Form.Text key={index} className="text-muted d-block" style={{ marginLeft: '1rem' }}>
                        • {example.description}: <strong style={{ fontFamily: 'monospace' }}>{example.formatted}</strong>
                      </Form.Text>
                    ))}
                  </div>
                ) : null}
              </Form.Group>
            </Col>
          </Row>

          {/* Available Keywords Reference - applies to both templates above */}
          <Row>
            <Col md={12}>
              <div className="mt-3 mb-4">
                <details>
                  <summary style={{ cursor: 'pointer', color: 'black', fontWeight: 'bold' }}>
                    Available Template Keywords
                  </summary>
                  <div className="mt-2 p-2" style={{ backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                    {availableKeywords.map((kw, index) => (
                      <div key={index} className="mb-2">
                        <code style={{ 
                          backgroundColor: '#155216', 
                          color: 'white', 
                          padding: '2px 6px', 
                          borderRadius: '4px',
                          fontFamily: 'monospace'
                        }}>
                          {kw.keyword}
                        </code>
                        <span className="ms-2 text-muted">{kw.description}</span>
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            </Col>
          </Row>

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
                  {useNumberRevisions && (
                    <li>
                      <strong>Major revision starts at:</strong> {revisionStartAtOne ? "1" : "0"}
                    </li>
                  )}
                  <li>
                    <strong>Part Number Template:</strong> {renderTemplateWithHighlights(fullPartNumberTemplate)}
                  </li>
                  <li>
                    <strong>Standalone Revision Template:</strong> {renderTemplateWithHighlights(formattedRevisionTemplate)}
                  </li>
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
