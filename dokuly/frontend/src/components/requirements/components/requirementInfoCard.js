import React, { useEffect, useState } from "react";
import moment from "moment";
import { Row, Col, Container } from "react-bootstrap";
import { useNavigate } from "react-router";
import { toast } from "react-toastify";

import DokulyCard from "../../dokuly_components/dokulyCard";
import CardTitle from "../../dokuly_components/cardTitle";
import { getProfile } from "../../profiles/functions/queries";
import DokulyTags from "../../dokuly_components/dokulyTags/dokulyTags";
import {
  REQRUIREMENT_STATES,
  REQUIREMENT_TYPES,
  VERIFICATION_CLASSES,
  OBLIGATION_LEVELS,
} from "../modelConstants";
import GenericDropdownSelector from "../../dokuly_components/dokulyTable/components/genericDropdownSelector";
import {
  editRequirement,
  deleteRequirement,
  getRequirementsBySet,
} from "../functions/queries";
import DeleteButton from "../../dokuly_components/deleteButton";
import NavigateButton from "../../dokuly_components/dokulyTable/components/navigateButton";
import GenericMultiSelector from "../../dokuly_components/genericMultiSelector";

const renderAdditionalFields = (additionalFields, keyColumnMaxWidth) => {
  return Object.entries(additionalFields)
    .filter(
      ([key, value]) => value !== "" && value !== null && value !== undefined
    )
    .map(([key, value], index) => (
      <Row key={index}>
        <Col
          className="col-lg-6 col-xl-6"
          style={{ maxWidth: keyColumnMaxWidth }}
        >
          <b>{key}:</b>
        </Col>
        <Col>{value.toString()}</Col>
      </Row>
    ));
};

