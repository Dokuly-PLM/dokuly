import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import DokulyModal from "../../dokuly_components/dokulyModal";
import SubmitButton from "../../dokuly_components/submitButton";
import { createEco } from "../functions/queries";
import { fetchProjects } from "../../projects/functions/queries";
import { fetchUsers } from "../../admin/functions/queries";

/**
 * Button with form to create a new ECO.
 */
const NewEcoForm = ({ setRefresh }) => {
  const navigate = useNavigate();

  // Form Fields
  const [displayName, setDisplayName] = useState("");
  const [responsibleId, setResponsibleId] = useState("");
  const [projectId, setProjectId] = useState("");

  // Data
  const [profiles, setProfiles] = useState([]);
  const [projects, setProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (showModal) {
      // Fetch active profiles when modal opens
      fetchUsers()
        .then((res) => {
          if (res.status === 200) {
            setProfiles(res.data);
          }
        })
        .catch((err) => {
          console.error("Error fetching profiles:", err);
        });

      // Fetch projects when modal opens
      fetchProjects()
        .then((res) => {
          if (res.status === 200) {
            setProjects(res.data);
          }
        })
        .catch((err) => {
          console.error("Error fetching projects:", err);
        });
    }
  }, [showModal]);

  const launchForm = () => {
    setShowModal(true);
  };

  const resetFields = () => {
    setDisplayName("");
    setResponsibleId("");
    setProjectId("");
  };

  const onSubmit = () => {
    const data = {
      display_name: displayName,
      responsible: responsibleId ? parseInt(responsibleId) : null,
      project: projectId ? parseInt(projectId) : null,
    };

    createEco(data)
      .then((res) => {
        if (res.status === 201) {
          toast.success("ECO created successfully");
          resetFields();
          setShowModal(false);
          if (setRefresh) {
            setRefresh(true);
          }
          // Navigate to the new ECO
          navigate(`/eco/${res.data.id}`);
        }
      })
      .catch((err) => {
        console.error("Error creating ECO:", err);
        toast.error("Failed to create ECO");
      });
  };

  return (
    <div className="container-fluid">
      <button
        type="button"
        className="btn btn-bg-transparent mt-2 mb-2"
        onClick={launchForm}
      >
        <div className="row">
          <img
            className="icon-dark"
            src="../../static/icons/circle-plus.svg"
            alt="icon"
          />
          <span className="btn-text">New ECO</span>
        </div>
      </button>

      <DokulyModal
        show={showModal}
        onHide={() => setShowModal(false)}
        title="Create new ECO"
      >
        <div className="form-group">
          <label>Display name *</label>
          <input
            className="form-control"
            type="text"
            name="display_name"
            placeholder="Enter title"
            onChange={(e) => setDisplayName(e.target.value)}
            value={displayName}
          />
        </div>

        <div className="form-group">
          <label>Project</label>
          <select
            className="form-control"
            name="project"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
          >
            <option value="">Choose project</option>
            {projects
              .filter((project) => project.is_active !== false)
              .sort((a, b) => a.title.localeCompare(b.title))
              .map((project) => (
                <option key={project.id} value={project.id}>
                  {project.title}
                </option>
              ))}
          </select>
          <small className="form-text text-muted">
            Optional. Attach to a project for project-specific tags.
          </small>
        </div>

        <div className="form-group">
          <label>Responsible</label>
          <select
            className="form-control"
            name="responsible"
            value={responsibleId}
            onChange={(e) => setResponsibleId(e.target.value)}
          >
            <option value="">Select responsible person</option>
            {profiles
              .filter((profile) => profile.is_active)
              .sort((a, b) => {
                const nameA = `${a.first_name} ${a.last_name}`.toLowerCase();
                const nameB = `${b.first_name} ${b.last_name}`.toLowerCase();
                return nameA.localeCompare(nameB);
              })
              .map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.first_name} {profile.last_name}
                </option>
              ))}
          </select>
          <small className="form-text text-muted">
            The person responsible for managing this ECO.
          </small>
        </div>

        <div className="form-group mt-4">
          <SubmitButton
            type="submit"
            disabled={!displayName || displayName.trim() === ""}
            onClick={onSubmit}
            disabledTooltip="Please enter a display name"
          >
            Submit
          </SubmitButton>
        </div>
      </DokulyModal>
    </div>
  );
};

export default NewEcoForm;
