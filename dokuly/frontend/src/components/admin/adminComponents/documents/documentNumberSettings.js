import React, { useState, useEffect } from "react";
import { Form, Row, Col, Dropdown } from "react-bootstrap";
import { editOrg, previewDocumentNumberTemplate } from "../../functions/queries";
import { toast } from "react-toastify";
import SubmitButton from "../../../dokuly_components/submitButton";
import CheckBox from "../../../dokuly_components/checkBox";
import DokulyDropdown from "../../../dokuly_components/dokulyDropdown";
import QuestionToolTip from "../../../dokuly_components/questionToolTip";

const DocumentNumberSettings = ({ org, setRefresh }) => {
  const [useNumberRevisions, setUseNumberRevisions] = useState(
    org?.document_use_number_revisions || false
  );
  const [revisionFormat, setRevisionFormat] = useState(
    org?.document_revision_format || "major-minor"
  );
  const [revisionStartAtOne, setRevisionStartAtOne] = useState(
    org?.document_start_major_revision_at_one || false
  );
  const [fullDocumentNumberTemplate, setFullDocumentNumberTemplate] = useState(
    org?.full_document_number_template || "<prefix><project_number>-<document_number><revision>"
  );
  const [isUpdating, setIsUpdating] = useState(false);
  const [previewExamples, setPreviewExamples] = useState([]);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // Update state when org prop changes
  useEffect(() => {
    if (org) {
      setUseNumberRevisions(org.document_use_number_revisions || false);
      setRevisionFormat(org.document_revision_format || "major-minor");
      setRevisionStartAtOne(org.document_start_major_revision_at_one || false);
      setFullDocumentNumberTemplate(org.full_document_number_template || "<prefix><project_number>-<document_number><revision>");
    }
  }, [org]);

  // Fetch preview from backend whenever settings change
  useEffect(() => {
    const fetchPreview = async () => {
      setIsLoadingPreview(true);
      try {
        const response = await previewDocumentNumberTemplate({
          template: fullDocumentNumberTemplate,
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
  }, [fullDocumentNumberTemplate, useNumberRevisions, revisionStartAtOne, revisionFormat]);

  const handleSave = async () => {
    if (!org || !org.id) {
      toast.error("Organization not found. Please refresh the page.");
      return;
    }

    setIsUpdating(true);
    try {
      const data = {
        full_document_number_template: fullDocumentNumberTemplate,
        document_use_number_revisions: useNumberRevisions,
        document_revision_format: revisionFormat,
        document_start_major_revision_at_one: revisionStartAtOne,
      };

      const response = await editOrg(org.id, data);
      
      if (response.status === 200) {
        toast.success("Document numbering settings updated successfully.");
        setRefresh(true);
      } else {
        toast.error("Failed to update document numbering settings.");
      }
    } catch (error) {
      console.error("Error updating document numbering settings:", error);
      toast.error("Failed to update document numbering settings.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReset = () => {
    setFullDocumentNumberTemplate(org?.full_document_number_template || "<prefix><project_number>-<document_number><revision>");
    setUseNumberRevisions(org?.document_use_number_revisions || false);
    setRevisionFormat(org?.document_revision_format || "major-minor");
    setRevisionStartAtOne(org?.document_start_major_revision_at_one || false);
  };

  const hasChanges = 
    fullDocumentNumberTemplate !== (org?.full_document_number_template || "<prefix><project_number>-<document_number><revision>") ||
    useNumberRevisions !== (org?.document_use_number_revisions || false) ||
    revisionFormat !== (org?.document_revision_format || "major-minor") ||
    revisionStartAtOne !== (org?.document_start_major_revision_at_one || false);

  // Available template keywords for documents
  const availableKeywords = [
    { keyword: '<prefix>', description: 'Document type prefix (TN, DOC, MAN)' },
    { keyword: '<project_number>', description: 'Project number from associated project' },
    { keyword: '<part_number>', description: 'Part number (if document is linked to a part)' },
    { keyword: '<document_number>', description: 'Per-project document counter' },
    { keyword: '<major_revision>', description: 'Major revision (A, B, C or 0, 1, 2)' },
    { keyword: '<minor_revision>', description: 'Minor revision (A, B, C or 0, 1, 2)' },
    { keyword: '<revision>', description: 'Major Revision (A, B, C or 0, 1, 2)' },
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

  // Don't render if org is not loaded yet
  if (!org) {
    return (
      <div className="card-body rounded bg-white">
        <h3 className="card-title">
          <b>Document Number Template</b>
        </h3>
        <p className="text-muted">Loading organization settings...</p>
      </div>
    );
  }

  return (
    <div className="card-body rounded bg-white">
      <h3 className="card-title">
        <b>Document Number Template</b>
      </h3>
      <p className="text-muted mb-3">
        Configure how document numbers are formatted. Documents have independent revision settings 
        from parts, allowing different formatting for each.
      </p>
        
      <Form>
        <Row>
          <Col md={12}>
            <Form.Group className="mb-3">
              <CheckBox
                id="document-use-number-revisions"
                label="Use number-based revisions for documents"
                checked={useNumberRevisions}
                onChange={(e) => setUseNumberRevisions(e.target.checked)}
              />
              <Form.Text className="text-muted">
                When enabled, document revisions will use numbers instead of letters. By default, number revisions start at 0 (0, 1, 2...), but you can configure them to start at 1 using the setting below.
              </Form.Text>
            </Form.Group>
          </Col>
        </Row>

        {useNumberRevisions && (
          <Row>
            <Col md={12}>
              <Form.Group className="mb-3">
                <CheckBox
                  id="document-revision-start-at-one"
                  label="Start document major revisions at 1"
                  checked={revisionStartAtOne}
                  onChange={(e) => setRevisionStartAtOne(e.target.checked)}
                />
                <Form.Text className="text-muted">
                  When enabled, major revisions will display starting at 1 instead of 0 (e.g., 1, 2, 3... instead of 0, 1, 2...). 
                  Minor revisions always start at 0 regardless of this setting (e.g., 1-0, 1-1, 1-2, 2-0...).
                </Form.Text>
              </Form.Group>
            </Col>
          </Row>
        )}

        <Row>
          <Col md={12}>
            <Form.Group className="mb-3">
              <Form.Label>Document Revision Format</Form.Label>
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
                Choose the format for {useNumberRevisions ? "number" : "letter"}-based document revisions. Major-minor format allows for more granular versioning with sub-revisions.
              </Form.Text>
            </Form.Group>
          </Col>
        </Row>

        <Row>
          <Col md={12}>
            <Form.Group className="mb-3">
              <Form.Label>
                Document Number Template 
                <QuestionToolTip
                  placement="right"
                  optionalHelpText={
                    "Configure how full document numbers are formatted. Available variables:\n" +
                    "• <prefix> - Document type (TN, DOC, MAN)\n" +
                    "• <project_number> - Project number from associated project\n" +
                    "• <part_number> - Part number (if linked to a part)\n" +
                    "• <document_number> - Per-project document counter\n" +
                    "• <major_revision> - Major revision (A, B, C or 0, 1, 2)\n" +
                    "• <minor_revision> - Minor revision (A, B, C or 0, 1, 2)\n" +
                    "• <revision> - Complete revision string\n" +
                    "• <day> - Day from creation date (01-31)\n" +
                    "• <month> - Month from creation date (01-12)\n" +
                    "• <year> - Year from creation date (e.g., 2025)\n\n" +
                    "Example: '<prefix><project_number>-<document_number><revision>' → 'TN1001-103A'"
                  }
                />
              </Form.Label>
              <Form.Control
                type="text"
                value={fullDocumentNumberTemplate}
                onChange={(e) => setFullDocumentNumberTemplate(e.target.value)}
                placeholder="<prefix><project_number>-<document_number><revision>"
                style={{ fontFamily: 'monospace' }}
              />
              <Form.Text className="text-muted d-block mt-2">
                Preview: {renderTemplateWithHighlights(fullDocumentNumberTemplate)}
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

        {/* Available Keywords Reference */}
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
                  <strong>Document Number Template:</strong> {renderTemplateWithHighlights(fullDocumentNumberTemplate)}
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
                disabledTooltip={!hasChanges ? "No changes to save" : "Saving template..."}
              >
                {isUpdating ? "Saving..." : "Save Template"}
              </SubmitButton>
              {hasChanges && (
                <button
                  type="button"
                  className="btn btn-outline-secondary ms-2"
                  onClick={handleReset}
                >
                  Reset
                </button>
              )}
            </div>
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default DocumentNumberSettings;