const RequirementInfoCard = ({
  item = null,
  last_updated = "",
  number_of_subrequirements = -1,
  additional_fields = {},
  setRefresh,
  refresh,
  keyColumnMaxWidth = "260px",
  rowPadding = "10px",
  readOnly = false,
  project = { id: -1 },
}) => {
  const navigate = useNavigate();

  const [created_by, setCreatedBy] = useState(null);
  const [quality_assurance, setQualityAssurance] = useState(null);
  const [requirements, setRequirements] = useState([]);
  const [parentRequirement, setParentRequirement] = useState(null);
  const [superseedingRequirement, setSuperseedingRequirement] = useState(null);
  const [isTopLevelRequirement, setIsTopLevelRequiremnt] = useState(false);

  useEffect(() => {
    setIsTopLevelRequiremnt(item?.parent_requirement === null);
  }, [item?.parent_requirement]);

  const TYPE_OPTIONS = REQUIREMENT_TYPES.map((type) => ({
    value: type,
    label: type,
  }));
  const VERIFICATION_CLASS_OPTIONS = VERIFICATION_CLASSES.map((vc) => ({
    value: vc,
    label: vc,
  }));
  const STATE_OPTIONS = REQRUIREMENT_STATES.map((state) => ({
    value: state?.state,
    label: state?.state,
  }));
  const OBLIGATION_LEVEL_OPTIONS = OBLIGATION_LEVELS.map((level) => ({
    value: level,
    label: level,
  }));

  useEffect(() => {
    if (refresh !== true && requirements.length > 0) {
      return;
    }
    if (item) {
      getRequirementsBySet(item.requirement_set)
        .then((res) => {
          if (res.status === 200 && res.data) {
            setRequirements(res.data);
          }
        })
        .catch((error) => {
          toast.error("Failed to fetch requirements: " + error.message);
        });
    }
  }, [item, refresh]);

  useEffect(() => {
    const filteredReqs = requirements.filter(
      (req) => req.id === item.parent_requirement
    );
    const parentReq = filteredReqs.shift();
    setParentRequirement(parentReq);


    const filteredReqs2 = requirements.filter(
      (req) => req.id === item.superseded_by
    );
    const superseedingReq = filteredReqs2.shift();
    setSuperseedingRequirement(superseedingReq);

  }, [item?.parent_requirement, requirements]);

  const getParentRequirementOptions = () => {
    let options = [];
    if (!requirements || requirements.length === 0) {
      options.push({ value: null, label: "Top level requirement" });
      return options;
    }
    options = requirements
      .filter((req) => req.id !== item.id)
      .map((req) => ({
        value: req.id,
        label: `${req.id} - ${req.statement.substring(0, 100)}${
          req.statement.length > 100 ? "..." : ""
        }`,
      }));
    options.unshift({ value: null, label: "Top level requirement" });
    return options;
  };

  const getSuperseedingRequirementOptions = () => {
    let options = [];
    if (!requirements || requirements.length === 0) {
      options.push({ value: null, label: "--" });
      return options;
    }
    options = requirements
      .filter((req) => req.id !== item.id)
      .map((req) => ({
        value: req.id,
        label: `${req.id} - ${req.statement.substring(0, 100)}${
          req.statement.length > 100 ? "..." : ""
        }`,
      }));
    options.unshift({ value: null, label: "--" });
    return options;
  };

  const handleSuperseedingRequirementChange = (newSuperseedingId) => {
    changeField("superseded_by", newSuperseedingId);
  };
  const handleParentRequirementChange = (newParentId) => {
    changeField("parent_requirement", newParentId);
  };
  const handleTypeChange = (newType) => {
    changeField("type", newType);
  };
  const handleVerificationClassChange = (newClass) => {
    changeField("verification_class", newClass);
  };
  const handleRequirementStateChange = (newState) => {
    changeField("state", newState);
  };

  const changeField = (key, value) => {
    if (item?.id == null) {
      return;
    }
    if (key == null) {
      return;
    }

    const data = { [key]: value };
    editRequirement(item.id, data).then(
      (result) => {
        if (result.status === 200) {
          setRefresh(true);
        }
      },
      (error) => {
        toast.error(error);
      }
    );
  };

  const handleDelete = () => {
    if (
      !confirm(
        "Are you sure you want to delete this requirement? \nSubrequirements will be promoted to the top level."
      )
    ) {
      return;
    }
    const parent_id = item.parent_requirement || null;
    const set_id = item.requirement_set;
    deleteRequirement(item.id).then((result) => {
      if (result.status === 200) {
        if (parent_id !== null && parent_id !== undefined) {
          setRefresh(true);
          navigate(`/requirement/${parent_id}`);
        } else {
          navigate(`/requirements/set/${set_id}`);
        }
      }
    });
  };

  useEffect(() => {
    if (item?.created_by !== null && item?.created_by !== undefined) {
      getProfile(item.created_by).then((res) => {
        if (res.data !== null && res.data !== undefined) {
          setCreatedBy(res.data);
        }
      });
    }
  }, [item?.created_by]);

  useEffect(() => {
    if (item?.verified_by !== null && item?.verified_by !== undefined) {
      getProfile(item.verified_by).then((res) => {
        if (res.data !== null && res.data !== undefined) {
          setQualityAssurance(res.data);
        }
      });
    }
  }, [item?.verified_by]);

  const handleTagsChange = (newTags) => {
    // New array with tag ids
    changeField("tags", newTags);
  };

  const handleDerivedFromChange = (newDerivedFrom) => {
    changeField("derived_from", newDerivedFrom);
  };

  const getDerivedFromOptions = () => {
    return requirements.map((req) => ({
      value: req.id,
      label: `${req.id} - ${req.statement.substring(0, 50)}${
        req.statement.length > 50 ? "..." : ""
      }`,
    }));
  };

  return (
    <DokulyCard>
      <CardTitle titleText={"Information"} />

      <Container fluid>
        {(!item?.derived_from || item?.derived_from.length === 0) && (
          <Row className="align-items-center">
            <Col
              className="col-lg-6 col-xl-6"
              style={{ maxWidth: "260px", paddingTop: "10px" }}
            >
              <b>Parent requirement:</b>
            </Col>
            <Col>
              <GenericDropdownSelector
                state={parentRequirement ? parentRequirement.id : ""}
                setState={handleParentRequirementChange}
                dropdownValues={getParentRequirementOptions()}
                placeholder={
                  isTopLevelRequirement
                    ? "Top level requirement"
                    : "Select parent requirement"
                }
                borderIfPlaceholder={!isTopLevelRequirement}
                readOnly={readOnly || 
                  ((item?.derived_from.length === 0 && item?.state === "Approved") || (item?.derived_from.length === 0 && item?.state === "Rejected"))
                }
                textSize="16px"
                onHoverTooltip={true}
                tooltipText={
                  parentRequirement
                    ? `${parentRequirement?.id} - ${parentRequirement?.statement}`
                    : ""
                }
              />
            </Col>
            {Number.isInteger(parentRequirement?.id) && (
              <NavigateButton
                onNavigateClick={() =>
                  navigate(`/requirement/${parentRequirement.id}`)
                }
              />
            )}
          </Row>
        )}

        {!item?.parentRequirement &&
          !(
            (item?.derived_from.length === 0 && item?.state === "Approved") ||
            (item?.derived_from.length === 0 && item?.state === "Rejected")
          ) && (
            <Row className="align-items-top">
              <Col
                className="col-lg-6 col-xl-6"
                style={{ maxWidth: keyColumnMaxWidth, paddingTop: rowPadding }}
              >
                <b>Derived from:</b>
              </Col>
              <Col>
                <GenericMultiSelector
                  state={item?.derived_from || []}
                  setState={handleDerivedFromChange}
                  dropdownValues={getDerivedFromOptions()}
                  placeholder="Select requirements"
                  borderIfPlaceholder={false}
                  readOnly={readOnly}
                  textSize="16px"
                  onHoverTooltip={true}
                />
              </Col>
            </Row>
          )}

        {/* Cant be superseded with subrequirements. Cant be superseded if it is verified.*/}
        {((item?.superseded_by !== null) || 
          (number_of_subrequirements !== -1 && !item?.is_verified && item?.state !== "Approved" && item?.state !== "Rejected")) && (
          <Row className="align-items-center">
            <Col
              className="col-lg-6 col-xl-6"
              style={{ maxWidth: "260px", paddingTop: "10px" }}
            >
              <b>Superseded by:</b>
            </Col>
            <Col>
              <GenericDropdownSelector
                state={superseedingRequirement ? superseedingRequirement.id : ""}
                setState={handleSuperseedingRequirementChange}
                dropdownValues={getSuperseedingRequirementOptions()}
                placeholder={"--"}
                //borderIfPlaceholder={!isTopLevelRequirement}
                readOnly={readOnly || 
                  (item?.state === "Approved") || (item?.state === "Rejected")
                }
                textSize="16px"
                onHoverTooltip={true}
                tooltipText={
                  superseedingRequirement
                    ? `${superseedingRequirement?.id} - ${superseedingRequirement?.statement}`
                    : ""
                }
              />
            </Col>
            {Number.isInteger(superseedingRequirement?.id) && (
              <NavigateButton
                onNavigateClick={() =>
                  navigate(`/requirement/${superseedingRequirement?.id}`)
                }
              />
            )}
          </Row>
        )}

        <Row className="align-items-center">
          <Col
            className="col-lg-6 col-xl-6"
            style={{ maxWidth: keyColumnMaxWidth, paddingTop: rowPadding }}
          >
            <b>Obligation level:</b>
          </Col>
          <Col>
            <GenericDropdownSelector
              state={item?.obligation_level || ""}
              setState={(newObligationLevel) =>
                changeField("obligation_level", newObligationLevel)
              }
              dropdownValues={OBLIGATION_LEVEL_OPTIONS}
              placeholder="Select Obligation Level"
              borderIfPlaceholder={true}
              readOnly={readOnly || 
                ((item?.derived_from.length === 0 && item?.state === "Approved") || (item?.derived_from.length === 0 && item?.state === "Rejected"))
              }
              textSize="16px"
            />
          </Col>
        </Row>

        <Row className="align-items-center">
          <Col
            className="col-lg-6 col-xl-6"
            style={{ maxWidth: keyColumnMaxWidth, paddingTop: rowPadding }}
          >
            <b>Requirement type:</b>
          </Col>
          <Col>
            <GenericDropdownSelector
              state={item?.type || ""}
              setState={handleTypeChange}
              dropdownValues={TYPE_OPTIONS}
              placeholder="Select Type"
              borderIfPlaceholder={true}
              readOnly={readOnly || 
                ((item?.derived_from.length === 0 && item?.state === "Approved") || (item?.derived_from.length === 0 && item?.state === "Rejected"))
              }
              textSize="16px"
            />
          </Col>
        </Row>

        <Row className="align-items-center">
          <Col
            className="col-lg-6 col-xl-6"
            style={{ maxWidth: keyColumnMaxWidth, paddingTop: rowPadding }}
          >
            <b>Verification class:</b>
          </Col>
          <Col>
            <GenericDropdownSelector
              state={item?.verification_class || ""}
              setState={handleVerificationClassChange}
              dropdownValues={VERIFICATION_CLASS_OPTIONS}
              placeholder="Select Verification Class"
              borderIfPlaceholder={true}
              readOnly={readOnly || 
                ((item?.derived_from.length === 0 && item?.state === "Approved") || (item?.derived_from.length === 0 && item?.state === "Rejected"))
              }
              textSize="16px"
            />
          </Col>
        </Row>

        <Row className="align-items-center">
          <Col
            className="col-lg-6 col-xl-6"
            style={{ maxWidth: keyColumnMaxWidth, paddingTop: rowPadding }}
          >
            <b>State:</b>
          </Col>
          <Col>
            <GenericDropdownSelector
              state={item?.state || ""}
              setState={handleRequirementStateChange}
              dropdownValues={STATE_OPTIONS}
              placeholder="Select State"
              borderIfPlaceholder={true}
              readOnly={readOnly}
              textSize="16px"
            />
          </Col>
        </Row>

        <Row className="mt-2 align-items-top">
          <Col className="col-lg-6 col-xl-6">
            <b>Tags</b>
          </Col>
        </Row>
        <Row className="mt-2 align-items-top">
          <Col className="col-auto">
            <DokulyTags
              tags={item?.tags ?? []}
              onChange={handleTagsChange}
              readOnly={readOnly}
              project={project}
              setRefresh={setRefresh}
            />
          </Col>
        </Row>

        {created_by !== null && created_by !== undefined && (
          <Row className="align-items-center">
            <Col
              className="col-lg-6 col-xl-6"
              style={{ maxWidth: keyColumnMaxWidth, paddingTop: rowPadding }}
            >
              <b>Created by:</b>
            </Col>
            <Col
              style={{ textAlign: "left" }}
            >{`${created_by?.first_name} ${created_by?.last_name}`}</Col>
          </Row>
        )}

        {quality_assurance !== null &&
          quality_assurance !== undefined &&
          item?.is_verified && (
            <Row className="align-items-center">
              <Col
                className="col-lg-6 col-xl-6"
                style={{ maxWidth: keyColumnMaxWidth, paddingTop: rowPadding }}
              >
                <b>Verified by:</b>
              </Col>
              <Col
                style={{ textAlign: "left" }}
              >{`${quality_assurance?.first_name} ${quality_assurance?.last_name}`}</Col>
            </Row>
          )}

        {number_of_subrequirements !== -1 && (
          <Row className="align-items-center">
            <Col
              className="col-lg-6 col-xl-6"
              style={{ maxWidth: keyColumnMaxWidth, paddingTop: rowPadding }}
            >
              <b>Number of subrequirements:</b>
            </Col>
            <Col style={{ textAlign: "left" }}>{number_of_subrequirements}</Col>
          </Row>
        )}

        {last_updated !== "" && (
          <Row className="align-items-center">
            <Col
              className="col-lg-6 col-xl-6"
              style={{ maxWidth: keyColumnMaxWidth, paddingTop: rowPadding }}
            >
              <b>Last modified:</b>
            </Col>
            <Col style={{ textAlign: "left" }}>
              {moment(last_updated).format("HH:mm D.M.Y")}
            </Col>
          </Row>
        )}

        {Object.keys(additional_fields).length > 0 &&
          renderAdditionalFields(additional_fields, keyColumnMaxWidth)}

        {!readOnly && (
          <Row className="align-items-center">
            {(item?.state === "Draft") && (
              <DeleteButton
                onDelete={handleDelete}
                textSize={"10px"}
                iconWidth={"20px"}
              />
            )}
          </Row>
        )}
      </Container>
    </DokulyCard>
  );
};

export default RequirementInfoCard;
