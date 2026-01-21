import React, { useState, useEffect } from "react";
import moment from "moment";
import { useNavigate } from "react-router";
import { archiveAsmRevision, editAsmInfo } from "../functions/queries";
import SubmitButton from "../../dokuly_components/submitButton";
import { toast } from "react-toastify";
import ReleaseStateTimeline from "../../dokuly_components/releaseStateTimeline/ReleaseStateTimeline";
import ExternalPartNumberFormGroup from "../../common/forms/externalPartNumberFormGroup";
import RulesStatusIndicator from "../../common/rules/rulesStatusIndicator";
import { usePartTypes } from "../../parts/partTypes/usePartTypes";

const AsmEditForm = (props) => {
  const navigate = useNavigate();

  const [release_state, setReleaseState] = useState("");
  const [is_approved_for_release, setIsApprovedForRelease] = useState(false);

  const [display_name, setDisplayName] = useState("");
  const [model_url, setModelUrl] = useState("");
  const [description, setDescription] = useState("");
  const [externalPartNumber, setExternalPartNumber] = useState("");
  const [rulesStatus, setRulesStatus] = useState(null);
  const [rulesOverride, setRulesOverride] = useState(false);
  const [partType, setPartType] = useState(null);

  const partTypes = usePartTypes();

  const editAsm = () => {
    loadStates(props?.asm);
    $("#editAsmInfo").modal("show");
  };

  const archiveAsm = () => {
    if (!confirm("Are you sure you want to delete this assembly?")) {
      return;
    }

    // Push data to the database
    archiveAsmRevision(props.asm?.id).then((res) => {
      if (res.status === 202) {
        $("#editAsmInfo").modal("hide");
        navigate("/assemblies/");
      }
    });
  };

  const loadStates = (res) => {
    setReleaseState(res?.release_state);
    setDisplayName(res?.display_name);
    setModelUrl(res?.model_url);
    setDescription(res?.description);
    setExternalPartNumber(res?.external_part_number ?? "");
    // Part type will be loaded by useEffect when partTypes is available
  };

  // Load part type when props.asm or partTypes changes
  useEffect(() => {
    // part_type comes as an object from AssemblySerializer (PartTypeIconSerializer with id and icon_url)
    if (!props.asm?.part_type) {
      setPartType(null);
      return;
    }
    
    if (partTypes.length === 0) {
      // partTypes not loaded yet, will retry when it loads
      return;
    }
    
    const partTypeId = props.asm.part_type.id || props.asm.part_type;
    const currentPartType = partTypes.find(
      (partType) => partType.id === partTypeId
    );
    setPartType(currentPartType || null);
  }, [props.asm?.part_type, partTypes]);

  const clearStates = () => {
    setReleaseState("");
    setDisplayName("");
    setModelUrl("");
    setDescription("");
    setExternalPartNumber("");
    setPartType(null);
  };

  const submit = () => {
    if (release_state === "" || release_state == null) {
      toast.error("Invalid state");
      return;
    }
    if (model_url == null) {
      toast.error("Invalid model url");
      return;
    }
    if (description == null) {
      toast.error("Invalid description");
      return;
    }

    const data = {
      display_name: display_name,
      release_state: release_state,
      is_approved_for_release: is_approved_for_release,
      model_url: model_url,
      description: description,
      last_updated: moment().format("YYYY-MM-DD HH:mm"),
      external_part_number: externalPartNumber,
      part_type: partType?.id || null,
    };
    editAsmInfo(props.asm?.id, data)
      .then((res) => {
        if (res.status === 202) {
          $("#editAsmInfo").modal("hide");
          props.setRefresh(true);
          clearStates();
        }
      })
      .catch((err) => {
        if (err.response.status === 404) {
          toast.error("Object not found.");
        }
      });
  };

  return (
    <div>
      <button
        className="btn btn-sm btn-bg-transparent"
        onClick={() => editAsm()}
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
      <div
        className="modal fade"
        id="editAsmInfo"
        tabIndex="-1"
        role="dialog"
        aria-labelledby="editAsmInfoLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog" role="document">
          <div className="modal-content text-left">
            <div className="modal-header">
              <h5 className="modal-title" id="editAsmInfoLabel">
                Edit assembly information
              </h5>

              <small className="form-text text-muted pl-3">
                * Mandatory fields
              </small>

              <button
                type="button"
                className="close"
                onClick={() => {
                  $("#editAsmInfo").modal("hide");
                }}
              >
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Display name</label>
                <input
                  className="form-control"
                  type="text"
                  name="name"
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
                <label>Description</label>
                <textarea
                  className="form-control"
                  type="text"
                  name="name"
                  onChange={(e) => {
                    if (e.target.value.length > 500) {
                      toast.info("Max length 500");
                      return;
                    }
                    setDescription(e.target.value);
                  }}
                  value={description}
                />
              </div>

              <ExternalPartNumberFormGroup
                externalPartNumber={externalPartNumber}
                setExternalPartNumber={setExternalPartNumber}
              />

              <div className="form-group">
                <label>Part type</label>
                <select
                  className="form-control"
                  name="part_type"
                  value={partType ? partType?.name : ""}
                  onChange={(e) => {
                    const selectedPartType = partTypes.find(
                      (partType) => partType.name === e.target.value
                    );
                    setPartType(selectedPartType || null);
                  }}
                >
                  <option value="">Select part type</option>
                  {partTypes
                    .filter((partType) => partType.applies_to === "Assembly")
                    .map((partType) => (
                      <option key={partType.name} value={partType.name}>
                        {partType.name}
                      </option>
                    ))}
                </select>
              </div>

              <ReleaseStateTimeline
                releaseState={release_state}
                setReleaseState={setReleaseState}
                is_approved_for_release={is_approved_for_release}
                setIsApprovedForRelease={setIsApprovedForRelease}
                quality_assurance={props?.asm?.quality_assurance}
              />

              <RulesStatusIndicator 
                itemType="assembly"
                itemId={props.asm?.id}
                projectId={props.asm?.project}
                onStatusChange={setRulesStatus}
                setOverride={setRulesOverride}
              />

              <div className="mt-4">
                <SubmitButton
                  onClick={() => submit()}
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
                      ? "Mandatory fields must be entered. Mandatory fields are marked with *"
                      : "Rules must be satisfied or overridden before releasing"
                  }
                >
                  Submit
                </SubmitButton>

                <button
                  className={"btn btn-bg-transparent ml-2"}
                  type={"submit"}
                  //data-toggle="tooltip"
                  data-placement="top"
                  title={"delete_part"}
                  onClick={() => {
                    archiveAsm();
                  }}
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AsmEditForm;
