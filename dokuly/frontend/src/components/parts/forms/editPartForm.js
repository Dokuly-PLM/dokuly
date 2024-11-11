import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router";
import { editPart, archivePart } from "../functions/queries";
import SubmitButton from "../../dokuly_components/submitButton";
import ReleaseStateTimeline from "../../dokuly_components/releaseStateTimeline/ReleaseStateTimeline";
import DeleteButton from "../../dokuly_components/deleteButton";
import { usePartTypes } from "../partTypes/usePartTypes";
import DokulyModal from "../../dokuly_components/dokulyModal";
import ExternalPartNumberFormGroup from "../../common/forms/externalPartNumberFormGroup";
import DropdownFormSection from "../../dokuly_components/dokulyForm/dropdownFormSection";
import ReactCountryFlag from "react-country-flag";
import FlagSelect, {
  generateCountryList,
} from "../../dokuly_components/dokulyForm/functions/generateCountryList";

const EditPartForm = (props) => {
  const navigate = useNavigate();

  // Form Fields
  const [display_name, setDisplayName] = useState("");
  const [release_state, setReleaseState] = useState("");
  const [is_approved_for_release, setIsApprovedForRelease] = useState(false);
  const [description, setDescription] = useState("");
  const [partType, setPartType] = useState(null);
  const [unit, setUnit] = useState("");
  const [git_link, setGitLink] = useState("");
  const [mpn, setMpn] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [datasheet, setDatasheet] = useState("");
  const [image_url, setImageUrl] = useState("");
  const [is_internal, setIsInternal] = useState(true);
  const [currency, setCurrency] = useState("");
  const [externalPartNumber, setExternalPartNumber] = useState("");
  const [isRohsCompliant, setIsRohsCompliant] = useState(false);
  const [isReachCompliant, setIsReachCompliant] = useState(false);
  const [isUlCompliant, setIsUlCompliant] = useState(false);
  const [complianceCollapsed, setComplianceCollapsed] = useState(true);

  const [countryOfOrigin, setCountryOfOrigin] = useState("");
  const [
    exportControlClassificationNumber,
    setExportControlClassificationNumber,
  ] = useState("");
  const [harmonizedSystemCode, setHarmonizedSystemCode] = useState("");
  const [exportCollapsed, setExportCollapsed] = useState(true);

  const [showModal, setShowModal] = useState(false);

  const partTypes = usePartTypes();

  const toggleCompliance = () => {
    setComplianceCollapsed(!complianceCollapsed);
  };

  useEffect(() => {
    if (props.part !== null && props.part !== undefined) {
      setDisplayName(props.part?.display_name);
      setReleaseState(props.part?.release_state);
      setDescription(props.part?.description);
      setUnit(props.part?.unit);
      setGitLink(props.part?.git_link);
      setMpn(props.part?.mpn);
      setManufacturer(props.part?.manufacturer);
      setDatasheet(props.part?.datasheet);
      setImageUrl(props.part?.image_url);
      setIsInternal(props.part?.internal);
      setCurrency(props.part?.currency);
      setExternalPartNumber(props?.part?.external_part_number ?? "");
      setIsRohsCompliant(props.part?.is_rohs_compliant ?? false);
      setIsReachCompliant(props.part?.is_reach_compliant ?? false);
      setIsUlCompliant(props.part?.is_ul_compliant ?? false);
      if (
        props.part?.is_rohs_compliant ||
        props.part?.is_reach_compliant ||
        props.part?.is_ul_compliant
      ) {
        setComplianceCollapsed(false);
      }
      const eccn = props.part?.export_control_classification_number ?? "";
      const country = props.part?.country_of_origin ?? "";
      const hscode = props.part?.hs_code ?? "";
      setExportControlClassificationNumber(eccn);
      setCountryOfOrigin(country);
      setHarmonizedSystemCode(hscode);

      if (eccn !== "" || country !== "" || hscode !== "") {
        setExportCollapsed(false);
      }
    }
  }, [props.part]);

  const launchForm = () => {
    setShowModal(true);
  };

  const complianceOptions = [
    {
      label: "RoHS compliant",
      value: isRohsCompliant,
      onChange: setIsRohsCompliant,
      as: "check",
      key: "rohs",
      showToolTip: true,
      tooltipText: "Restriction of Hazardous Substances Directive",
    },
    {
      label: "REACH compliant",
      value: isReachCompliant,
      onChange: setIsReachCompliant,
      as: "check",
      key: "reach",
      showToolTip: true,
      tooltipText:
        "Registration, Evaluation, Authorization and Restriction of Chemicals",
    },
    {
      label: "UL compliant",
      value: isUlCompliant,
      onChange: setIsUlCompliant,
      as: "check",
      key: "ul",
      showToolTip: true,
      tooltipText: "Underwriters Laboratories Compliance Mark",
    },
  ];

  const countries = generateCountryList();
  countries.unshift({ label: "Select a country", value: "" });

  const exportOptions = [
    {
      label: "Export Control Classification Number",
      value: exportControlClassificationNumber,
      onChange: setExportControlClassificationNumber,
      key: "exportControlClassificationNumber",
      showToolTip: true,
      tooltipText: "ECCN: An Export Control Classification Number used to identify items for export control purposes under U.S. Export Administration Regulations (EAR)."
    },
    {
      label: "Country of Origin",
      value: countryOfOrigin,
      onChange: setCountryOfOrigin,
      as: "select",
      key: "countryOfOrigin",
      options: countries,
      showToolTip: true,
      tooltipText: "Country of Origin (COO): Indicates the country where a product was manufactured, affecting duties, tariffs, and trade compliance."
    },
    {
      label: "Harmonized System Code",
      value: harmonizedSystemCode,
      onChange: setHarmonizedSystemCode,
      key: "harmonizedSystemCode",
      showToolTip: true,
      tooltipText: "HS Code: A standardized 6-digit numerical code used globally to classify traded goods, created by the World Customs Organization (WCO).",
    },
  ];

  function onSubmit() {
    const data = {
      display_name: display_name,
      release_state: release_state,
      is_approved_for_release: is_approved_for_release,
      description: description,
      internal: is_internal,
      unit: unit,
      git_link: git_link,
      mpn: mpn,
      manufacturer: manufacturer,
      datasheet: datasheet,
      image_url: image_url,
      currency: currency,
      external_part_number: externalPartNumber,
      is_rohs_compliant: isRohsCompliant,
      is_reach_compliant: isReachCompliant,
      is_ul_compliant: isUlCompliant,
      export_control_classification_number: exportControlClassificationNumber,
      country_of_origin: countryOfOrigin,
      harmonized_system_code: harmonizedSystemCode,
    };

    editPart(props.part?.id, data).then((res) => {
      if (res.status === 201) {
        props.setRefresh(true);
        toast.success("Part updated");
      } else {
        toast.error(
          "Error updating part. If the problem persists contact support."
        );
      }
    });
    setShowModal(false);
  }

  function archiveCurrentPart() {
    if (!confirm("Are you sure you want to delete this part?")) {
      return;
    }

    archivePart(props.part?.id).then((res) => {
      if (res.status === 200) {
        setShowModal(false);
        navigate("/parts/");
      }
    });
  }

  const internalOptions = (
    <div>
      <div className="form-group">
        <label>Description</label>
        <textarea
          className="form-control"
          type="text"
          name="description"
          onChange={(e) => {
            if (e.target.value.length > 500) {
              toast("Max length 500");
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

      {partType?.name === "Software" ? (
        <div className="form-group">
          <label>Git link</label>
          <input
            className="form-control"
            type="text"
            name="git_link"
            onChange={(e) => {
              setGitLink(e.target.value);
            }}
            value={git_link}
          />
        </div>
      ) : (
        ""
      )}
    </div>
  );

  const externalOptions = (
    <div>
      <div className="form-group">
        <label>Manufacturer part number *</label>
        <input
          className="form-control"
          type="text"
          name="mpn"
          onChange={(e) => {
            setMpn(e.target.value);
          }}
          value={mpn}
        />
      </div>

      <div className="form-group">
        <label>Manufacturer</label>
        <input
          className="form-control"
          type="text"
          name="manufacturer"
          onChange={(e) => {
            setManufacturer(e.target.value);
          }}
          value={manufacturer}
        />
      </div>
      <div className="form-group">
        <label>Datasheet link</label>
        <input
          className="form-control"
          type="text"
          name="datasheet"
          onChange={(e) => {
            setDatasheet(e.target.value);
          }}
          value={datasheet}
          title="A URL to a web-hosted datasheet."
        />
      </div>
      <div className="form-group">
        <label>Image link</label>
        <input
          className="form-control"
          type="text"
          name="image_url"
          onChange={(e) => {
            setImageUrl(e.target.value);
          }}
          value={image_url}
          title="Alternative to thumbnail. Image is loaded from the URL."
        />
      </div>
    </div>
  );

  return (
    <React.Fragment>
      {props.part?.release_state === "Released" ? (
        ""
      ) : (
        <button
          type="button"
          className="btn btn-bg-transparent"
          onClick={() => launchForm()}
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
      )}

      <DokulyModal
        show={showModal}
        onHide={() => setShowModal(false)}
        title="Edit part"
      >
        <div className="form-group">
          <div className="form-group">
            <label>Display name *</label>
            <input
              className="form-control"
              type="text"
              name="display_name"
              onChange={(e) => {
                setDisplayName(e.target.value);
              }}
              value={display_name}
            />
          </div>

          <div className="form-group">
            <label>Part unit</label>
            <input
              className="form-control"
              type="text"
              name="unit"
              onChange={(e) => {
                if (e.target.value.length > 20) {
                  toast.info("Max length 20");
                } else {
                  setUnit(e.target.value);
                }
              }}
              value={unit}
            />
          </div>

          {is_internal === ""
            ? ""
            : is_internal === true
            ? internalOptions
            : externalOptions}

          <DropdownFormSection
            formGroups={complianceOptions}
            isCollapsed={complianceCollapsed}
            handleToggle={toggleCompliance}
            collapsedText="Compliance"
            wrapperClassname="mt-2"
            className="mt-2"
          />

          <DropdownFormSection
            formGroups={exportOptions}
            isCollapsed={exportCollapsed}
            handleToggle={() => setExportCollapsed(!exportCollapsed)}
            collapsedText="Export"
            wrapperClassname="mt-1 mb-3"
            className="mt-1 mb-2"
          />

          <ReleaseStateTimeline
            releaseState={release_state}
            setReleaseState={setReleaseState}
            is_approved_for_release={is_approved_for_release}
            setIsApprovedForRelease={setIsApprovedForRelease}
            quality_assurance={props.part?.quality_assurance}
          />

          <div className="form-group mt-3 d-flex align-items-center">
            <SubmitButton
              type="submit"
              disabled={
                display_name === "" ||
                (is_internal === false &&
                  (mpn === "" || mpn === undefined || mpn === null))
              }
              onClick={() => {
                onSubmit();
              }}
              disabledTooltip={
                "Mandatory fields must be entered. Mandatory fields are marked with *"
              }
            >
              Submit
            </SubmitButton>

            <DeleteButton
              onDelete={() => {
                archiveCurrentPart();
              }}
            />
          </div>
        </div>
      </DokulyModal>
    </React.Fragment>
  );
};

export default EditPartForm;
