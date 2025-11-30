import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { toast } from "react-toastify";
import moment from "moment";

import { editEco, deleteEco } from "../functions/queries";
import { fetchProjects } from "../../projects/functions/queries";
import SubmitButton from "../../dokuly_components/submitButton";
import ReleaseStateTimeline from "../../dokuly_components/releaseStateTimeline/ReleaseStateTimeline";
import DokulyModal from "../../dokuly_components/dokulyModal";
import RulesStatusIndicator from "../../common/rules/rulesStatusIndicator";

const EditEcoForm = ({ eco, setRefresh, profiles = [] }) => {
  const navigate = useNavigate();

  const [showModal, setShowModal] = useState(false);
  const [release_state, setReleaseState] = useState(eco?.release_state || "Draft");
  const [is_approved_for_release, setIsApprovedForRelease] = useState(eco?.quality_assurance !== null);
  const [display_name, setDisplayName] = useState(eco?.display_name || "");
  const [projectId, setProjectId] = useState(eco?.project?.id || "");
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [rulesStatus, setRulesStatus] = useState(null);
  const [rulesOverride, setRulesOverride] = useState(false);

  // Update state when eco prop changes
  useEffect(() => {
    if (eco) {
      setReleaseState(eco.release_state || "Draft");
      setDisplayName(eco.display_name || "");
      setIsApprovedForRelease(eco.quality_assurance !== null);
      setProjectId(eco.project?.id || "");
    }
  }, [eco]);

  // Fetch projects when modal opens
  useEffect(() => {
    if (showModal && projects.length === 0) {
      fetchProjects()
        .then((res) => {
          if (res.status === 200) {
            setProjects(res.data);
          }
        })
        .catch((err) => {
          console.error("Failed to load projects:", err);
        })
        .finally(() => {
          setLoadingProjects(false);
        });
    }
  }, [showModal]);

  const loadStates = (ecoData) => {
    if (!ecoData) return;
    setReleaseState(ecoData.release_state || "Draft");
    setDisplayName(ecoData.display_name || "");
    setIsApprovedForRelease(ecoData.quality_assurance !== null);
    setProjectId(ecoData.project?.id || "");
  };

  const clearStates = () => {
    setReleaseState("");
    setDisplayName("");
    setIsApprovedForRelease(false);
    setProjectId("");
  };

  const editEcoClick = () => {
    loadStates(eco);
    setShowModal(true);
  };

  const handleDelete = () => {
    if (!confirm("Are you sure you want to delete this ECO?")) {
      return;
    }
    deleteEco(eco?.id)
      .then((res) => {
        if (res.status === 204) {
          toast.success("ECO deleted successfully");
          setShowModal(false);
          navigate("/eco");
        }
      })
      .catch((err) => {
        if (err?.response?.status === 400) {
          toast.error(err.response.data);
        } else {
          toast.error("Failed to delete ECO");
        }
      });
  };

  const submit = () => {
    if (!release_state) {
      toast.error("Invalid state");
      return;
    }

    const data = {
      display_name: display_name,
      release_state: release_state,
      is_approved_for_release: is_approved_for_release,
      last_updated: moment().format("YYYY-MM-DD HH:mm"),
      project: projectId || null,
    };

    editEco(eco?.id, data)
      .then((res) => {
        if (res.status === 200) {
          setShowModal(false);
          setRefresh(true);
          clearStates();
          toast.success("ECO updated successfully");
        }
      })
      .catch((err) => {
        if (err?.response?.status === 404) {
          toast.error("ECO not found");
        } else if (err?.response?.status === 400) {
          toast.error(err.response.data);
        } else {
          toast.error("Failed to update ECO");
        }
      });
  };

  const isReleased = eco?.release_state === "Released";

  return (
    <div>
      <button
        className="btn btn-sm btn-bg-transparent"
        onClick={editEcoClick}
        disabled={isReleased}
        title={isReleased ? "Released ECOs cannot be edited" : "Edit ECO"}
      >
        <div className="row">
          <img
            className="icon-dark"
            src="../../static/icons/edit.svg"
            alt="edit"
          />
          <span className="btn-text">Edit</span>
        </div>
      </button>

      <DokulyModal
        show={showModal}
        onHide={() => setShowModal(false)}
        title="Edit ECO"
      >
        <div className="form-group">
          <label>Display name</label>
          <input
            className="form-control"
            type="text"
            name="display_name"
            onChange={(e) => {
              if (e.target.value.length > 150) {
                toast.info("Max length 150");
                return;
              }
              setDisplayName(e.target.value);
            }}
            value={display_name}
          />
        </div>

        <div className="form-group">
          <label>Project (optional)</label>
          <select
            className="form-control"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value ? parseInt(e.target.value) : "")}
            disabled={loadingProjects}
          >
            <option value="">No project</option>
            {projects
              .filter((project) => project.is_active !== false)
              .map((project) => (
                <option key={project.id} value={project.id}>
                  {project.title}
                </option>
              ))}
          </select>
        </div>

        <ReleaseStateTimeline
          releaseState={release_state}
          setReleaseState={setReleaseState}
          is_approved_for_release={is_approved_for_release}
          setIsApprovedForRelease={setIsApprovedForRelease}
          quality_assurance={eco?.quality_assurance}
        />

        <RulesStatusIndicator 
          itemType="eco"
          itemId={eco?.id}
          projectId={eco?.project?.id}
          onStatusChange={setRulesStatus}
          setOverride={setRulesOverride}
        />

        <div className="mt-4">
          <SubmitButton
            onClick={submit}
            className="btn dokuly-bg-primary"
            disabled={
              display_name === "" ||
              (release_state === "Released" && 
               rulesStatus && 
               !rulesStatus.all_rules_passed && 
               !rulesOverride)
            }
            disabledTooltip={
              display_name === ""
                ? "Display name is required"
                : "Rules must be satisfied or overridden before releasing"
            }
          >
            Submit
          </SubmitButton>

          <button
            className="btn btn-bg-transparent ml-2"
            type="button"
            title="Delete ECO"
            onClick={handleDelete}
          >
            <div className="row">
              <img
                className="icon-dark"
                src="../../static/icons/trash.svg"
                alt="Delete Icon"
              />
              <span className="btn-text">Delete</span>
            </div>
          </button>
        </div>
      </DokulyModal>
    </div>
  );
};

export default EditEcoForm;
