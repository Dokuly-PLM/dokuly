import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { editPcba, archivePcba } from "../functions/queries";
import SubmitButton from "../../dokuly_components/submitButton";
import ReleaseStateTimeline from "../../dokuly_components/releaseStateTimeline/ReleaseStateTimeline";
import DokulyModal from "../../dokuly_components/dokulyModal";
import ExternalPartNumberFormGroup from "../../common/forms/externalPartNumberFormGroup";

const PcbaForm = (props) => {
  const navigate = useNavigate();
  const [release_state, setReleaseState] = useState("");
  const [is_approved_for_release, setIsApprovedForRelease] = useState(false);
  const [display_name, setDisplayName] = useState("");
  const [description, setDescription] = useState("");
  const [attributes, setAttributes] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [externalPartNumber, setExternalPartNumber] = useState("");

  useEffect(() => {
    setDisplayName(props.pcba?.display_name);
    setDescription(props.pcba?.description);
    setReleaseState(props.pcba?.release_state);
    setAttributes(props.pcba?.attributes || {});
    setExternalPartNumber(props?.pcba?.external_part_number ?? "");
  }, [props.pcba]);

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
            src={`../../..//static/icons/PCB/${icon}`}
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
        >
          <div className="form-group">
            <label>Display Name *</label>
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

          <ExternalPartNumberFormGroup
            externalPartNumber={externalPartNumber}
            setExternalPartNumber={setExternalPartNumber}
          />

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
            <label>Attributes</label>
            <div>{renderAttributeCheckboxes()}</div>
          </div>

          <ReleaseStateTimeline
            releaseState={release_state}
            setReleaseState={setReleaseState}
            is_approved_for_release={is_approved_for_release}
            setIsApprovedForRelease={setIsApprovedForRelease}
            quality_assurance={props?.pcba?.quality_assurance}
          />

          <div className="form-group mt-3">
            <SubmitButton
              onClick={onSubmit}
              disabled={display_name === ""}
              className="btn dokuly-bg-primary"
              disabledTooltip={
                "Mandatory fields must be entered. Mandatory fields are marked with *"
              }
            >
              Submit
            </SubmitButton>
            <button
              className="btn btn-bg-transparent ml-2"
              type="button"
              onClick={archiveCurrentPcba}
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
    </React.Fragment>
  );
};

export default PcbaForm;
