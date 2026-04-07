import React, { useState, useEffect } from "react";
import { createRequirementSet } from "../functions/queries";

import { fetchProjects } from "../../projects/functions/queries";
import SubmitButton from "../../dokuly_components/submitButton";
import DokulyModal from "../../dokuly_components/dokulyModal";
import { toast } from "react-toastify";

const NewRequirementSetForm = ({ setRefresh }) => {
  const [display_name, setDisplayName] = useState("");
  const [description, setDescription] = useState("");
  const [projects, setProjects] = useState(null);
  const [selected_project_id, setSelectedProjectId] = useState(-1);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Load all projects when modal opens
    if (showModal) {
      fetchProjects().then((res) => {
        if (res.status === 200) {
          setProjects(res.data);
        }
      });
    }
  }, [showModal]);

  const launchNewItemForm = () => {
    setShowModal(true);
  };

  function onSubmit() {
    setShowModal(false);

    const data = {
      display_name: display_name,
      description: description,
      project: parseInt(selected_project_id),
    };

    createRequirementSet(data)
      .then((res) => {
        if (res?.status === 201) {
          toast.success("Requirement set created!");
          setRefresh(true);
        }
      })
      .catch((err) => {
        toast.error(`Error creating requirement set, status ${err}`);
      });
  }

  return (
    <div className="container-fluid">
      <button
        type="button"
        className="btn btn-bg-transparent mt-2 mb-2"
        onClick={launchNewItemForm}
      >
        <div className="row">
          <img
            className="icon-dark"
            src="../../static/icons/circle-plus.svg"
            alt="icon"
          />
          <span className="btn-text">New requirement set</span>
        </div>
      </button>

      <DokulyModal
        show={showModal}
        onHide={() => setShowModal(false)}
        title="Create new requirement set"
      >
        <div className="form-group">
          <label>Display name *</label>
          <input
            className="form-control"
            type="text"
            name="display_name"
            onChange={(e) => {
              if (e.target.value.length > 100) {
                alert("Max length 50");
                return;
              }
              setDisplayName(e.target.value);
            }}
            value={display_name}
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
          <label htmlFor="project">Project *</label>
          <select
            className="form-control"
            name="project"
            type="number"
            onChange={(e) => setSelectedProjectId(e.target.value)}
          >
            <option value="">Choose project</option>
            {projects == null || projects === undefined
              ? ""
              : projects
                  .sort((a, b) =>
                    a.project_number > b.project_number ? 1 : -1,
                  )
                  .map((project) => {
                    return (
                      <option key={project.id} value={project.id}>
                        {project.title}
                      </option>
                    );
                  })}
          </select>
        </div>

        <div className="form-group">
          <SubmitButton
            onClick={onSubmit}
            disabled={selected_project_id === -1 || display_name === ""}
            className="btn dokuly-bg-primary"
            disabledTooltip="Mandatory fields must be entered. Mandatory fields are marked with *"
          >
            Submit
          </SubmitButton>
        </div>
      </DokulyModal>
    </div>
  );
};

export default NewRequirementSetForm;