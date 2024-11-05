import React, { Fragment } from "react";
import RequirementSetTable from "./requirementSetTable";

export default function RequirementDashboard() {
  document.title = "Requirements | Dokuly";

  return (
    <Fragment>
      <div className="row justify-content-center">
        {/* <h1 style={{ marginTop: "1rem" }}>Procurement - Preview</h1> */}
      </div>
      <div className="row justify-content-center">
        <RequirementSetTable />
      </div>
    </Fragment>
  );
}
