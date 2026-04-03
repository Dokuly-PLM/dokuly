import React, { Fragment, useState, useEffect } from "react";
import PartsTable from "./partsTable3";

export default function PartDashboard() {
  const [refresh, setRefresh] = useState(false);

  useEffect(() => {
    if (refresh === true) {
      setRefresh(false);
    }
  }, [refresh]);

  return (
    <Fragment>
      <div className="row justify-content-center">
      </div>
      <div className="row justify-content-center">
        <PartsTable refresh={refresh} setRefresh={setRefresh} />
      </div>
    </Fragment>
  );
}
