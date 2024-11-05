import React, { Fragment, useState, useEffect } from "react";
import AssembliesTable from "./assembliesTable2";

export default function AssemblyDashboard() {
  const [refresh, setRefresh] = useState(false);

  useEffect(() => {
    if (refresh === true) {
      setRefresh(false);
    }
  }, [refresh]);

  return (
    <Fragment>
      <div className="row justify-content-center">
        {/* <h1 style={{ marginTop: "1rem" }}>Assemblies</h1> */}
      </div>
      <div className="row justify-content-center">
        <AssembliesTable refresh={refresh} setRefresh={setRefresh} />
      </div>
    </Fragment>
  );
}
