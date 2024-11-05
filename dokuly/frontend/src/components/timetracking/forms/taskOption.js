import React from "react";
import Select, { components, createFilter } from "react-select";
import {
  generateRandomColorWithContrast,
  getBestTextColor,
} from "../../dokuly_components/dokulyTags/dokulyTags";
import ProfileIcon from "../../layout/profileIcon";

const TaskOption = (props) => {
  const { label, assignees } = props.data;

  return (
    <components.Option {...props}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        {/* Task Name */}
        <span>{label}</span>

        {/* Assignees */}
        <div style={{ display: "flex", gap: "5px" }}>
          {assignees && assignees.length > 0 ? (
            assignees.map((assignee) => {
              const firstName = assignee.first_name || "";
              const lastName = assignee.last_name || "";
              const color = assignee.color;
              const textColor = getBestTextColor(color);

              return (
                <ProfileIcon
                  key={assignee.id}
                  firstName={firstName}
                  lastName={lastName}
                  backgroundColor={color}
                  color={textColor}
                  size={20}
                />
              );
            })
          ) : (
            <span style={{ fontSize: "0.8em", color: "#888" }}>
              No assignees
            </span>
          )}
        </div>
      </div>
    </components.Option>
  );
};

export default TaskOption;
