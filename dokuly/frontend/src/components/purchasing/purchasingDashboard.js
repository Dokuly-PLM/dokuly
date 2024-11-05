import React, { Fragment } from "react";
import PurchaseOrderTable from "./purchaseOrderTable";

export default function PurchasingDashboard() {
  return (
    <Fragment>
      <div className="row justify-content-center">
        {/* <h1 style={{ marginTop: "1rem" }}>Procurement - Preview</h1> */}
      </div>
      <div className="row justify-content-center">
        <PurchaseOrderTable />
      </div>
    </Fragment>
  );
}
