import React, { useState, useRef, useEffect } from "react";
import EditButton from "../../dokuly_components/editButton";
import DokulyModal from "../../dokuly_components/dokulyModal";
import { Form, Row } from "react-bootstrap";
import { fetchProjects } from "../../projects/functions/queries";
import { fetchCustomers } from "../../customers/funcitons/queries";
import SubmitButton from "../../dokuly_components/submitButton";
import DeleteButton from "../../dokuly_components/deleteButton";
import {
  deleteRequirementsSet,
  editRequirementSet,
} from "../functions/queries";
import { useNavigate } from "react-router";

const EditRequirementsSetForm = ({ requirementSet, setRefresh, readOnly }) => {
  const [open, setOpen] = useState(false);
  const [requirementSetName, setRequirementSetName] = useState("");
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [projects, setProjects] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const navigate = useNavigate();

  const onSubmit = () => {
    editRequirementSet(requirementSet.id, {
      display_name: requirementSetName,
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

    fetchCustomers()
      .then((data) => {
        setCustomers(data.data);
        setLoadingCustomers(false);
      })
      .catch((error) => console.error("Failed to fetch customers:", error));
  }, []);

  useEffect(() => {
    if (requirementSet) {
      setRequirementSetName(requirementSet.display_name);
      setSelectedProject(requirementSet.project.id);
      setSelectedCustomer(requirementSet.project?.customer);
    }
  }, [requirementSet]);

  useEffect(() => {
    const filteredProjects = selectedCustomer
      ? projects.filter((project) => project.customer === selectedCustomer)
      : projects;
    setFilteredProjects(filteredProjects);
  }, [selectedCustomer, projects]);

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
