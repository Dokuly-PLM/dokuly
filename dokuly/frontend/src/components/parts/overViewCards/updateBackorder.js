import React, { useState, useEffect } from "react";
import { updateBackorder } from "./../functions/queries";

const UpdateBackorder = (props) => {
  const [partDetailed, setPartDetailed] = useState(
    props.part != undefined ? props.part : null
  );
  const [refetch, setRefetch] = useState(false);
  const [loading, setLoading] = useState(
    props.part != undefined ? false : true
  );
  const [newQuantity, setNewQuantity] = useState(
    props.part.backorder_quantity != undefined &&
      props.part.backorder_quantity != null
      ? props.part.backorder_quantity
      : 0
  );

  const updateBackorderR = () => {
    if (newQuantity == 0) {
      if (confirm("New value is 0. Are you sure this is correct?")) {
      }
    } else if (newQuantity < 0) {
      alert("Cannot set quantity to a negative number");
      return;
    } else {
      const part = {
        backorder_quantity: newQuantity,
      };
      updateBackorder(partDetailed.id, part)
        .then((res) => {
          setLoading(true);
          setPartDetailed(res.data);
        })
        .finally(() => {
          setLoading(false);
        });
    }
    setNewQuantity(0);
  };

  useEffect(() => {}, [refetch]);

  return (
    <div className="card-body bg-white m-3 card rounded shadow">
      <h5>
        <b>Backorder</b>
      </h5>
      {loading ? (
        <div
          style={{ margin: "5rem" }}
          className="d-flex m-5 dokuly-primary justify-content-center"
        >
          <div className="spinner-border" role="status"></div>
        </div>
      ) : (
        <div>
          <div className="row">
            <div className="col">
              <div className="row ml-1">
                <h6>
                  <b>Quantity on backorder:</b>
                </h6>
                <h6 style={{ marginLeft: "1rem" }}>
                  {partDetailed.backorder_quantity
                    ? partDetailed.backorder_quantity
                    : 0}
                </h6>
              </div>
            </div>
          </div>
          <div className="row ml-1" style={{ marginTop: "0.75rem" }}>
            <h6 style={{ marginTop: "0.5rem" }}>
              <b>Update Quantity:</b>
            </h6>
            <div className="col-md-4">
              <input
                className="form-control"
                type="number"
                name="backorder_quantity"
                value={newQuantity}
                onChange={(e) => setNewQuantity(e.target.value)}
                placeholder="Qty..."
              />
            </div>
          </div>
          <div
            className="row"
            style={{ marginTop: "0.75rem", marginLeft: "0.17rem" }}
          >
            <button
              className="btn btn-sm btn-info"
              onClick={() => {
                updateBackorderR();
              }}
            >
              <img
                className="icon-tabler"
                src="../../../static/icons/check.svg"
                alt="icon"
              />
              Submit
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UpdateBackorder;
