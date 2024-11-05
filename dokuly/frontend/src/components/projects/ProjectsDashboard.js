import React, { Fragment, useState } from "react";
import ProjectsTable from "./projectsTable2";

import ErrorBoundary from "../common/errorBoundaries";

export default function ProjectsDashboard() {
  const [refresh, setRefresh] = useState(false);

  return (
    <Fragment>
      <div className="row justify-content-center">
        {/* <h1 style={{ marginTop: "1rem" }}>Projects</h1> */}
      </div>
      <div className="row justify-content-center">
        <ErrorBoundary>
          <ProjectsTable />
        </ErrorBoundary>
      </div>
    </Fragment>
  );
}
