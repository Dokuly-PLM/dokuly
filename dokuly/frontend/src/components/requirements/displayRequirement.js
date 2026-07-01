import React, { useState, useEffect, useContext } from "react";
import { Row, Col, Form } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import {
  editRequirement,
  getRequirement,
  getRequirementSet,
  getRequirementsBySet,
  getRequirementsByParent,
} from "./functions/queries";
import DokulyCard from "../dokuly_components/dokulyCard";
import EditableMarkdown from "../dokuly_components/dokulyMarkdown/editableMarkdown";
import RequirementsTable from "./requirementsTable";
import CardTitle from "../dokuly_components/cardTitle";
import RequirementInfoCard from "./components/requirementInfoCard";
import RequirementDocumentReferenceSelector from "./components/requirementDocumentReferenceSelector";
import Heading from "../dokuly_components/Heading";
import { formatPDFViewerURL } from "../common/functions";
import { getFile } from "../common/filesTable/functions/queries";
import { DEFAULT_REQUIREMENT_SET_SETTINGS } from "./modelConstants";

import useProfile from "../common/hooks/useProfile";
import { checkProfileIsAllowedToEdit } from "../common/functions";
import RequirementDependencyGraph from "./components/requirementDependencyGraph";
import { AuthContext } from "../App";
import UserProfileCard from "../dokuly_components/userProfileCard";

