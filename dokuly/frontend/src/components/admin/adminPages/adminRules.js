import React, { useState, useEffect } from "react";
import { Row, Col, Card } from "react-bootstrap";
import DokulyCard from "../../dokuly_components/dokulyCard";
import DokulyCheckFormGroup from "../../dokuly_components/dokulyCheckFormGroup";
import SubmitButton from "../../dokuly_components/submitButton";
import { fetchOrganizationRules, updateOrganizationRules } from "../functions/queries";
import { toast } from "react-toastify";

const AdminRules = ({ setRefresh }) => {
  const [activeSection, setActiveSection] = useState("releaseRules");
  const [loading, setLoading] = useState(true);
  const [rulesId, setRulesId] = useState(null);

  // State for release rules
  const [requireReleasedBomItemsAssembly, setRequireReleasedBomItemsAssembly] = useState(false);
  const [requireReleasedBomItemsPCBA, setRequireReleasedBomItemsPCBA] = useState(false);
  const [requireMatchedBomItemsAssembly, setRequireMatchedBomItemsAssembly] = useState(false);
  const [requireMatchedBomItemsPCBA, setRequireMatchedBomItemsPCBA] = useState(false);
  const [requireReviewOnPart, setRequireReviewOnPart] = useState(false);
  const [requireReviewOnPcba, setRequireReviewOnPcba] = useState(false);
  const [requireReviewOnAssembly, setRequireReviewOnAssembly] = useState(false);
  const [requireReviewOnDocument, setRequireReviewOnDocument] = useState(false);
  const [requireReviewOnEco, setRequireReviewOnEco] = useState(false);
  const [requireAllAffectedItemsReviewedForEco, setRequireAllAffectedItemsReviewedForEco] = useState(false);
  const [requireBomItemsReleasedOrInEco, setRequireBomItemsReleasedOrInEco] = useState(false);
  const [requireBomItemsMatchedForEcoAssembly, setRequireBomItemsMatchedForEcoAssembly] = useState(false);
  const [requireBomItemsMatchedForEcoPcba, setRequireBomItemsMatchedForEcoPcba] = useState(false);
  const [overridePermission, setOverridePermission] = useState("Admin");

  const sections = [
    { id: "suppliers", title: "Suppliers & Manufacturers", icon: "factory", disabled: true },
    { id: "countryOfOrigin", title: "Country of Origin", icon: "map", disabled: true },
    { id: "partValidation", title: "Part Validation", icon: "puzzle", disabled: true },
    { id: "releaseRules", title: "Release Rules", icon: "clipboard-check", disabled: false },
  ];

  // Load rules on component mount
  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = () => {
    setLoading(true);
    fetchOrganizationRules()
      .then((res) => {
        if (res.status === 200 && res.data) {
          setRulesId(res.data.id);
          setRequireReleasedBomItemsAssembly(res.data.require_released_bom_items_assembly || false);
          setRequireReleasedBomItemsPCBA(res.data.require_released_bom_items_pcba || false);
          setRequireMatchedBomItemsAssembly(res.data.require_matched_bom_items_assembly || false);
          setRequireMatchedBomItemsPCBA(res.data.require_matched_bom_items_pcba || false);
          setRequireReviewOnPart(res.data.require_review_on_part || false);
          setRequireReviewOnPcba(res.data.require_review_on_pcba || false);
          setRequireReviewOnAssembly(res.data.require_review_on_assembly || false);
          setRequireReviewOnDocument(res.data.require_review_on_document || false);
          setRequireReviewOnEco(res.data.require_review_on_eco || false);
          setRequireAllAffectedItemsReviewedForEco(res.data.require_all_affected_items_reviewed_for_eco || false);
          setRequireBomItemsReleasedOrInEco(res.data.require_bom_items_released_or_in_eco || false);
          setRequireBomItemsMatchedForEcoAssembly(res.data.require_bom_items_matched_for_eco_assembly || false);
          setRequireBomItemsMatchedForEcoPcba(res.data.require_bom_items_matched_for_eco_pcba || false);
          setOverridePermission(res.data.override_permission || "Admin");
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading rules:", err);
        toast.error("Failed to load rules");
        setLoading(false);
      });
  };

  const handleSubmit = () => {
    const data = {
      require_released_bom_items_assembly: requireReleasedBomItemsAssembly,
      require_released_bom_items_pcba: requireReleasedBomItemsPCBA,
      require_matched_bom_items_assembly: requireMatchedBomItemsAssembly,
      require_matched_bom_items_pcba: requireMatchedBomItemsPCBA,
      require_review_on_part: requireReviewOnPart,
      require_review_on_pcba: requireReviewOnPcba,
      require_review_on_assembly: requireReviewOnAssembly,
      require_review_on_document: requireReviewOnDocument,
      require_review_on_eco: requireReviewOnEco,
      require_all_affected_items_reviewed_for_eco: requireAllAffectedItemsReviewedForEco,
      require_bom_items_released_or_in_eco: requireBomItemsReleasedOrInEco,
      require_bom_items_matched_for_eco_assembly: requireBomItemsMatchedForEcoAssembly,
      require_bom_items_matched_for_eco_pcba: requireBomItemsMatchedForEcoPcba,
      override_permission: overridePermission,
    };

    updateOrganizationRules(data)
      .then((res) => {
        if (res.status === 200) {
          toast.success("Rules updated successfully");
          if (setRefresh) {
            setRefresh(true);
          }
        }
      })
      .catch((err) => {
        console.error("Error updating rules:", err);
        toast.error("Failed to update rules");
      });
  };

  const renderSuppliers = () => {
    return (
      <DokulyCard title="Suppliers & Manufacturers Rules">
        <div className="p-3">
          <h5>Coming Soon</h5>
          <p className="text-muted">
            Configure suppliers and manufacturers that require warnings or blocking.
            This feature is under development.
          </p>
        </div>
      </DokulyCard>
    );
  };

  const renderCountryOfOrigin = () => {
    return (
      <DokulyCard title="Country of Origin Rules">
        <div className="p-3">
          <h5>Coming Soon</h5>
          <p className="text-muted">
            Configure countries of origin that require warnings or blocking.
            This feature is under development.
          </p>
        </div>
      </DokulyCard>
    );
  };

  const renderPartValidation = () => {
    return (
      <DokulyCard title="Part Validation Rules">
        <div className="p-3">
          <h5>Coming Soon</h5>
          <p className="text-muted">
            Configure validation rules for parts, PCBAs, and assemblies.
            This feature is under development.
          </p>
        </div>
      </DokulyCard>
    );
  };

  const renderReleaseRules = () => {
    return (
      <DokulyCard title="Release Rules Configuration">
        <div className="p-3">
          <h5>Release Process Rules</h5>
          <p className="text-muted">
            Configure requirements for releasing assemblies and PCBAs.
          </p>
          
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border" role="status">
                <span className="sr-only">Loading...</span>
              </div>
            </div>
          ) : (
            <>
              <div className="mt-4">
                <h6>BOM Item Requirements</h6>
                <DokulyCheckFormGroup
                  label="Require all BOM items to be released before releasing Assembly"
                  value={requireReleasedBomItemsAssembly}
                  onChange={setRequireReleasedBomItemsAssembly}
                  id="requireReleasedBomItemsAssembly"
                />
                <DokulyCheckFormGroup
                  label="Require all BOM items to be released before releasing PCBA"
                  value={requireReleasedBomItemsPCBA}
                  onChange={setRequireReleasedBomItemsPCBA}
                  id="requireReleasedBomItemsPCBA"
                />
                <DokulyCheckFormGroup
                  label="Require all BOM items to be matched to a Part, PCBA, or Assembly before releasing Assembly"
                  value={requireMatchedBomItemsAssembly}
                  onChange={setRequireMatchedBomItemsAssembly}
                  id="requireMatchedBomItemsAssembly"
                />
                <DokulyCheckFormGroup
                  label="Require all BOM items to be matched to a Part, PCBA, or Assembly before releasing PCBA"
                  value={requireMatchedBomItemsPCBA}
                  onChange={setRequireMatchedBomItemsPCBA}
                  id="requireMatchedBomItemsPCBA"
                />
              </div>

              <div className="mt-4">
                <h6>Review Requirements</h6>
                <DokulyCheckFormGroup
                  label="Require review approval before releasing Part"
                  value={requireReviewOnPart}
                  onChange={setRequireReviewOnPart}
                  id="requireReviewOnPart"
                />
                <DokulyCheckFormGroup
                  label="Require review approval before releasing PCBA"
                  value={requireReviewOnPcba}
                  onChange={setRequireReviewOnPcba}
                  id="requireReviewOnPcba"
                />
                <DokulyCheckFormGroup
                  label="Require review approval before releasing Assembly"
                  value={requireReviewOnAssembly}
                  onChange={setRequireReviewOnAssembly}
                  id="requireReviewOnAssembly"
                />
                <DokulyCheckFormGroup
                  label="Require review approval before releasing Document"
                  value={requireReviewOnDocument}
                  onChange={setRequireReviewOnDocument}
                  id="requireReviewOnDocument"
                />
              </div>

              <div className="mt-4">
                <h6>ECO Requirements</h6>
                <DokulyCheckFormGroup
                  label="Require review approval before releasing ECO"
                  value={requireReviewOnEco}
                  onChange={setRequireReviewOnEco}
                  id="requireReviewOnEco"
                />
                <DokulyCheckFormGroup
                  label="Require all affected items to be reviewed before releasing ECO"
                  value={requireAllAffectedItemsReviewedForEco}
                  onChange={setRequireAllAffectedItemsReviewedForEco}
                  id="requireAllAffectedItemsReviewedForEco"
                />
                <DokulyCheckFormGroup
                  label="Require BOM items of affected Assemblies/PCBAs to be released or included in the ECO"
                  value={requireBomItemsReleasedOrInEco}
                  onChange={setRequireBomItemsReleasedOrInEco}
                  id="requireBomItemsReleasedOrInEco"
                />
                <DokulyCheckFormGroup
                  label="Require all BOM items of affected Assemblies to be matched to a Part, PCBA, or Assembly"
                  value={requireBomItemsMatchedForEcoAssembly}
                  onChange={setRequireBomItemsMatchedForEcoAssembly}
                  id="requireBomItemsMatchedForEcoAssembly"
                />
                <DokulyCheckFormGroup
                  label="Require all BOM items of affected PCBAs to be matched to a Part, PCBA, or Assembly"
                  value={requireBomItemsMatchedForEcoPcba}
                  onChange={setRequireBomItemsMatchedForEcoPcba}
                  id="requireBomItemsMatchedForEcoPcba"
                />
              </div>

              <div className="mt-4">
                <h6>Override Permissions</h6>
                <div className="form-group">
                  <label>Who can override these rules:</label>
                  <select 
                    className="form-control" 
                    value={overridePermission}
                    onChange={(e) => setOverridePermission(e.target.value)}
                  >
                    <option value="Owner">Owner</option>
                    <option value="Admin">Admin</option>
                    <option value="Project Owner">Project Owner</option>
                    <option value="User">User</option>
                  </select>
                  <small className="text-muted">
                    Selected role and above can override release rules when needed.
                  </small>
                </div>
              </div>

              <div className="mt-4">
                <SubmitButton 
                  onClick={handleSubmit}
                  disabled={loading}
                  disabledTooltip="Loading..."
                >
                  Save Rules
                </SubmitButton>
              </div>
            </>
          )}
        </div>
      </DokulyCard>
    );
  };

  const renderSectionContent = () => {
    switch (activeSection) {
      case "suppliers":
        return renderSuppliers();
      case "countryOfOrigin":
        return renderCountryOfOrigin();
      case "partValidation":
        return renderPartValidation();
      case "releaseRules":
        return renderReleaseRules();
      default:
        return renderSuppliers();
    }
  };

  return (
    <div className="container-fluid mt-4">
      <Row>
        <Col md={3}>
          <DokulyCard>
            <Card.Header className="bg-light">
              <h5 className="mb-0">Rules Sections</h5>
            </Card.Header>
            <Card.Body className="p-0">
              <div className="list-group list-group-flush">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    className={`list-group-item list-group-item-action ${
                      activeSection === section.id ? "dokuly-bg-primary text-white" : ""
                    } ${section.disabled ? "disabled" : ""}`}
                    onClick={() => !section.disabled && setActiveSection(section.id)}
                    disabled={section.disabled}
                    style={{
                      cursor: section.disabled ? "not-allowed" : "pointer",
                      opacity: section.disabled ? 0.6 : 1
                    }}
                  >
                    <img
                      src={`../../static/icons/${section.icon}.svg`}
                      alt={section.title}
                      width="20"
                      height="20"
                      className="me-2"
                      style={{ 
                        marginRight: "8px",
                        filter: activeSection === section.id ? "brightness(0) invert(1)" : "none"
                      }}
                    />
                    {section.title}
                    {section.disabled && (
                      <span className="badge bg-warning text-dark ms-2">Coming Soon</span>
                    )}
                  </button>
                ))}
              </div>
            </Card.Body>
          </DokulyCard>

          <DokulyCard>
            <Card.Body>
              <h6>About Rules</h6>
              <p className="text-muted small">
                Rules help ensure your parts, assemblies, and releases
                meet your organization's requirements. Configure warnings and
                blocking rules with optional overrides.
              </p>
            </Card.Body>
          </DokulyCard>
        </Col>

        <Col md={9}>
          {renderSectionContent()}
        </Col>
      </Row>
    </div>
  );
};

export default AdminRules;
