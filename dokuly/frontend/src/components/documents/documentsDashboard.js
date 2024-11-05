import React, { Fragment } from "react";
import DocumentsOverviewTable2 from "./DocumentsOverviewTable2";

export default function DocumentsDashboard() {
  return (
    <Fragment>
      <div className="row justify-content-center">
        {/* <h1 style={{ marginTop: "1rem" }}>Documents</h1> */}
      </div>
      <div className="row justify-content-center">
        <DocumentsOverviewTable2 />
      </div>
    </Fragment>
  );
}
