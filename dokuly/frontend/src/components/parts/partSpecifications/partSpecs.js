import React from "react";
import SpecificationsTable from "./specificationsTable";

const PartSpecs = (props) => {
  return (
      <div className="row">
        <SpecificationsTable part={props.part} setRefresh={props.setRefresh} />
      </div>
  );
};

export default PartSpecs;
