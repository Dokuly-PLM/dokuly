import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router";
import { editPart, archivePart } from "../functions/queries";
import { usePartTypes } from "../partTypes/usePartTypes";
import DokulyModal from "../../dokuly_components/dokulyModal";
import ExternalPartNumberFormGroup from "../../common/forms/externalPartNumberFormGroup";
import DropdownFormSection from "../../dokuly_components/dokulyForm/dropdownFormSection";
import { generateCountryList } from "../../dokuly_components/dokulyForm/functions/generateCountryList";
import NameSuggestion from "../../dokuly_components/nameSuggestion/nameSuggestion";
import { fetchIntegrationSettings } from "../../admin/functions/queries";
import { FormField, SectionDivider, EditFormRightPanel } from "../../dokuly_components/dokulyForm/formComponents";
import QuestionToolTip from "../../dokuly_components/questionToolTip";

const EditPartForm = (props) => {
  const navigate = useNavigate();

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
  const [exportControlClassificationNumber, setExportControlClassificationNumber] = useState("");
  const [harmonizedSystemCode, setHarmonizedSystemCode] = useState("");
  const [exportCollapsed, setExportCollapsed] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [rulesStatus, setRulesStatus] = useState(null);
  const [rulesOverride, setRulesOverride] = useState(false);
  const [hasAiCredentials, setHasAiCredentials] = useState(false);

  const partTypes = usePartTypes();

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
  }, [props.part, partTypes]);

  useEffect(() => {
    if (!props.part?.part_type) {
      setPartType(null);
      return;
    }
    if (partTypes.length === 0) return;
    const partTypeId = props.part.part_type.id || props.part.part_type;
    const currentPartType = partTypes.find(
      (partType) => partType.id === partTypeId
    );
    setPartType(currentPartType || null);
  }, [props.part?.part_type, partTypes]);

  useEffect(() => {
    fetchIntegrationSettings()
      .then((res) => {
        if (res.status === 200 && res.data) {
          setHasAiCredentials(res.data.has_ai_credentials || false);
        }
      })
      .catch(() => {});
  }, []);

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
      tooltipText: "Registration, Evaluation, Authorization and Restriction of Chemicals",
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
      tooltipText:
        "ECCN: An Export Control Classification Number used to identify items for export control purposes under U.S. Export Administration Regulations (EAR).",
    },
    {
      label: "Country of Origin",
      value: countryOfOrigin,
      onChange: setCountryOfOrigin,
      as: "select",
      key: "countryOfOrigin",
      options: countries,
      showToolTip: true,
      tooltipText:
        "Country of Origin (COO): Indicates the country where a product was manufactured, affecting duties, tariffs, and trade compliance.",
    },
    {
      label: "Harmonized System Code",
      value: harmonizedSystemCode,
      onChange: setHarmonizedSystemCode,
      key: "harmonizedSystemCode",
      showToolTip: true,
      tooltipText:
        "HS Code: A standardized 6-digit numerical code used globally to classify traded goods, created by the World Customs Organization (WCO).",
    },
  ];

  function onSubmit() {
    const isPlaceholderPart =
      is_internal === false && (!mpn || mpn.trim() === "");

    if (isPlaceholderPart && release_state === "Released") {
      if (
        !confirm(
          "Warning: This part has no MPN.\n\n" +
            "Are you sure you want to release this part?"
        )
      ) {
        return;
      }
    }

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
      part_type: partType?.id || null,
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
    if (
      !confirm(
        `Are you sure you want to delete this part:\n${props.part?.full_part_number} - ${props.part?.display_name}?`
      )
    ) {
      return;
    }

    archivePart(props.part?.id).then((res) => {
      if (res.status === 200) {
        setShowModal(false);
        navigate("/parts/");
      }
    });
  }

  return (
    <React.Fragment>
      {props.part?.release_state === "Released" ? (
        ""
      ) : (
        <button
          type="button"
          className="btn btn-bg-transparent"
          onClick={() => setShowModal(true)}
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
        size="lg"
      >
        <div className="d-flex" style={{ gap: "24px" }}>
          {/* ── Left column: fields ── */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <FormField label="Display name" required>
              <input
                className="form-control"
                type="text"
                value={display_name}
                onChange={(e) => setDisplayName(e.target.value)}
              />
              <NameSuggestion
                draftName={display_name}
                entityType="part"
                typeId={partType?.id}
                onApply={setDisplayName}
                enabled={hasAiCredentials}
              />
            </FormField>

            <div className="d-flex" style={{ gap: "12px" }}>
              <div style={{ flex: 1 }}>
                <FormField label="Part type">
                  <select
                    className="form-control"
                    value={partType ? partType?.name : ""}
                    onChange={(e) => {
                      const selectedPartType = partTypes.find(
                        (pt) => pt.name === e.target.value
                      );
                      setPartType(selectedPartType || null);
                      if (selectedPartType?.default_unit) {
                        setUnit(selectedPartType.default_unit);
                      }
                    }}
                  >
                    <option value="">Select part type</option>
                    {partTypes
                      .filter((pt) => pt.applies_to === "Part")
                      .map((pt) => (
                        <option key={pt.name} value={pt.name}>
                          {pt.name}
                        </option>
                      ))}
                  </select>
                </FormField>
              </div>
              <div style={{ flex: 0, minWidth: "100px" }}>
                <FormField label="Unit">
                  <input
                    className="form-control"
                    type="text"
                    value={unit}
                    onChange={(e) => {
                      if (e.target.value.length > 20) {
                        toast.info("Max length 20");
                      } else {
                        setUnit(e.target.value);
                      }
                    }}
                  />
                </FormField>
              </div>
            </div>

            <FormField label="Description" hint={`${(description || "").length}/500`}>
              <textarea
                className="form-control"
                value={description}
                onChange={(e) => {
                  if (e.target.value.length > 500) {
                    toast("Max length 500");
                    return;
                  }
                  setDescription(e.target.value);
                }}
                rows={2}
              />
            </FormField>

            {/* ── Source ── */}
            {is_internal !== "" && (
              <>
                <SectionDivider
                  label={is_internal ? "Internal part" : "External part"}
                />

                {is_internal ? (
                  <>
                    <ExternalPartNumberFormGroup
                      externalPartNumber={externalPartNumber}
                      setExternalPartNumber={setExternalPartNumber}
                    />
                    {partType?.name === "Software" && (
                      <FormField label="Git link">
                        <input
                          className="form-control"
                          type="text"
                          value={git_link}
                          onChange={(e) => setGitLink(e.target.value)}
                        />
                      </FormField>
                    )}
                  </>
                ) : (
                  <>
                    <div className="d-flex" style={{ gap: "12px" }}>
                      <div style={{ flex: 1 }}>
                        <FormField label="MPN" required>
                          <input
                            className="form-control"
                            type="text"
                            value={mpn}
                            onChange={(e) => setMpn(e.target.value)}
                          />
                        </FormField>
                      </div>
                      <div style={{ flex: 1 }}>
                        <FormField label="Manufacturer">
                          <input
                            className="form-control"
                            type="text"
                            value={manufacturer}
                            onChange={(e) => setManufacturer(e.target.value)}
                          />
                        </FormField>
                      </div>
                    </div>

                    {(!mpn || mpn.trim() === "") && (
                      <div
                        className="mb-3 d-flex align-items-center"
                        style={{
                          gap: "6px",
                          fontSize: "0.75rem",
                          color: "#B00020",
                        }}
                      >
                        <img
                          src="../../static/icons/alert-triangle.svg"
                          alt="warning"
                          width="14"
                          height="14"
                          className="dokuly-filter-danger"
                        />
                        <span>
                          <strong>Placeholder part</strong> — add an MPN before
                          releasing.
                        </span>
                      </div>
                    )}

                    <div className="d-flex" style={{ gap: "12px" }}>
                      <div style={{ flex: 1 }}>
                        <FormField
                          label={
                            <>
                              Datasheet link{" "}
                              <QuestionToolTip 
                                optionalHelpText="A URL to a web-hosted datasheet. The file from this URL will be automatically uploaded to the files table." 
                                placement="right" 
                              />
                            </>
                          }
                        >
                          <input
                            className="form-control"
                            type="url"
                            value={datasheet}
                            onChange={(e) => setDatasheet(e.target.value)}
                            placeholder="https://..."
                          />
                        </FormField>
                      </div>
                      <div style={{ flex: 1 }}>
                        <FormField
                          label={
                            <>
                              Image link{" "}
                              <QuestionToolTip 
                                optionalHelpText="A URL to a web-hosted image. The image from this URL will be automatically uploaded to the files table." 
                                placement="right" 
                              />
                            </>
                          }
                        >
                          <input
                            className="form-control"
                            type="url"
                            value={image_url}
                            onChange={(e) => setImageUrl(e.target.value)}
                            placeholder="https://..."
                          />
                        </FormField>
                      </div>
                    </div>

                    <ExternalPartNumberFormGroup
                      externalPartNumber={externalPartNumber}
                      setExternalPartNumber={setExternalPartNumber}
                    />
                  </>
                )}
              </>
            )}

            {/* ── Compliance & Export (collapsible) ── */}
            <DropdownFormSection
              formGroups={complianceOptions}
              isCollapsed={complianceCollapsed}
              handleToggle={() => setComplianceCollapsed(!complianceCollapsed)}
              collapsedText="Compliance"
              wrapperClassname="mt-2"
              className="mt-3"
            />

            <DropdownFormSection
              formGroups={exportOptions}
              isCollapsed={exportCollapsed}
              handleToggle={() => setExportCollapsed(!exportCollapsed)}
              collapsedText="Export"
              wrapperClassname="mt-1"
              className="mt-1"
            />
          </div>

          <EditFormRightPanel
            releaseState={release_state}
            setReleaseState={setReleaseState}
            isApprovedForRelease={is_approved_for_release}
            setIsApprovedForRelease={setIsApprovedForRelease}
            rulesItemType="part"
            rulesItemId={props.part?.id}
            rulesProjectId={props.part?.project}
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
                ? "Mandatory fields must be entered"
                : "Rules must be satisfied or overridden before releasing"
            }
            onSubmit={() => onSubmit()}
            onDelete={() => archiveCurrentPart()}
            deleteLabel="Delete part"
          />
        </div>
      </DokulyModal>
    </React.Fragment>
  );
};

export default EditPartForm;
