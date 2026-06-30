import React, { useState, useEffect, useMemo } from "react";
import EditButton from "../../dokuly_components/editButton";
import DokulyModal from "../../dokuly_components/dokulyModal";
import { Form, Row, Col } from "react-bootstrap";
import { fetchProjects } from "../../projects/functions/queries";
import SubmitButton from "../../dokuly_components/submitButton";
import DeleteButton from "../../dokuly_components/deleteButton";
import DokulyCheckFormGroup from "../../dokuly_components/dokulyCheckFormGroup";
import {
  deleteRequirementsSet,
  editRequirementSet,
} from "../functions/queries";
import { useNavigate } from "react-router";
import { DEFAULT_REQUIREMENT_SET_SETTINGS } from "../modelConstants";

const EditRequirementsSetForm = ({ requirementSet, setRefresh, readOnly }) => {
  const [open, setOpen] = useState(false);
  const [requirementSetName, setRequirementSetName] = useState("");
  const [selectedProject, setSelectedProject] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [settings, setSettings] = useState(DEFAULT_REQUIREMENT_SET_SETTINGS);
  const navigate = useNavigate();

  const mergedSettings = useMemo(
    () => ({
      ...DEFAULT_REQUIREMENT_SET_SETTINGS,
      hierarchical_requirements_is_enabled:
        requirementSet?.hierarchical_requirements_is_enabled,
      derived_from_enabled: requirementSet?.derived_from_enabled,
      superseded_by_is_enabled: requirementSet?.superseded_by_is_enabled,
      external_requirement_id_is_enabled:
        requirementSet?.external_requirement_id_is_enabled,
      requirement_type_is_enabled: requirementSet?.requirement_type_is_enabled,
      verification_class_is_enabled: requirementSet?.verification_class_is_enabled,
      created_by_is_visible: requirementSet?.created_by_is_visible,
      verification_method_markdown_is_enabled:
        requirementSet?.verification_method_markdown_is_enabled,
      verification_results_markdown_is_enabled:
        requirementSet?.verification_results_markdown_is_enabled,
    }),
    [
      requirementSet?.hierarchical_requirements_is_enabled,
      requirementSet?.derived_from_enabled,
      requirementSet?.superseded_by_is_enabled,
      requirementSet?.external_requirement_id_is_enabled,
      requirementSet?.requirement_type_is_enabled,
      requirementSet?.verification_class_is_enabled,
      requirementSet?.created_by_is_visible,
      requirementSet?.verification_method_markdown_is_enabled,
      requirementSet?.verification_results_markdown_is_enabled,
    ]
  );

  const onSubmit = () => {
    editRequirementSet(requirementSet.id, {
      display_name: requirementSetName,
      ...settings,
    })
      .then(() => {
        setOpen(false);
        setRefresh(true);
      })
      .catch((error) => {
        console.error("Failed to edit requirement set:", error);
      });
  };

  const onDelete = () => {
    if (
      !confirm(
        "Are you sure you want to delete this requirement set? All requirements in this set will also be deleted.",
      )
    ) {
      return;
    }
    deleteRequirementsSet(requirementSet.id)
      .then(() => {
        setOpen(false);
        setRefresh(true);
        navigate("/requirements");
      })
      .catch((error) => {
        console.error("Failed to archive requirement set:", error);
      });
  };

  useEffect(() => {
    fetchProjects()
      .then((data) => {
        setProjects(data.data);
        setLoadingProjects(false);
      })
      .catch((error) => console.error("Failed to fetch projects:", error));
  }, []);

  useEffect(() => {
    if (requirementSet) {
      setRequirementSetName(requirementSet.display_name);
      setSelectedProject(requirementSet.project.id);
    }
  }, [requirementSet]);

  useEffect(() => {
    setSettings(mergedSettings);
  }, [mergedSettings]);

  const toggleSetting = (key) => {
    setSettings((previous) => ({
      ...previous,
      [key]: !previous[key],
    }));
  };

  const renderCheck = (label, key, helpText = null) => (
    <DokulyCheckFormGroup
      label={label}
      value={settings[key]}
      onChange={() => toggleSetting(key)}
      id={key}
      showToolTip={Boolean(helpText)}
      tooltipText={helpText}
    />
  );

  return (
    <React.Fragment>
      <EditButton
        onClick={() => setOpen(true)}
        buttonText="Edit Requirement Set"
        disabled={readOnly}
      />
      <DokulyModal
        show={open}
        onHide={() => setOpen(false)}
        title="Edit Requirement Set"
      >
        <Form.Group className="mt-2">
          <Form.Label>Requirement Set Name*</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter Requirement Set Name"
            value={requirementSetName}
            onChange={(e) => setRequirementSetName(e.target.value)}
          />
        </Form.Group>
        <div className="mt-4">
          <h6>Hierarchy & Structure</h6>
          {renderCheck(
            "Parent requirement (hierarchical)",
            "hierarchical_requirements_is_enabled"
          )}
          {renderCheck("Derived from", "derived_from_enabled")}
          {renderCheck("Superseded by", "superseded_by_is_enabled")}
        </div>

        <div className="mt-4">
          <h6>Core Requirement Fields</h6>
          {renderCheck(
            "External ID",
            "external_requirement_id_is_enabled"
          )}
          {renderCheck(
            "Requirement type",
            "requirement_type_is_enabled"
          )}
          {renderCheck(
            "Verification class",
            "verification_class_is_enabled"
          )}
          {renderCheck("Created by", "created_by_is_visible")}
        </div>

        <div className="mt-4">
          <h6>Verification Fields</h6>
          {renderCheck(
            "Method of verification",
            "verification_method_markdown_is_enabled"
          )}
          {renderCheck(
            "Results",
            "verification_results_markdown_is_enabled"
          )}
        </div>
        <Row className="align-items-center mx-2 mt-3">
          <SubmitButton
            onClick={onSubmit}
            disabled={!requirementSetName}
            disabledTooltip="Mandatory fields must be entered. Mandatory fields are marked with *"
          >
            Submit
          </SubmitButton>
          <DeleteButton onDelete={onDelete} />
        </Row>
      </DokulyModal>
    </React.Fragment>
  );
};

export default EditRequirementsSetForm;
