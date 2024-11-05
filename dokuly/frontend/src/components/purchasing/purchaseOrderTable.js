import React, { useState, useEffect, useContext } from "react";
import { Row, Col } from "react-bootstrap";

import { getPurchaseOrders } from "./functions/queries";
import { getSuppliers } from "../suppliers/functions/queries";
import NewPurchaseOrderForm from "./forms/newPurchaseOrderForm";
import { getOrganizationCurrency } from "../parts/functions/queries";
import { AuthContext } from "../App";
import DokulyPriceFormatter from "../dokuly_components/formatters/priceFormatter";
import DokulyTable from "../dokuly_components/dokulyTable/dokulyTable";
import { ThumbnailFormatter } from "../dokuly_components/dokulyTable/functions/formatters";
import { getTotalPOPrice } from "./overviewTab/information";
import useOrganization from "../common/hooks/useOrganization";
import { loadingSpinner } from "../admin/functions/helperFunctions";
import { releaseStateFormatterNoObject } from "../dokuly_components/formatters/releaseStateFormatter";

export default function PurchaseOrderTable() {
  const [refresh, setRefresh] = useState(true);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [filteredPurchaseOrders, setFilteredPurchaseOrders] = useState([]);
  const [showCompletedPurchaseOrders, setShowCompletedPurchaseOrders] =
    useState(false);
  const [showDiscardedPurchaseOrders, setShowDiscardedPurchaseOrders] =
    useState(false);
  const [purchaseOrderGetStatus, setPurchaseOrderGetStatus] = useState(200);
  const [supplierGetStatus, setSupplierGetStatus] = useState(200);
  const [suppliers, setSuppliers] = useState([]);
  const { isAuthenticated, setIsAuthenticated } = useContext(AuthContext);
  const [organization, refreshOrganization, loadingOrganization] =
    useOrganization();

  useEffect(() => {
    if (
      purchaseOrders?.length === 0 ||
      purchaseOrders == null ||
      refresh === true
    ) {
      // check local storage for cached purchase orders
      const cachedPurchaseOrders = localStorage.getItem("purchaseOrders");
      if (cachedPurchaseOrders) {
        try {
          setPurchaseOrders(JSON.parse(cachedPurchaseOrders));
        } catch (e) {
          localStorage.removeItem("purchaseOrders");
        }
      }
      refetchPurchaseOrders();
      const cachedSuppliers = localStorage.getItem("suppliers");
      if (cachedSuppliers) {
        try {
          setSuppliers(JSON.parse(cachedSuppliers));
        } catch (e) {
          localStorage.removeItem("suppliers");
        }
      }
      refetchSuppliers();
    } else {
      refetchPurchaseOrders();
    }

    setRefresh(false);
    // Updates the tab text
    document.title = "Procurement | Dokuly";

    function refetchPurchaseOrders() {
      getPurchaseOrders()
        .then((res) => {
          if (res.status === 200) {
            setPurchaseOrderGetStatus(res.status);
            setPurchaseOrders(res.data);
            localStorage.setItem("purchaseOrders", JSON.stringify(res.data));
          }
        })
        .catch((err) => {
          if (err?.response) {
            if (err?.response?.status === 401) {
              setIsAuthenticated(false);
            }
          }
        });
    }

    function refetchSuppliers() {
      getSuppliers().then((res) => {
        if (res.status === 200) {
          setSupplierGetStatus(res.status);
          setSuppliers(res.data);
          localStorage.setItem("suppliers", JSON.stringify(res.data));
        }
      });
    }
  }, [refresh]);

  useEffect(() => {
    let temporaryPurchaseOrders = purchaseOrders;
    // Filter documents in inactive projects.
    if (!showCompletedPurchaseOrders) {
      temporaryPurchaseOrders = temporaryPurchaseOrders.filter(
        (purchaseOrder) => {
          return purchaseOrder?.is_completed === false;
        }
      );
    }
    if (!showDiscardedPurchaseOrders) {
      temporaryPurchaseOrders = temporaryPurchaseOrders.filter(
        (purchaseOrder) => {
          return purchaseOrder?.status?.toLowerCase() !== "discarded";
        }
      );
    }

    setFilteredPurchaseOrders(temporaryPurchaseOrders);
  }, [
    purchaseOrders,
    showCompletedPurchaseOrders,
    showDiscardedPurchaseOrders,
  ]);

  function toggle(value) {
    return !value;
  }
  const handleOnRowClick = (rowIndex, row) => {
    if (event.ctrlKey || event.metaKey) {
      window.open(`/#/procurement/${row.id}`);
    } else {
      window.location.href = `/#/procurement/${row.id}`;
    }
  };

  const columns = [
    {
      key: "purchase_order_number",
      header: "PO #",
    },
    {
      key: "order_date",
      header: "Order date",
    },

    {
      key: "supplier",
      header: "Supplier",
      formatter: (row) => {
        return (
          <Row>
            <Col style={{ maxWidth: "70px" }}>
              <ThumbnailFormatter thumbnail={row?.supplier?.thumbnail} />
            </Col>
            <Col style={{ display: "flex", alignItems: "center" }}>
              {row?.supplier?.name ?? "--"}
            </Col>
          </Row>
        );
      },
    },
    {
      key: "estimated_delivery_date",
      header: "Estimated delivery date",
      formatter: (row) => {
        const currentDate = new Date();
        const estimatedDeliveryDate = new Date(row.estimated_delivery_date);

        if (row?.is_completed) {
          return (
            <span className="badge badge-pill badge-success">Received</span>
          );
        }
        if (currentDate > estimatedDeliveryDate) {
          return (
            <span className="badge badge-pill badge-warning">
              {row?.estimated_delivery_date ?? "--"}
            </span>
          );
        }
        return `${row?.estimated_delivery_date ?? "--"}`;
      },
    },
    {
      key: "status",
      header: "Status",
      formatter: (row) => releaseStateFormatterNoObject(row?.status),
    },

    {
      key: "total_price",
      header: "Total Price",
      headerTooltip: "Total price excluding VAT",
      formatter: (row) => {
        if (row?.total_price === null) {
          return "No Items";
        }
        return (
          <DokulyPriceFormatter
            price={row?.total_price}
            organization={organization}
            supplier={row?.supplier}
          />
        );
      },
    },
  ];

  return (
    <div
      className="container-fluid mt-2 mainContainerWidth"
      style={{ paddingBottom: "1rem" }}
    >
      <NewPurchaseOrderForm setRefresh={setRefresh} suppliers={suppliers} />

      <div className="card rounded p-3">
        <div className="m-2">
          {purchaseOrderGetStatus !== 200 ? (
            <div className="m-2">
              <h5>No current Purchase Orders saved</h5>
            </div>
          ) : (
            <>
              <Row>
                <Col className="p-2">
                  <div className="form-check mb-3">
                    <input
                      className="dokuly-checkbox"
                      name="showCompletedPurchaseOrders"
                      type="checkbox"
                      onChange={() => {
                        setShowCompletedPurchaseOrders(toggle);
                      }}
                      checked={showCompletedPurchaseOrders}
                    />
                    <label
                      className="form-check-label ml-1"
                      htmlFor="flexCheckDefault"
                    >
                      Show completed purchase orders
                    </label>
                  </div>{" "}
                </Col>
                <Col className="p-2">
                  <div className="form-check mb-3">
                    <input
                      className="dokuly-checkbox"
                      name="showDiscardedPurchaseOrders"
                      type="checkbox"
                      onChange={() => {
                        setShowDiscardedPurchaseOrders(toggle);
                      }}
                      checked={showDiscardedPurchaseOrders}
                    />
                    <label
                      className="form-check-label ml-1"
                      htmlFor="flexCheckDefault"
                    >
                      Show discarded purchase orders
                    </label>
                  </div>{" "}
                </Col>
              </Row>
              {loadingOrganization ? (
                loadingSpinner()
              ) : (
                <DokulyTable
                  key={filteredPurchaseOrders?.length ?? 0}
                  data={filteredPurchaseOrders}
                  columns={columns}
                  defaultSort={{ columnNumber: 0, order: "desc" }}
                  onRowClick={handleOnRowClick}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
