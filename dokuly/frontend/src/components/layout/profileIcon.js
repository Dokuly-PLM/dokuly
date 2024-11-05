import React from "react";

const ProfileIcon = ({
  firstName = "",
  lastName = "",
  backgroundColor = "#165216ff",
  color = "#fff",
  className = "",
}) => {
  return (
    <div
      style={{
        display: "inline-flex",
        justifyContent: "center",
        alignItems: "center",
        height: "40px",
        width: "40px",
        borderRadius: "50%",
        backgroundColor: backgroundColor,
        color: color,
        fontWeight: "bold",
        textDecoration: "none",
        border: "none",
      }}
      data-toggle="tooltip"
      data-placement="top"
      title={`${firstName} ${lastName}`}
      className={className}
    >
      {firstName?.[0] ?? ""}
      {lastName?.[0] ?? ""}
    </div>
  );
};

export default ProfileIcon;
