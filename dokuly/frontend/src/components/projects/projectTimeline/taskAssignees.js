import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  generateRandomColorWithContrast,
  getBestTextColor,
} from "../../dokuly_components/dokulyTags/dokulyTags";
import ProfileIcon from "../../layout/profileIcon";
import Select, { components, createFilter } from "react-select";
import AddButton from "../../dokuly_components/AddButton";
import { Row } from "react-bootstrap";

export const SelectOption = (props) => {
  const { color, label } = props.data;
  const textColor = color ? getBestTextColor(color) : "#fff";
  const [firstName, lastName] = label.split(" ");

  return (
    <components.Option {...props}>
      <Row className="align-items-center">
        <ProfileIcon
          firstName={firstName}
          lastName={lastName}
          backgroundColor={color}
          color={textColor}
          className="mr-2 mt-1 mb-1 ml-2"
        />
        <b>{label}</b>
      </Row>
    </components.Option>
  );
};

export const Assignee = ({ assignee, onRemove, style }) => {
  const { first_name, last_name, color } = assignee;
  const textColor = color ? getBestTextColor(color) : "#fff";

  return (
    <div onClick={onRemove} style={style}>
      <ProfileIcon
        firstName={first_name}
        lastName={last_name}
        backgroundColor={color}
        color={textColor}
        onClick={() => onRemove(assignee)}
      />
    </div>
  );
};

const TaskAssignees = ({
  taskAssignees = [],
  projectMembers = [],
  addButtonText = "Add assignee",
  placeholder = "Search for a member",
  handleAddTaskAssignee = () => {},
  handleRemoveTaskAssignee = () => {},
  handleKeyDown = () => {},
}) => {
  const [editMode, setEditMode] = useState(false);
  const [formattedOptions, setFormattedOptions] = useState([]);
  const [inputValue, setInputValue] = useState("");

  const selectRef = useRef(null); // Create a ref for the Select component

  const formatAssignees = (assignee) => {
    if (assignee?.profile) {
      assignee = assignee.profile;
    }
    return {
      label: `${assignee.first_name} ${assignee.last_name}`,
      value: assignee.id,
      color: assignee.color
        ? assignee.color
        : generateRandomColorWithContrast(),
    };
  };

  const handleInputChange = (value) => {
    setInputValue(value);
  };

  const customStyles = {
    control: (styles) => ({
      ...styles,
      borderColor: "#ccc",
      boxShadow: "none",
      "&:hover": { borderColor: "#aaa" },
    }),
    menuPortal: (base) => ({
      ...base,
      zIndex: 9999, // Ensure the menu portal has a high z-index
    }),
  };

  useEffect(() => {
    if (editMode && selectRef.current) {
      selectRef.current.focus();
    }
  }, [editMode]);

  useEffect(() => {
    if (projectMembers) {
      const formatted = projectMembers.map((member) => {
        return formatAssignees(member);
      });
      setFormattedOptions(formatted);
    }
  }, [projectMembers]);

  // Assign colors to taskAssignees only once using useMemo
  const processedAssignees = useMemo(() => {
    return taskAssignees.map((assignee) => ({
      ...assignee,
      color: assignee.color || generateRandomColorWithContrast(),
    }));
  }, [taskAssignees]);

  return (
    <div>
      <div
        className="mb-2 mt-1"
        style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}
      >
        {processedAssignees
          .sort((a, b) => a?.first_name - b?.first_name)
          .map((assignee) => (
            <Assignee
              key={assignee?.id}
              assignee={assignee}
              onRemove={() => handleRemoveTaskAssignee(taskAssignees, assignee)}
              style={{
                marginTop: "0.65rem",
              }}
            />
          ))}
      </div>
      {editMode && (
        <Select
          className="mb-2 mt-1"
          ref={selectRef}
          components={{ Option: SelectOption }}
          value={null}
          inputValue={inputValue}
          onInputChange={handleInputChange}
          onChange={(option) => {
            if (option) {
              handleAddTaskAssignee(taskAssignees, option);
            }
          }}
          options={formattedOptions}
          styles={customStyles}
          isClearable
          placeholder={placeholder}
          menuPortalTarget={document.body}
          menuPosition="fixed"
          noOptionsMessage={() =>
            "No members found. Please try another search term."
          }
          onKeyDown={handleKeyDown}
          openMenuOnFocus={true}
        />
      )}
      <AddButton
        onClick={() => {
          setEditMode(true);
        }}
        buttonText={addButtonText}
      />
    </div>
  );
};

export default TaskAssignees;
