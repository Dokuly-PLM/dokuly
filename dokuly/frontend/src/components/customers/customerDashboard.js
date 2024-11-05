import React, { Fragment, useState, useEffect } from "react";
import CustomerNewForm from "./forms/customerNewForm";
import CustomersTable from "./customersTable";

export default function CustomersDashboard() {
  const [refresh, setRefresh] = useState(false);

  useEffect(() => {
    if (refresh === true) setRefresh(false);
  }, [refresh]);

  return (
    <Fragment>
      <div className="row justify-content-center">
        {/* <h1 style={{ marginTop: "1rem" }}>Customers</h1> */}
      </div>
      <div className="row justify-content-center">
        <CustomersTable setRefresh={setRefresh} refresh={refresh} />
      </div>
    </Fragment>
  );
}
