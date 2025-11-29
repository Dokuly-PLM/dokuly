import React, { Fragment, useState, useEffect } from "react";
import EcoTable from "./ecoTable";

export default function EcoDashboard() {
  const [refresh, setRefresh] = useState(false);

  useEffect(() => {
    if (refresh === true) {
      setRefresh(false);
    }
  }, [refresh]);

  return (
    <Fragment>
      <div className="row justify-content-center">
        {/* <h1 style={{ marginTop: "1rem" }}>ECOs</h1> */}
      </div>
      <div className="row justify-content-center">
        <EcoTable refresh={refresh} setRefresh={setRefresh} />
      </div>
    </Fragment>
  );
}
