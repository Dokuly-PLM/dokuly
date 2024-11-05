import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";

import { get_active_customers } from "../../customers/funcitons/queries";

import { editProject } from "../../admin/functions/queries";
import SubmitButton from "../../dokuly_components/submitButton";
import DokulyModal from "../../dokuly_components/dokulyModal";

const ProjectEditForm = (props) => {
  const navigate = useNavigate();
  const [is_active, setIsActive] = useState(false);
  const [project_name, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [active_customers, setActiveCustomers] = useState([]);
  const [selected_customer_id, setSelectedCustomerId] = useState("");
  const [project, setProject] = useState(
    props.project == null || props.project === undefined ? null : props.project,
  );
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    setProjectName(project?.title);
    setSelectedCustomerId(project?.customer?.id);
    setDescription(project?.description);
    setIsActive(project?.is_active === true);
  }, [project, active_customers]);

  useEffect(() => {
    setProject(props.project);
  }, [props.project]);

  useEffect(() => {
    // Fetch active customers on component mount
    get_active_customers()
      .then((res) => {
        setActiveCustomers(res.data);
      })
      .catch((error) => {
        console.error("Failed to fetch active customers:", error);
      });
  }, []);

  const openModal = () => {
    setShowModal(true);
  };

  function onSubmit() {
    if (selected_customer_id === "") {
      return;
    }

    setShowModal(false);

    const data = {
      title: project_name,
      is_active: is_active,
      customer: parseInt(selected_customer_id),
    };

    editProject(project.id, data).then((res) => {
      if (res.status === 200) {
        props?.setRefresh(true);
      }
    });
  }

  function archiveProject() {
    if (!confirm("Are you sure you want to archive this project?")) {
      return;
    }

    let data = {
      is_archived: true,
    };

    editProject(props.project?.id, data).then((res) => {
      if (res.status === 200) {
        setShowModal(false);
        navigate("/projects/");
      }
    });
  }

  return (
    <div>
      <div>
        <button
          type="button"
          className="btn btn-bg-transparent mt-2 mb-2"
          onClick={openModal}
        >
          <div className="row">
            <img
              className="icon-dark"
              src="../../static/icons/edit.svg"
              alt="icon"
            />
            <span className="btn-text">Edit</span>
          </div>
        </button>
      </div>

      <DokulyModal
        show={showModal}
        onHide={() => setShowModal(false)}
        title="Edit project"
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

        <div>
          <div className="form-group">
            <label htmlFor="is_active">
              <input
                className="dokuly-checkbox"
                type="checkbox"
                checked={is_active}
                onChange={() => setIsActive(!is_active)}
              />{" "}
              Active Project
            </label>
          </div>
        </div>

        <div className="form-group">
          <SubmitButton onClick={onSubmit} type="button" children={"Submit"} />

          <button
            className={"btn btn-bg-transparent ml-2"}
            data-placement="top"
            title={"archive_project"}
            onClick={archiveProject}
          >
            <div className="row">
              <img
                className="icon-dark"
                src="../../static/icons/trash.svg"
                alt="Archive Icon"
              />
              <span className="btn-text">Delete</span>
            </div>
          </button>
        </div>
      </DokulyModal>
    </div>
  );
};

export default ProjectEditForm;
