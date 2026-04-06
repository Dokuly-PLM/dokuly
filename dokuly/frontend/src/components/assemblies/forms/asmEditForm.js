import React, { useState, useEffect } from "react";
import moment from "moment";
import { useNavigate } from "react-router";
import { archiveAsmRevision, editAsmInfo } from "../functions/queries";
import { toast } from "react-toastify";
import ExternalPartNumberFormGroup from "../../common/forms/externalPartNumberFormGroup";
import { usePartTypes } from "../../parts/partTypes/usePartTypes";
import DokulyModal from "../../dokuly_components/dokulyModal";
import { FormField, EditFormRightPanel } from "../../dokuly_components/dokulyForm/formComponents";

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
  const [showModal, setShowModal] = useState(false);

  const partTypes = usePartTypes();

  const editAsm = () => {
    loadStates(props?.asm);
    setShowModal(true);
  };

  const archiveAsm = () => {
    if (!confirm("Are you sure you want to delete this assembly?")) {
      return;
    }

    // Push data to the database
    archiveAsmRevision(props.asm?.id).then((res) => {
      if (res.status === 202) {
        setShowModal(false);
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
          setShowModal(false);
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

      <DokulyModal
        show={showModal}
        onHide={() => setShowModal(false)}
        title="Edit assembly"
        size="lg"
      >
        <div className="d-flex" style={{ gap: "24px" }}>
          {/* Left column: fields */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <FormField label="Display name" required>
              <input
                className="form-control"
                type="text"
                value={display_name}
                onChange={(e) => {
                  if (e.target.value.length > 150) {
                    toast.info("Max length 150");
                    return;
                  }
                  setDisplayName(e.target.value);
                }}
              />
            </FormField>

            <FormField label="Description" hint={`${(description || "").length}/500`}>
              <textarea
                className="form-control"
                type="text"
                value={description}
                onChange={(e) => {
                  if (e.target.value.length > 500) {
                    toast.info("Max length 500");
                    return;
                  }
                  setDescription(e.target.value);
                }}
                rows={2}
              />
            </FormField>

            <ExternalPartNumberFormGroup
              externalPartNumber={externalPartNumber}
              setExternalPartNumber={setExternalPartNumber}
            />

            <FormField label="Part type">
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
            </FormField>
          </div>

          <EditFormRightPanel
            releaseState={release_state}
            setReleaseState={setReleaseState}
            isApprovedForRelease={is_approved_for_release}
            setIsApprovedForRelease={setIsApprovedForRelease}
            rulesItemType="assembly"
            rulesItemId={props.asm?.id}
            rulesProjectId={props.asm?.project}
            onRulesStatusChange={setRulesStatus}
            setRulesOverride={setRulesOverride}
            submitDisabled={
              display_name === "" ||
              (release_state === "Released" &&
                rulesStatus &&
                !rulesStatus.all_rules_passed &&
                !rulesOverride)
            }
            submitDisabledTooltip={
              display_name === ""
                ? "Mandatory fields must be entered. Mandatory fields are marked with *"
                : "Rules must be satisfied or overridden before releasing"
            }
            onSubmit={() => submit()}
            onDelete={() => archiveAsm()}
            deleteLabel="Delete assembly"
          />
        </div>
      </DokulyModal>
    </div>
  );
};

export default AsmEditForm;
