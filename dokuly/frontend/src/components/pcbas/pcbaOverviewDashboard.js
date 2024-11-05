import React, { Fragment, useEffect, useState } from "react";
import PcbaTable from "./pcbaTable";

export default function PcbaDashboard() {
  const [refresh, setRefresh] = useState(true);

  useEffect(() => {
    if (refresh === true) {
      setRefresh(false);
    }
  }, [refresh]);

  return (
    <Fragment>
      <div className="row justify-content-center">
        {/* <h1 style={{ marginTop: "1rem" }}>PCBA</h1> */}
      </div>
      <div className="row justify-content-center">
        <PcbaTable refresh={refresh} setRefresh={setRefresh} />
      </div>
    </Fragment>
  );
}
