import React, { Fragment } from "react";
import SuppliersTable from "./suppliersTable";

export default function SuppliersDashboard() {
  return (
    <Fragment>
      <div className="row justify-content-center">
        {/* <h1 style={{ marginTop: "1rem" }}>Suppliers</h1> */}
      </div>
      <div className="row justify-content-center">
        <SuppliersTable />
      </div>
    </Fragment>
  );
}
