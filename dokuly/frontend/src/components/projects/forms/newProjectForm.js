import React, { useState, useEffect } from "react";
import {
  get_active_customers,
  fetchCustomer,
} from "../../customers/funcitons/queries";

import { newProject } from "../../admin/functions/queries";
import { fetchOrg } from "../../admin/functions/queries";
import { 
  getNextAvailableProjectNumber,
  checkProjectNumberExists 
} from "../functions/queries";
import DokulyModal from "../../dokuly_components/dokulyModal";
import SubmitButton from "../../dokuly_components/submitButton";
import { toast } from "react-toastify";

const NewProjectForm = (props) => {
  const [project_name, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [active_customers, setActiveCustomers] = useState([]);
  const [selected_customer_id, setSelectedCustomerId] = useState("");
  const [full_project_number, setFullProjectNumber] = useState("");
  const [project_number_warning, setProjectNumberWarning] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [organization, setOrganization] = useState(null);

  useEffect(() => {
    // Fetch organization settings
    const storedOrg = localStorage.getItem("organization");
    if (storedOrg) {
      try {
        setOrganization(JSON.parse(storedOrg));
      } catch (e) {
        localStorage.removeItem("organization");
      }
    }
    fetchOrg().then((res) => {
      if (res.status === 200) {
        localStorage.setItem("organization", JSON.stringify(res.data));
        setOrganization(res.data);
      }
    });
  }, []);

  const openModal = () => {
    get_active_customers().then((res) => {
      setActiveCustomers(res.data);
    });
    
    // Always fetch next available project number
    getNextAvailableProjectNumber().then((res) => {
      if (res.status === 200) {
        setFullProjectNumber(res.data.full_project_number);
      }
    });
    
    setShowModal(true);
  };

  const handleProjectNumberBlur = () => {
    if (full_project_number) {
      checkProjectNumberExists(full_project_number).then((res) => {
        if (res.status === 200 && res.data.exists) {
          setProjectNumberWarning("This project number is already in use");
        } else {
          setProjectNumberWarning("");
        }
      });
    }
  };

  function onSubmit() {
    // Only require customer selection if customer module is enabled
    if (organization?.customer_is_enabled !== false && selected_customer_id === "") {
      alert("Please select a customer");
      return;
    }

    // Always require project number
    if (!full_project_number) {
      alert("Please enter a project number");
      return;
    }

    // Require unique project number
    if (project_number_warning) {
      alert("Please enter a unique project number");
      return;
    }

    setShowModal(false);

    const data = {
      title: project_name,
      description: description,
      is_active: true,
      customer: selected_customer_id ? parseInt(selected_customer_id) : null,
      full_project_number: parseInt(full_project_number), // Send as full_project_number
    };

    newProject(data).then((res) => {
      if ((res.data = 201)) {
        if (props.setRefresh !== undefined) {
          props?.setRefresh(true);
        }
      }
    });
  }

  return (
    <div className="container-fluid">
      <button
        type="button"
        className="btn btn-bg-transparent mt-2 mb-2"
        onClick={openModal}
      >
        <div className="row">
          <img
            className="icon-dark"
            src="../../static/icons/circle-plus.svg"
            alt="icon"
          />
          <span className="btn-text">New project</span>
        </div>
      </button>

      <DokulyModal
        show={showModal}
        onHide={() => setShowModal(false)}
        title="New project"
      >
        <div className="form-group">
          <label>Project name</label>
          <input
            className="form-control"
            type="text"
            name="project_name"
            onChange={(e) => {
              if (e.target.value.length > 100) {
                alert("Max length 100");
                return;
              }
              setProjectName(e.target.value);
            }}
            value={project_name}
          />
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea
            className="form-control"
            type="text"
            name="description"
            onChange={(e) => {
              if (e.target.value.length > 1000) {
                alert("Max length 1000");
                return;
              }
              setDescription(e.target.value);
            }}
            value={description}
          />
        </div>

        <div className="form-group">
          <label>Project number *</label>
          <input
            className="form-control"
            type="number"
            name="project_number"
            value={full_project_number}
            onChange={(e) => setFullProjectNumber(e.target.value)}
            onBlur={handleProjectNumberBlur}
            placeholder="Enter project number"
            required
          />
          {project_number_warning && (
            <div className="mt-2">
              <span className="badge bg-danger text-white fw-bold">
                {project_number_warning}
              </span>
            </div>
          )}
        </div>

        {organization?.customer_is_enabled !== false && (
          <div className="form-group">
            <label>Customer</label>
            <select
              className="form-control"
              name="customer"
              type="number"
              value={selected_customer_id}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
            >
              <option value="">Choose customer</option>
              {active_customers == null
                ? ""
                : active_customers
                    .sort((a, b) => (a.customer_id > b.customer_id ? 1 : -1))
                    .map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
            </select>
          </div>
        )}

        <div className="form-group">
          <SubmitButton
            onClick={onSubmit}
            disabled={!full_project_number || project_number_warning}
            disabledTooltip={
              !full_project_number 
                ? "Please enter a project number" 
                : "Please enter a unique project number"
            }
          >
            Submit
          </SubmitButton>
        </div>
      </DokulyModal>
    </div>
  );
};

export default NewProjectForm;
