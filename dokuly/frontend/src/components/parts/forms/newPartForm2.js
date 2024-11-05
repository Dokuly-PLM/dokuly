import React, { useState, useEffect } from "react";
import Select from "react-select";
import { toast } from "react-toastify";
import { Button, Col, Row } from "react-bootstrap";
import { fetchAPIKeyFromOrg } from "../../admin/functions/queries";
import { getActiveProjectByCustomer } from "../../projects/functions/queries";
import { newPart, sendMpnSearchToComponentVault } from "../functions/queries";
import { MpnSuggestions } from "./mpnSuggestions";
import { parse_cv_data } from "../functions/parseComponentVaultInformation";
import { get_active_customers } from "../../customers/funcitons/queries";
import SubmitButton from "../../dokuly_components/submitButton";
import { usePartTypes } from "../partTypes/usePartTypes";
import DokulyModal from "../../dokuly_components/dokulyModal";
import ExternalPartNumberFormGroup from "../../common/forms/externalPartNumberFormGroup";

/**
 * # Button with form to create a new part.
 */
const PartNewForm = (props) => {
  // Form Fields
  const [display_name, setDisplayName] = useState("");
  const [description, setDescription] = useState("");
  const [partType, setPartType] = useState(null);
  const [unit, setUnit] = useState("pcs");
  const [git_link, setGitLink] = useState("");
  const [price, setPrice] = useState(0.0);
  const [mpn, setMpn] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [datasheet, setDatasheet] = useState("");
  const [image_url, setImageUrl] = useState("");
  const [is_internal, setIsInternal] = useState(false);
  const [currency, setCurrency] = useState("USD");

  const [active_customers, setActiveCustomers] = useState(null);
  const [selected_customer_id, setSelectedCustomerId] = useState(-1);
  const [component_vault_id, setComponentVaultId] = useState(-1);

  const [projects, setProjects] = useState(null);
  const [selected_project_id, setSelectedProjectId] = useState(-1);

  const [componentVaultResults, setComponentVaultResults] = useState([]);

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearchResultSelected, setIsSearchResultSelected] = useState(false);
  const [componentVaultAPIKey, setComponentVaultAPIKey] = useState(null);

  const [price_history, setPriceHistory] = useState(null);
  const [part_information, setPartInformation] = useState(null);
  const [stock, setStock] = useState(null);
  const [urls, setUrls] = useState(null);

  const [externalPartNumber, setExternalPartNumber] = useState("");

  const [showModal, setShowModal] = useState(false);

  const partTypes = usePartTypes();

  const enter_part_information = (suggestion) => {
    if (suggestion == null) {
      return;
    }

    const information = parse_cv_data(suggestion);
    setIsSearchResultSelected(true);
    setMpn(information.mpn);
    setDisplayName(information.display_name);
    setDescription(information.description);
    setPrice(information.price);
    if (
      information.currency === null ||
      information.currency === undefined ||
      information.currency === ""
    ) {
      if (
        information.part_information.currency_price !== null &&
        information.part_information.currency_price !== undefined &&
        information.part_information.currency_price !== null &&
        information.part_information.currency_price !== ""
      ) {
        setCurrency(information.part_information.currency_price);
      }
    } else {
      setCurrency("USD");
    }
    setManufacturer(information.manufacturer);
    setDatasheet(information.datasheet_link);
    setImageUrl(information.image_link);
    setPriceHistory(information?.price_history);
    setPartInformation(information?.part_information);
    setStock(information?.stock);
    setUrls(information?.urls);
    setComponentVaultId(information?.component_vault_id);
  };

  const queryComponentVault = () => {
    if (mpn === null || mpn?.length === 0) {
      toast.info("Enter a mpn to search for matches");
      return;
    }
    sendMpnSearchToComponentVault({
      mpn: mpn.trim(),
      api_key: componentVaultAPIKey.toString().trim(),
    })
      .then((res) => {
        if (res.status === 200) {
          setComponentVaultResults(res.data);
          setShowSuggestions(true);
        }
        if (res.status === 204) {
          toast.info("No parts found with matching mpn!");
        }
      })
      .catch((err) => {
        if (err) {
          setShowSuggestions(false);
          setComponentVaultResults(null);
        }
      });
  };

  useEffect(() => {
    fetchAPIKeyFromOrg()
      .then((res) => {
        if (res.status === 200) {
          if (res?.data?.componentVaultAPIKey !== null) {
            setComponentVaultAPIKey(res.data.component_vault_api_key);
          }
        }
      })
      .catch((err) => {
        if (err) {
          setComponentVaultAPIKey(null);
        }
      });
  }, []);

  useEffect(() => {
    if (
      selected_customer_id !== null &&
      selected_customer_id !== undefined &&
      selected_customer_id !== -1
    ) {
      getActiveProjectByCustomer(selected_customer_id).then((res) => {
        if (res !== undefined) {
          setProjects(res.data);
        }
      });
    }
  }, [selected_customer_id]);

  const [isCtrlDown, setIsCtrlDown] = useState(false);

  useEffect(() => {
    const keydownHandler = (event) => {
      if (event.key === "Control" || event.key === "Meta") {
        setIsCtrlDown(true);
      } else if (event.key === "Enter" && isCtrlDown) {
        queryComponentVault();
      }
    };

    const keyupHandler = (event) => {
      if (event.key === "Control") {
        setIsCtrlDown(false);
      }
    };

    window.addEventListener("keydown", keydownHandler);
    window.addEventListener("keyup", keyupHandler);

    return () => {
      window.removeEventListener("keydown", keydownHandler);
      window.removeEventListener("keyup", keyupHandler);
    };
  }, [isCtrlDown]);

  const launchForm = () => {
    setShowModal(true);
    get_active_customers().then((res) => {
      setActiveCustomers(res.data);
    });
  };

  function onSubmit() {
    const data = {
      display_name: display_name,
      description: description,
      project: parseInt(selected_project_id),
      internal: is_internal,
      part_type: partType?.id,
      unit: unit,
      git_link: git_link,
      mpn: mpn,
      manufacturer: manufacturer,
      datasheet: datasheet,
      image_url: image_url,
      currency: currency,
      part_information: part_information,
      component_vault_id: component_vault_id,
      urls: urls,
      external_part_number: externalPartNumber,
    };

    newPart(data).then((res) => {
      if (res.status === 201) {
        resetFields();
        props.setRefresh(true);
        toast.success("Part created");
        if (props?.addSuggestedPartToBom) {
          props?.addSuggestedPartToBom(
            res.data,
            props?.row,
            props?.selectedRefdes,
            props?.dnm
          );
        }
      } else if (res.status === 208) {
        toast.error("MPN already exists in the database");
      }
    });
    setShowModal(false);
  }

  function resetFields() {
    setDisplayName("");
    setDescription("");
    setPartType("");
    setUnit("pcs");
    setGitLink("");
    setMpn("");
    setManufacturer("");
    setDatasheet("");
    setImageUrl("");
    setIsInternal(false);
    setIsSearchResultSelected(false);
    props?.setRefresh(true);
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
          value={description || ""}
        />
      </div>

      <ExternalPartNumberFormGroup
        externalPartNumber={externalPartNumber}
        setExternalPartNumber={setExternalPartNumber}
      />

      <div className="form-group">
        <label>Customer *</label>
        <select
          className="form-control"
          name="customer"
          type="number"
          onChange={(e) => setSelectedCustomerId(e.target.value)}
        >
          <option value="">Choose customer</option>
          {active_customers == null
            ? ""
            : active_customers
                .sort((a, b) => (a.customer_id > b.customer_id ? 1 : -1))
                .map((customer) => {
                  return (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  );
                })}
        </select>
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
                .sort((a, b) => (a.project_number > b.project_number ? 1 : -1))
                .map((project) => {
                  return (
                    <option key={project.id} value={project.id}>
                      {project.title}
                    </option>
                  );
                })}
        </select>
      </div>

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
      <div style={{ position: "relative" }}>
        <div className="form-group mb-2">
          <label>Manufacturer Part Number *</label>
          <Row>
            <Col>
              <input
                className="form-control"
                type="text"
                name="mpn"
                onChange={(e) => {
                  setMpn(e.target.value);
                }}
                value={mpn || ""}
              />
            </Col>
          </Row>
        </div>
      </div>

      {!showSuggestions ? (
        <div className="form-group">
          <label>Manufacturer</label>
          <input
            className="form-control"
            type="text"
            name="manufacturer"
            onChange={(e) => {
              setManufacturer(e.target.value);
            }}
            value={manufacturer || ""}
          />
        </div>
      ) : (
        <div style={{ height: "3rem", minHeight: "3rem", maxHeight: "5rem" }} />
      )}
      <div className="form-group">
        <label>Datasheet link</label>
        <input
          className="form-control"
          type="text"
          name="datasheet"
          onChange={(e) => {
            setDatasheet(e.target.value);
          }}
          value={datasheet || ""}
          title="A URL to a web-hosted datasheet."
        />
      </div>
    </div>
  );

  return (
    <div className="container-fluid">
      <button
        type="button"
        className="btn btn-bg-transparent mt-2 mb-2"
        onClick={() => launchForm()}
      >
        <div className="row">
          <img
            className="icon-dark"
            src="../../static/icons/circle-plus.svg"
            alt="icon"
          />
          <span className="btn-text">
            {props?.title ? props?.title : "New part"}
          </span>
        </div>
      </button>

      <DokulyModal
        show={showModal}
        onHide={() => setShowModal(false)}
        title="Create new part"
      >
        <div className="form-group">
          <label>Display name *</label>
          <input
            className="form-control"
            type="text"
            name="display_name"
            onChange={(e) => {
              setDisplayName(e.target.value);
            }}
            value={display_name || ""}
          />
        </div>

        <div className="form-group">
          <div className="form-check form-switch">
            <input
              className="form-check-input"
              type="checkbox"
              id="isInternalCheckbox"
              checked={is_internal}
              onChange={(e) => setIsInternal(e.target.checked)}
            />
            <label className="form-check-label" htmlFor="isInternalCheckbox">
              Internal part
            </label>
            <small className="form-text text-muted">
              Check this box if the part comes from your own organization. Leave
              it unchecked if the part is bought from external suppliers.
            </small>
          </div>
        </div>

        {is_internal === ""
          ? ""
          : is_internal === true
          ? internalOptions
          : externalOptions}
        <div className="form-group">
          <label>Part type *</label>
          {partTypes.length === 0 || partTypes === undefined ? (
            <div style={{ border: "1px solid red", padding: "10px" }}>
              <p>No part types exist. Create a new part type.</p>
              <Button
                href="#/adminPage/parts"
                className="btn dokuly-bg-primary"
                style={{ color: "white" }}
                onClick={() => {
                  setShowModal(false);
                }}
              >
                Create new part type
              </Button>
            </div>
          ) : (
            <select
              className="form-control"
              name="part_type"
              value={partType ? partType?.name : ""}
              onChange={(e) => {
                const selectedPartType = partTypes.find(
                  (pt) => pt.name === e.target.value
                );
                setPartType(selectedPartType || null);
                setUnit(selectedPartType?.default_unit || "pcs");
              }}
            >
              <option value="">Select part type</option>
              {partTypes.map((pt) => (
                <option key={pt.name} value={pt.name}>
                  {pt.name}
                </option>
              ))}
            </select>
          )}
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
            value={unit || ""}
          />
        </div>
        <div className="form-group">
          <SubmitButton
            type="submit"
            disabled={
              partType === null ||
              partType === undefined ||
              display_name === "" ||
              (is_internal === true && selected_project_id === -1) ||
              (is_internal === false && mpn === "")
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
        </div>
      </DokulyModal>
    </div>
  );
};

export default PartNewForm;
