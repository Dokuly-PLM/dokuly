import React, { useState, useEffect } from "react";
import SpecificationsTable from "./specificationsTable";
import LegacyCustomSpecifications from "./legacyCustomSpecs";

const PartSpecs = (props) => {
  return (
    <div className="card-body bg-white m-3 card rounded">
      <div className="row">
        <SpecificationsTable part={props.part} setRefresh={props.setRefresh} />
        <LegacyCustomSpecifications part={props.part} />
      </div>
    </div>
  );
};

export default PartSpecs;
