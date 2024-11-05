import React, { useEffect, useState } from "react";
import { Form } from "react-bootstrap";
import {
  newPartType,
  editPartType,
  deletePartType,
} from "../../../parts/functions/queries";
import { toast } from "react-toastify";

import { svgIcons } from "./svgIcons";
import DeleteButton from "../../../dokuly_components/deleteButton";
import SubmitButton from "../../../dokuly_components/submitButton";
import DokulyModal from "../../../dokuly_components/dokulyModal"; // Importing DokulyModal

const PartTypeForm = ({ show, onHide, setRefresh, partTypeSelected }) => {
  const defaultDefaultUnit = "pcs";
  const defaultPrefix = "PRT";

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [defaultUnit, setDefaultUnit] = useState(defaultDefaultUnit);
  const [selectedIcon, setSelectedIcon] = useState("");
  const [prefix, setPrefix] = useState(defaultPrefix);

  const resetStates = () => {
    setName("");
    setDescription("");
    setPrefix(defaultPrefix); // Reset prefix to default
    setDefaultUnit(defaultDefaultUnit); // Reset defaultUnit
  };

  const onDeletePartType = (item) => {
    if (!confirm("Are you sure you want to delete this part type?")) {
      return;
    }
    if (item?.id) {
      deletePartType(item?.id).then((res) => {
        if (res.status === 200) {
          toast.success("Part Type deleted successfully");
          resetStates();
          onHide();
          setRefresh(true);
        } else {
          toast.error("Error when deleting, check inputs and connection");
        }
      });
    }
  };

  const submit = () => {
    if (!name) {
      toast.error("Enter a name");
      return;
    }

    const data = {
      name: name,
      description: description,
      prefix: prefix,
      icon_url: `/static/icons/${selectedIcon}`,
      default_unit: defaultUnit, // Use default_unit for consistency with the model
    };

    if (partTypeSelected) {
      data.id = partTypeSelected.id;
      editPartType(data.id, data).then((res) => {
        // Use editPartType
        if (res.status === 200) {
          toast.success("Part Type updated successfully");
          resetStates();
          onHide(); // Hide modal
          setRefresh(true); // Refresh the page
        } else {
          toast.error("Error when saving, check inputs and connection");
        }
      });
    } else {
      newPartType(data).then((res) => {
        // Use newPartType
        if (res.status === 200) {
          toast.success("Part Type added successfully");
          resetStates();
          onHide(); // Hide modal
          setRefresh(true); // Refresh the page
        } else {
          toast.error("Error when saving, check inputs and connection");
        }
      });
    }
  };

  useEffect(() => {
    if (partTypeSelected) {
      setName(partTypeSelected.name);
      setDescription(partTypeSelected.description);
      setDefaultUnit(partTypeSelected.default_unit); // Set defaultUnit
      setPrefix(partTypeSelected.prefix || defaultPrefix); // Set prefix
      if (
        partTypeSelected?.icon_url == null ||
        partTypeSelected?.icon_url === undefined ||
        partTypeSelected?.icon_url === ""
      ) {
        setSelectedIcon("");
        return;
      }
      const icon = partTypeSelected.icon_url.split("/").pop();
      setSelectedIcon(icon);
    } else {
      setPrefix(defaultPrefix); // Reset prefix to default when creating a new part type
    }
  }, [partTypeSelected]);

  return (
    <DokulyModal show={show} onHide={onHide} title="Part Type Form" size="md">
      <Form>
        <Form.Group controlId="formName">
          <Form.Label>Name*</Form.Label>
          <Form.Control
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Form.Group>
        <Form.Group controlId="formPrefix">
          <Form.Label>Prefix *</Form.Label>
          <Form.Control
            type="text"
            value={prefix}
            onChange={(e) => setPrefix(e.target.value)}
          />
        </Form.Group>
        <Form.Group controlId="formDescription">
          <Form.Label>Description</Form.Label>
          <Form.Control
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Form.Group>
        <Form.Group controlId="formDefaultUnit">
          <Form.Label>Default Unit</Form.Label>
          <Form.Control
            type="text"
            value={defaultUnit}
            onChange={(e) => setDefaultUnit(e.target.value)}
          />
        </Form.Group>
        <Form.Group controlId="formIcon">
          <Form.Label>Icon</Form.Label>
          <div className="icon-grid">
            {svgIcons.map((icon) => (
              <img
                key={icon}
                src={`/static/icons/${icon}`}
                alt={icon}
                className={`icon-item ${
                  selectedIcon === icon ? "selected" : ""
                }`}
                onClick={() => setSelectedIcon(icon)}
              />
            ))}
          </div>
        </Form.Group>
      </Form>

      <div className="form-group mt-3 d-flex align-items-center">
        <SubmitButton
          onClick={submit}
          disabled={name === "" || prefix === ""}
          disabledTooltip={
            "Name and prefix must be entered. Mandatory fields are marked with *"
          }
        >
          Submit
        </SubmitButton>
        {partTypeSelected && (
          <DeleteButton onDelete={() => onDeletePartType(partTypeSelected)} />
        )}
      </div>
    </DokulyModal>
  );
};

export default PartTypeForm;
