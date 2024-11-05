import React, { useState, useEffect } from "react";
import { Row, Col } from "react-bootstrap";
import {
  addInventory,
  fetchLocations,
  fetchOwners,
  fetchStock,
  getOnOrder,
} from "../functions/queries";
import Select from "react-select";
import { toast } from "react-toastify";
import DokulyCard from "../../dokuly_components/dokulyCard";
import CardTitle from "../../dokuly_components/cardTitle";
import { loadingSpinner } from "../../admin/functions/helperFunctions";

const InventoryCard = (props, release_state = "") => {
  const [partDetailed, setPartDetailed] = useState(
    props.part !== undefined && props.part !== null ? props.part : null,
  );
  const [partsOnOrder, setPartsOnOrder] = useState(0);
  const [refetch, setRefetch] = useState(true);
  const [quantityChange, setQuantityChange] = useState(0);
  const [partStockList, setPartStockList] = useState([]);
  const [location, setLocation] = useState({ key: "", value: "", label: "" });
  const [owner, setOwner] = useState({ key: "", value: "", label: "" });
  const [quantity, setQuantity] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loading2, setLoading2] = useState(true);
  const [allOwners, setAllOwners] = useState([]);
  const [allLocations, setAllLocations] = useState([]);

  const updateStock = (stockEntry, quantity) => {
    if (quantityChange < 0) {
      if (
        confirm(
          "Are you about to use this part? Confirm to remove from inventory",
        )
      ) {
        const inventoryEntry = {
          part: partDetailed.id,
          owner: stockEntry.owner.id,
          location: stockEntry.location.id,
          quantity: quantity,
        };
        addInventory(inventoryEntry)
          .then((res) => {
            if (res.status === 200 || res.status === 201) {
              toast.success("Inventory updated!");
            }
            setTimeout(console.log("Saving to db..."), 300);
          })
          .finally(() => {
            setLoading(false);
            setQuantityChange(0);
            setRefetch(true);
          });
      } else {
        return;
      }
    } else {
      const inventoryEntry = {
        part: partDetailed.id,
        owner: stockEntry.owner.id,
        location: stockEntry.location.id,
        quantity: quantity,
      };
      addInventory(inventoryEntry)
        .then((res) => {
          if (res.status === 200 || res.status === 201) {
            toast.success("Inventory updated!");
          }
          setTimeout(console.log("Saving to db..."), 300);
        })
        .finally(() => {
          setLoading(false);
          setQuantityChange(0);
          setRefetch(true);
        });
    }
  };

  const onSubmit = () => {
    if (owner.label === "" || location.label === "" || quantity.label === "") {
      alert("Please select an owner, a location and a quantity other than 0");
      return;
    }

    const inventoryEntry = {
      part: partDetailed.id,
      owner: owner.key,
      location: location.key,
      quantity: quantity,
    };
    addInventory(inventoryEntry)
      .then((res) => {
        if (res.status === 200 || res.status === 201) {
          toast.success("Inventory updated!");
        }
      })
      .finally(() => {
        setLoading(false);
        setQuantityChange(0);
        setOwner("");
        setLocation("");
        setRefetch(true);
      });
  };

  useEffect(() => {
    if (props.part !== null && props.part !== undefined) {
      setPartDetailed(props.part);
      setRefetch(true);
    }
    if (partDetailed !== null && refetch) {
      getOnOrder(partDetailed.id).then((res) => {
        if (res.status === 200) {
          setPartsOnOrder(res.data?.quantity);
        }
      });

      fetchStock(partDetailed.id)
        .then((res) => {
          setPartStockList(res.data);
          fetchOwners().then((res2) => {
            setAllOwners(res2.data);
          });
          fetchLocations()
            .then((res3) => {
              setAllLocations(res3.data);
            })
            .finally(() => [setLoading2(false)]);
        })
        .finally(() => {
          setLoading(false);
        });
    }
    setRefetch(false);
  }, [props, refetch]);

  const locationOptions = allLocations?.map((location) => {
    return {
      label: location?.name,
      value: location.id,
      key: location.id,
    };
  });
  const ownerOptions = allOwners.map((owner) => {
    return {
      label: owner?.name,
      value: owner.id,
      key: owner.id,
    };
  });

  if (loading) {
    return loadingSpinner();
  }

  return (
    <Col className="p-0" style={{ marginRight: "2rem" }}>
      <DokulyCard
        isCollapsed={
          partStockList == null ||
          partStockList === undefined ||
          partStockList?.length === 0
        }
        expandText={"Add inventory"}
      >
        <CardTitle titleText={"Inventory"} style={{ marginLeft: "-0.15rem" }} />
        {loading || loading2 ? (
          <div
            style={{ margin: "5rem" }}
            className="d-flex m-5 dokuly-primary justify-content-center"
          >
            <div className="spinner-border" role="status" />
          </div>
        ) : (
          <div>
            <table
              className="table table-responsive table-hover"
              style={{ borderBottom: "1.5px solid grey" }}
            >
              {partStockList != null &&
                partStockList !== undefined &&
                partStockList?.length !== 0 && (
                  <thead>
                    <tr>
                      <th width="30%">Location</th>
                      <th width="25%">Owner</th>
                      <th width="15%">Quantity</th>
                      <th width="25%">Actions</th>
                    </tr>
                  </thead>
                )}
              <tbody>
                {partStockList != null &&
                partStockList !== undefined &&
                partStockList?.length !== 0 ? (
                  partStockList.map((stock) => {
                    return stock?.quantity !== 0 ? (
                      <tr key={stock?.location.id}>
                        <td>{stock?.location.name}</td>
                        <td>{stock?.owner.name}</td>
                        <td>{stock?.quantity}</td>
                        <td className="text-center">
                          <div className="form-group">
                            <div className="row">
                              <div className="col">
                                <input
                                  className="form-control"
                                  type="number"
                                  name="quantityChange"
                                  onChange={(e) =>
                                    setQuantityChange(e.target.value)
                                  }
                                />
                              </div>
                              {/* biome-ignore lint/a11y/useKeyWithClickEvents: Dont want btn here */}
                              <div
                                className="col"
                                style={{ cursor: "pointer" }}
                                onClick={() => {
                                  updateStock(stock, quantityChange);
                                }}
                              >
                                {quantityChange >= 0 ? (
                                  <img
                                    src="../../static/icons/circle-plus.svg"
                                    alt="plus"
                                    className="d-inline-block align-middle"
                                    width="30"
                                    height="30"
                                  />
                                ) : (
                                  <img
                                    src="../../static/icons/circle-minus.svg"
                                    alt="minus"
                                    className="d-inline-block align-middle"
                                    width="30"
                                    height="30"
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      ""
                    );
                  })
                ) : (
                  <div className="ml-4 mb-2">
                    No current inventory for this part
                  </div>
                )}
              </tbody>
            </table>
            <div className="ml-2">
              {partsOnOrder > 0 && (
                <span>
                  On order: {partsOnOrder} {partDetailed?.unit}
                </span>
              )}
            </div>
            <div className="modal-body">
              <Row className="align-items-center mb-2">
                <h5>Add Inventory</h5>
                <button
                  className="btn dokuly-btn-transparent ml-2"
                  style={{ cursor: "pointer" }}
                  type="button"
                  onClick={() => {
                    setLoading(true);
                    onSubmit();
                  }}
                >
                  {quantity >= 0 ? (
                    <img
                      src="../../static/icons/circle-plus.svg"
                      alt="plus"
                      className="d-inline-block align-middle"
                      width="30"
                      height="30"
                    />
                  ) : (
                    <img
                      src="../../static/icons/circle-minus.svg"
                      alt="minus"
                      className="d-inline-block align-middle"
                      width="30"
                      height="30"
                    />
                  )}
                </button>
              </Row>
              <form>
                <div className="row">
                  <div className="col col-5">
                    <Select
                      name="location"
                      placeholder="Location"
                      value={location}
                      options={locationOptions}
                      onChange={(e) => setLocation(e)}
                      style={{ marginLeft: "0.5rem" }}
                      menuPortalTarget={document.body}
                      styles={{
                        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                      }}
                    />
                  </div>
                  <div className="col col-5">
                    <Select
                      name="owner"
                      placeholder="owner"
                      value={owner}
                      options={ownerOptions}
                      onChange={(e) => setOwner(e)}
                      style={{ marginLeft: "0.5rem" }}
                      menuPortalTarget={document.body}
                      styles={{
                        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                      }}
                    />
                  </div>
                  <div className="col col-2">
                    <input
                      className="form-control"
                      style={{ minWidth: "60px" }}
                      type="number"
                      name="quantity"
                      onChange={(e) => setQuantity(e.target.value)}
                      value={quantity}
                      placeholder="Qty"
                    />
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </DokulyCard>
    </Col>
  );
};

export default InventoryCard;
