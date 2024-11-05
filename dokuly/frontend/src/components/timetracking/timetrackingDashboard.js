import React, { Fragment } from "react";
import TimetrackingComponent from "./timetrackingComponent2";

export default function TimetrackingDashboard() {
  return (
    <Fragment>
      <div className="row justify-content-center">
        {/* <h1 style={{ marginTop: "1rem" }}>Timesheet</h1> */}
      </div>
      <div className="row justify-content-center">
        <TimetrackingComponent />
      </div>
    </Fragment>
  );
}
