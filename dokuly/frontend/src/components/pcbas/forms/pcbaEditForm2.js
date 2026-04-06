import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { editPcba, archivePcba } from "../functions/queries";
import DokulyModal from "../../dokuly_components/dokulyModal";
import ExternalPartNumberFormGroup from "../../common/forms/externalPartNumberFormGroup";
import { usePartTypes } from "../../parts/partTypes/usePartTypes";
import {
  FormField,
  SectionDivider,
  EditFormRightPanel,
} from "../../dokuly_components/dokulyForm/formComponents";

const PcbaForm = (props) => {
  const navigate = useNavigate();
  const [release_state, setReleaseState] = useState("");
  const [is_approved_for_release, setIsApprovedForRelease] = useState(false);
  const [display_name, setDisplayName] = useState("");
  const [description, setDescription] = useState("");
  const [attributes, setAttributes] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [externalPartNumber, setExternalPartNumber] = useState("");
  const [rulesStatus, setRulesStatus] = useState(null);
  const [rulesOverride, setRulesOverride] = useState(false);
  const [partType, setPartType] = useState(null);

  const partTypes = usePartTypes();

  useEffect(() => {
    setDisplayName(props.pcba?.display_name);
    setDescription(props.pcba?.description);
    setReleaseState(props.pcba?.release_state);
    setAttributes(props.pcba?.attributes || {});
    setExternalPartNumber(props?.pcba?.external_part_number ?? "");
  }, [props.pcba]);

  useEffect(() => {
    // part_type comes as an object from PcbaSerializerFull (PartTypeIconSerializer with id and icon_url)
    if (!props.pcba?.part_type) {
      setPartType(null);
      return;
    }

    if (partTypes.length === 0) {
      // partTypes not loaded yet, will retry when it loads
      return;
    }

    const partTypeId = props.pcba.part_type.id || props.pcba.part_type;
    const currentPartType = partTypes.find(
      (partType) => partType.id === partTypeId
    );
    setPartType(currentPartType || null);
  }, [props.pcba?.part_type, partTypes]);

  const launchForm = () => {
    setShowModal(true);
  };

  function onSubmit() {
    const data = {
      display_name: display_name,
      description: description,
      release_state: release_state,
      is_approved_for_release: is_approved_for_release,
      attributes: attributes,
      external_part_number: externalPartNumber,
      part_type: partType?.id || null,
    };

    setShowModal(false);
    editPcba(props.pcba?.id, data).then((res) => {
      if (res.status === 200) {
        if (props.refreshParent !== undefined) {
          props.refreshParent(true);
        }
      }
    });
  }

  function archiveCurrentPcba() {
    if (!confirm("Are you sure you want to delete this PCBA?")) {
      return;
    }
    archivePcba(props.pcba?.id).then((res) => {
      if (res.status === 200) {
        setShowModal(false);
        navigate("/pcbas/");
      }
    });
  }

  function handleAttributeChange(attribute, value) {
    setAttributes((prevAttributes) => ({
      ...prevAttributes,
      [attribute]: value,
    }));
  }

  function renderAttributeCheckboxes() {
    const attributeIcons = {
      "Critical Stackup": "critical-stackup.svg",
      "Controlled Impedance": "controlled-impedance.svg",
      "Flex PCB": "flex-pcb.svg",
    };

    return Object.entries(attributeIcons).map(([attribute, icon]) => (
      <div className="form-check form-check-inline" key={attribute}>
        <input
          className="dokuly-checkbox"
          type="checkbox"
          checked={attributes[attribute] || false}
          onChange={(e) => handleAttributeChange(attribute, e.target.checked)}
        />
        <label className="form-check-label" htmlFor={`attribute-${attribute}`}>
          <img
            src={`../../static/icons/PCB/${icon}`}
            alt={`Icon for ${attribute}`}
          />
          <span className="ml-2">
            <text style={{ fontSize: "16px" }}>{attribute}</text>
          </span>
        </label>
      </div>
    ));
  }

  return (
    <React.Fragment>
      <div>
        {props.pcba?.release_state !== "Released" ? (
          <button
            type="button"
            className="btn btn-bg-transparent"
            onClick={launchForm}
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
        ) : (
          ""
        )}

        <DokulyModal
          show={showModal}
          onHide={() => setShowModal(false)}
          title="Edit PCBA"
          size="lg"
        >
          <div className="d-flex" style={{ gap: "24px" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <FormField label="Display Name" required>
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
                    .filter((partType) => partType.applies_to === "PCBA")
                    .map((partType) => (
                      <option key={partType.name} value={partType.name}>
                        {partType.name}
                      </option>
                    ))}
                </select>
              </FormField>

              <FormField label="Description">
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
              </FormField>

              <SectionDivider label="Attributes" />
              <div>{renderAttributeCheckboxes()}</div>
            </div>

            <EditFormRightPanel
              releaseState={release_state}
              setReleaseState={setReleaseState}
              isApprovedForRelease={is_approved_for_release}
              setIsApprovedForRelease={setIsApprovedForRelease}
              rulesItemType="pcba"
              rulesItemId={props.pcba?.id}
              rulesProjectId={props.pcba?.project}
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
              onSubmit={onSubmit}
              onDelete={archiveCurrentPcba}
              deleteLabel="Delete PCBA"
            />
          </div>
        </DokulyModal>
      </div>
    </React.Fragment>
  );
};

export default PcbaForm;
