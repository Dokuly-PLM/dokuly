import React, { useState } from "react";
import { Row, Col, Card } from "react-bootstrap";
import DokulyCard from "../../dokuly_components/dokulyCard";
import DokulyCheckFormGroup from "../../dokuly_components/dokulyCheckFormGroup";

const AdminRules = ({ setRefresh }) => {
  const [activeSection, setActiveSection] = useState("suppliers");

  // State for all checkboxes
  const [warnFlaggedSuppliers, setWarnFlaggedSuppliers] = useState(false);
  const [blockFlaggedSuppliers, setBlockFlaggedSuppliers] = useState(false);
  const [warnMissingSupplier, setWarnMissingSupplier] = useState(false);
  const [warnRestrictedCountry, setWarnRestrictedCountry] = useState(false);
  const [blockRestrictedCountry, setBlockRestrictedCountry] = useState(false);
  const [warnMissingMPN, setWarnMissingMPN] = useState(false);
  const [blockMissingMPN, setBlockMissingMPN] = useState(false);
  const [checkBOMCompliance, setCheckBOMCompliance] = useState(false);
  const [cascadeWarnings, setCascadeWarnings] = useState(false);
  const [logOverrides, setLogOverrides] = useState(true);
  const [requireOverrideReason, setRequireOverrideReason] = useState(false);

  const sections = [
    { id: "suppliers", title: "Suppliers & Manufacturers", icon: "factory" },
    { id: "countryOfOrigin", title: "Country of Origin", icon: "map" },
    { id: "partValidation", title: "Part Validation", icon: "puzzle" },
    { id: "releaseRules", title: "Release Rules", icon: "clipboard-check" },
  ];

  const renderSuppliers = () => {
    return (
      <DokulyCard title="Suppliers & Manufacturers Rules">
        <div className="p-3">
          <h5>Flagged Suppliers & Manufacturers</h5>
          <p className="text-muted">
            Configure suppliers and manufacturers that require warnings or blocking.
          </p>
          
          <div className="mt-4">
            <h6>Settings</h6>
            <DokulyCheckFormGroup
              label="Warn when using flagged suppliers"
              value={warnFlaggedSuppliers}
              onChange={setWarnFlaggedSuppliers}
              id="warnFlaggedSuppliers"
            />
            <DokulyCheckFormGroup
              label="Block release with flagged suppliers (with override)"
              value={blockFlaggedSuppliers}
              onChange={setBlockFlaggedSuppliers}
              id="blockFlaggedSuppliers"
            />
            <DokulyCheckFormGroup
              label="Warn when supplier is missing"
              value={warnMissingSupplier}
              onChange={setWarnMissingSupplier}
              id="warnMissingSupplier"
            />
          </div>

          <div className="mt-4">
            <button className="btn dokuly-bg-primary text-white">
              Manage Flagged Suppliers
            </button>
          </div>
        </div>
      </DokulyCard>
    );
  };

  const renderCountryOfOrigin = () => {
    return (
      <DokulyCard title="Country of Origin Rules">
        <div className="p-3">
          <h5>Restricted Countries</h5>
          <p className="text-muted">
            Configure countries of origin that require warnings or blocking.
          </p>
          
          <div className="mt-4">
            <h6>Settings</h6>
            <DokulyCheckFormGroup
              label="Warn when parts from restricted countries are used"
              value={warnRestrictedCountry}
              onChange={setWarnRestrictedCountry}
              id="warnRestrictedCountry"
            />
            <DokulyCheckFormGroup
              label="Block release with parts from restricted countries (with override)"
              value={blockRestrictedCountry}
              onChange={setBlockRestrictedCountry}
              id="blockRestrictedCountry"
            />
          </div>

          <div className="mt-4">
            <button className="btn dokuly-bg-primary text-white">
              Manage Restricted Countries
            </button>
          </div>
        </div>
      </DokulyCard>
    );
  };

  const renderPartValidation = () => {
    return (
      <DokulyCard title="Part Validation Rules">
        <div className="p-3">
          <h5>Part Requirements</h5>
          <p className="text-muted">
            Configure validation rules for parts, PCBAs, and assemblies.
          </p>
          
          <div className="mt-4">
            <h6>MPN Requirements</h6>
            <DokulyCheckFormGroup
              label="Warn when MPN is missing (placeholder parts)"
              value={warnMissingMPN}
              onChange={setWarnMissingMPN}
              id="warnMissingMPN"
            />
            <DokulyCheckFormGroup
              label="Block release when MPN is missing (with override)"
              value={blockMissingMPN}
              onChange={setBlockMissingMPN}
              id="blockMissingMPN"
            />
          </div>

          <div className="mt-4">
            <h6>Assembly Validation</h6>
            <DokulyCheckFormGroup
              label="Check BOM items for compliance issues"
              value={checkBOMCompliance}
              onChange={setCheckBOMCompliance}
              id="checkBOMCompliance"
            />
            <DokulyCheckFormGroup
              label="Show warnings from BOM items in assembly overview"
              value={cascadeWarnings}
              onChange={setCascadeWarnings}
              id="cascadeWarnings"
            />
          </div>
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
            Configure what can block or warn during the release process.
          </p>
          
          <div className="mt-4">
            <h6>Override Permissions</h6>
            <div className="form-group">
              <label>Roles that can override blocking rules:</label>
              <select className="form-control" multiple>
                <option value="admin">Admin</option>
                <option value="owner">Owner</option>
                <option value="qa">Quality Assurance</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <h6>Audit Trail</h6>
            <DokulyCheckFormGroup
              label="Log all compliance rule overrides"
              value={logOverrides}
              onChange={setLogOverrides}
              id="logOverrides"
            />
            <DokulyCheckFormGroup
              label="Require reason when overriding rules"
              value={requireOverrideReason}
              onChange={setRequireOverrideReason}
              id="requireOverrideReason"
            />
          </div>
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
                    }`}
                    onClick={() => setActiveSection(section.id)}
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