const DisplayRequirement = (props) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, refreshProfile] = useProfile();
  const { isAuthenticated, setIsAuthenticated } = useContext(AuthContext);
  const [readOnly, setReadOnly] = useState(false);
  useEffect(() => {
    if (profile === null || profile === undefined) {
      return;
    }
    const isAllowed = checkProfileIsAllowedToEdit(profile?.role);
    setReadOnly(!isAllowed);
  }, [profile]);

  const [id, setId] = useState(-1);
  useEffect(() => {
    const url = window.location.href.toString();
    const split = url.split("/");
    setId(Number.parseInt(split[5]));
  }, [location]);

  const [refresh, setRefresh] = useState(false);
  const [requirement, setRequirement] = useState(null);
  const [requirementSet, setRequirementSet] = useState(null);
  const [requirements, setRequirements] = useState([]); // All requirements in set
  const [subRequirements, setSubRequirements] = useState([]);
  const [project, setProject] = useState(null);
  const [selectedReference, setSelectedReference] = useState(null);
  const [previewPdfUrl, setPreviewPdfUrl] = useState(null);

  function refetch() {
    getRequirement(id).then((res) => {
      if (res.status === 200 && res.data !== null) {
        setRequirement(res.data);
      }
    });
    getRequirementsByParent(id).then((res) => {
      if (res.status === 200 && res.data !== null) {
        setSubRequirements(res.data);
      }
    });
  }

  useEffect(() => {
    if (requirement) {
      getRequirementsBySet(requirement?.requirement_set).then((res) => {
        if (res.status === 200 && res.data !== null) {
          setRequirements(res.data);
        }
      });
    }
  }, [requirement]);

  useEffect(() => {
    if (refresh === false && requirement !== null) {
      return;
    }
    if (id === null || id === -1) {
      return;
    }
    document.title = "Requirements | Dokuly";

    refetch();

    setRefresh(false);
  }, [refresh]);

  useEffect(() => {
    if (id === null || id === -1) {
      return;
    }
    refetch();
  }, [id]);

  useEffect(() => {
    if (
      requirement?.requirement_set === null ||
      requirement?.requirement_set === undefined
    ) {
      return;
    }
    getRequirementSet(requirement?.requirement_set).then((res) => {
      if (res.status === 200 && res.data !== null) {
        setRequirementSet(res.data);
        setProject(res.data?.project);
      }
    });
  }, [requirement]);

  const [verificationHiddenText, setVerificationHiddenText] = useState(
    "No verification data available"
  );

  useEffect(() => {
    if (requirement?.superseded_by) {
      setVerificationHiddenText("Requirement superseded by another requirement");
    } else if (subRequirements?.length > 0) {
      setVerificationHiddenText(
        "Verification: Requirement superseded by its subrequirements"
      );
    } else {
      setVerificationHiddenText("No verification data available");
    }
  }, [subRequirements, requirement]);

  const handleStatementSubmit = (text) => {
    updateTextField(text, "statement");
  };
  const handleRationaleSubmit = (text) => {
    updateTextField(text, "rationale");
  };
  const updateTextField = (text, model_field) => {
    const data = {
      [model_field]: text, // Correct way to use variable as an object key
    };
    editRequirement(id, data).then(
      (result) => {
        if (result.status === 200) {
          setRefresh(true);
        }
      },
      (error) => {
        toast.error(error); // Proper error handling
      }
    );
  };

  useEffect(() => {
    if (requirement) {
      document.title = `Requirement ${requirement?.id} | Dokuly`;
    } else {
      document.title = "Requirements | Dokuly";
    }
  }, [requirement]);

  useEffect(() => {
    const statementReferences = requirement?.statement_references || [];
    const verificationReferences = requirement?.verification_references || [];
    const allReferences = [...verificationReferences, ...statementReferences];

    const defaultReference =
      verificationReferences.find((reference) => Boolean(reference?.pdf_print_id)) ||
      verificationReferences[0] ||
      statementReferences[0] ||
      null;

    if (allReferences.length === 0) {
      setSelectedReference(null);
      return;
    }

    if (!selectedReference?.document_id) {
      setSelectedReference(defaultReference);
      return;
    }

    const updatedSelected = allReferences.find(
      (reference) => reference.document_id === selectedReference.document_id
    );

    if (updatedSelected) {
      setSelectedReference(updatedSelected);
    } else {
      setSelectedReference(defaultReference);
    }
  }, [requirement?.statement_references, requirement?.verification_references]);

  useEffect(() => {
    let currentBlobUrl = null;

    if (!selectedReference?.document_id) {
      setPreviewPdfUrl(null);
      return () => {};
    }

    const pdfUrl = formatPDFViewerURL(selectedReference.document_id, "pdf");
    getFile(pdfUrl)
      .then((blob) => {
        currentBlobUrl = URL.createObjectURL(blob);
        setPreviewPdfUrl(currentBlobUrl);
      })
      .catch(() => {
        setPreviewPdfUrl(null);
      });

    return () => {
      if (currentBlobUrl) {
        URL.revokeObjectURL(currentBlobUrl);
      }
    };
  }, [selectedReference?.document_id]);

  const hasStatementReferences = (requirement?.statement_references || []).length > 0;
  const hasVerificationReferences = (requirement?.verification_references || []).length > 0;
  const hasAnyReferences = hasStatementReferences || hasVerificationReferences;

  const selectedPage = Number.parseInt(selectedReference?.page_number, 10);
  const pageNumber = Number.isNaN(selectedPage) || selectedPage < 1 ? 1 : selectedPage;
  const isRequirementLocked = requirement?.state === "Approved" || requirement?.state === "Rejected";
  const hasStatementText = Boolean((requirement?.statement || "").trim());
  const requirementSetSettings = {
    ...DEFAULT_REQUIREMENT_SET_SETTINGS,
    hierarchical_requirements_is_enabled:
      requirementSet?.hierarchical_requirements_is_enabled ?? true,
    derived_from_enabled: requirementSet?.derived_from_enabled ?? true,
    superseded_by_is_enabled: requirementSet?.superseded_by_is_enabled ?? true,
    external_requirement_id_is_enabled:
      requirementSet?.external_requirement_id_is_enabled ?? true,
    requirement_type_is_enabled: requirementSet?.requirement_type_is_enabled ?? true,
    verification_class_is_enabled: requirementSet?.verification_class_is_enabled ?? true,
    created_by_is_visible: requirementSet?.created_by_is_visible ?? true,
    verification_method_markdown_is_enabled:
      requirementSet?.verification_method_markdown_is_enabled ?? true,
    verification_results_markdown_is_enabled:
      requirementSet?.verification_results_markdown_is_enabled ?? true,
  };
  const showDependenciesCard =
    requirementSetSettings.hierarchical_requirements_is_enabled ||
    requirementSetSettings.derived_from_enabled ||
    requirementSetSettings.superseded_by_is_enabled;

  return (
    <div
      className="container-fluid mt-2 mainContainerWidth"
      style={{ paddingBottom: "1rem" }}
    >
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: No need for btn here */}
      <img
        className="icon-dark p-2 arrow-back"
        onClick={() => navigate(`/requirements/set/${requirementSet?.id}`)}
        src="../../static/icons/arrow-left.svg"
        alt="Arrow Icon"
      />
      <Heading
        item_number={requirementSet?.display_name}
        display_name={`Requirement ${requirement?.id || ""}`}
        app="requirements"
      />

      <Row>
        <Col lg={hasAnyReferences ? 6 : 12}>
          <RequirementInfoCard
            item={requirement}
            number_of_subrequirements={subRequirements.length}
            setRefresh={setRefresh}
            refresh={refresh}
            readOnly={readOnly}
            project={project}
            requirementSetSettings={requirementSetSettings}
          />

          {showDependenciesCard && (
            <RequirementDependencyGraph
              requirement={requirement}
              requirement_set={requirements}
            />
          )}

          <DokulyCard
            isCollapsed={requirement?.rationale === ""}
            expandText={"Add rationale"}
            isHidden={requirement?.rationale === "" && readOnly}
            hiddenText={"No rationale exist for this requirement"}
          >
            <CardTitle
              titleText={"Rationale"}
              optionalHelpText={
                " The rationale field is crucial for capturing and communicating the underlying reasons or justification for a specific requirement. This field typically explains why the requirement is necessary, detailing its importance and relevance to the overall system objectives and success. "
              }
            />
            <EditableMarkdown
              initialMarkdown={requirement?.rationale || ""}
              onSubmit={handleRationaleSubmit}
              showEmptyBorder={true}
              readOnly={readOnly || requirement?.state === "Approved" || requirement?.state === "Rejected" }
            />
          </DokulyCard>

          <DokulyCard>
            <CardTitle
              titleText={"Statement"}
              optionalHelpText={"A sentence stating the requirement."}
            />
            {isRequirementLocked && !hasStatementText ? (
              <small className="text-muted">No statement added.</small>
            ) : (
              <EditableMarkdown
                initialMarkdown={requirement?.statement || ""}
                onSubmit={handleStatementSubmit}
                showEmptyBorder={true}
                readOnly={readOnly || isRequirementLocked}
              />
            )}
            <div className="mt-3">
              <CardTitle
                titleText={"References"}
                optionalHelpText={"Attach documents referenced by the requirement statement. Page numbers can be set per document."}
              />
              <RequirementDocumentReferenceSelector
                requirement={requirement}
                readOnly={readOnly || isRequirementLocked}
                setRefresh={setRefresh}
                selectedDocumentId={selectedReference?.document_id}
                onSelectReference={setSelectedReference}
                referenceField="statement_references"
                referenceType="statement"
              />
            </div>
          </DokulyCard>

          {requirementSetSettings.hierarchical_requirements_is_enabled && (
              <DokulyCard
                isCollapsed={subRequirements.length === 0}
                expandText={"Add subrequirement"}
                isHidden={
                  (subRequirements.length === 0 && readOnly) ||
                  (subRequirements.length === 0 && requirement?.superseded_by)
                }
                hiddenText={requirement?.superseded_by? "Requirement superseded by another requirement" : "Requirement has no subrequirements"}
              >
                <CardTitle
                  titleText={"Subrequirements"}
                  optionalHelpText={
                    "Requirement decomposition involves breaking down a requirement into two or more subrequirements. These subrequirements provide explicit or more detailed coverage of the original requirement. Together, they fully encompass the scope of the parent requirement, effectively making it obsolete."
                  }
                />
                <div style={{ paddingLeft: "10px", paddingRight: "10px" }}>
                  <RequirementsTable
                    requirements={subRequirements}
                    parent_requirement_id={id}
                    set_id={requirement?.requirement_set}
                    setRefresh={setRefresh}
                    refresh={refresh}
                    readOnly={readOnly}
                    profile={profile}
                    requirementSetSettings={requirementSetSettings}
                  />
                </div>
              </DokulyCard>
            )
          }
          

          <DokulyCard
            isCollapsed={
              requirement?.verification_method === "" &&
              requirement?.verification_results === "" &&
              !hasVerificationReferences
            }
            expandText={"Verify compliance"}
            isHidden={
              (requirement?.verification_method === "" &&
                requirement?.verification_results === "" &&
                !hasVerificationReferences &&
                readOnly) ||
              (requirement?.verification_method === "" &&
                requirement?.verification_results === "" &&
                !hasVerificationReferences &&
                subRequirements?.length > 0) ||
              (requirement?.verification_method === "" &&
                requirement?.verification_results === "" &&
                !hasVerificationReferences &&
                requirement?.superseded_by)
            }
            hiddenText={verificationHiddenText}
          >
            
            {requirementSetSettings.verification_method_markdown_is_enabled && (
              <>
                <CardTitle
                  titleText={"Verification"}
                  optionalHelpText={
                    "Document how the requirement will be verified. This can include test cases, test plans, or other verification methods. After verification, the results can be documented here."
                  }
                />
                <Row className="d-flex align-items-center">
                  <Col className="col-2">
                    <h6
                      style={{
                        marginLeft: "15px",
                        marginTop: "10px",
                        marginBot: "5px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <b>Method of {requirement?.verification_class}</b>
                    </h6>
                  </Col>
                </Row>
                <EditableMarkdown
                  initialMarkdown={requirement?.verification_method || ""}
                  onSubmit={(text) => {
                    updateTextField(text, "verification_method");
                  }}
                  showEmptyBorder={true}
                  readOnly={readOnly}
                />
              </>
            )}

            {requirementSetSettings.verification_results_markdown_is_enabled && (
              <>
                <h6 style={{ marginLeft: "15px", marginTop: "10px" }}>
                  <b>Results</b>
                </h6>
                <EditableMarkdown
                  initialMarkdown={requirement?.verification_results || ""}
                  onSubmit={(text) => {
                    updateTextField(text, "verification_results");
                  }}
                  showEmptyBorder={true}
                  readOnly={readOnly}
                />
              </>
            )}

  
            <div className="mt-3">
              <CardTitle
                titleText={"Verification References"}
                optionalHelpText={"Attach documents or reports as verification evidence."}
              />
              <RequirementDocumentReferenceSelector
                requirement={requirement}
                readOnly={readOnly || requirement?.state === "Rejected"}
                setRefresh={setRefresh}
                selectedDocumentId={selectedReference?.document_id}
                onSelectReference={setSelectedReference}
                referenceField="verification_references"
                referenceType="verification"
              />
            </div>
          

            <Row className="mt-3 justify-content-center align-items-center">
              <Col className="col-auto">
                <div
                  className="p-3 border rounded text-left"
                  style={{ maxWidth: "200px", whiteSpace: "nowrap" }}
                >
                  {requirement?.is_verified ? "" : "Sign off verification:"}

                  <Form.Group className="align-items-center">
                    <Form.Check
                      type="checkbox"
                      id="is_verified"
                      label={
                        requirement?.is_verified ? "Verified:" : "Verified"
                      }
                      className="dokuly-checkbox"
                      checked={requirement?.is_verified}
                      disabled={readOnly}
                      onChange={(e) => {
                        const data = {
                          is_verified: e.target.checked,
                          verified_by: profile?.id,
                        };
                        editRequirement(id, data).then(
                          (result) => {
                            if (result.status === 200) {
                              setRefresh(true);
                            }
                          },
                          (error) => {
                            toast.error(error);
                          }
                        );
                      }}
                    />
                  </Form.Group>
                </div>
              </Col>
              <Col className="col-4">
                {requirement?.is_verified && <UserProfileCard profile={profile} />}
              </Col>
            </Row>
          </DokulyCard>
        </Col>
        {hasAnyReferences && (
          <Col lg={6}>
            <DokulyCard>
              <CardTitle
                titleText={"Reference Preview"}
                optionalHelpText={"Preview of the selected referenced document PDF."}
              />
              <div style={{ marginBottom: "8px" }}>
                <small className="text-muted">
                  {selectedReference?.full_doc_number || "Document"}
                  {selectedReference?.title ? ` - ${selectedReference.title}` : ""}
                </small>
              </div>
              {previewPdfUrl ? (
                <iframe
                  id="requirement-reference-preview"
                  src={`${previewPdfUrl}#page=${pageNumber}&zoom=page-fit`}
                  width="100%"
                  height="1200px"
                  title="Requirement reference PDF preview"
                  style={{ border: "1px solid #e5e5e5", borderRadius: "4px" }}
                />
              ) : (
                <small className="text-muted">
                  No PDF preview available for the selected document.
                </small>
              )}
            </DokulyCard>
          </Col>
        )}
      </Row>
    </div>
  );
};

export default DisplayRequirement;
