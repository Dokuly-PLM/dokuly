import React, { useState, useEffect } from "react";
import { Row, Col } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";
import { getPurchaseOrder } from "./functions/queries";
import { getSuppliers } from "../suppliers/functions/queries";
import Information from "./overviewTab/information";
import Notes from "./overviewTab/notes";
import OrderItemsTable from "./orderItems/orderItemsTable";
import EditPurchaseOrderForm from "./forms/editPurchaseOrderForm";
import {
  getCurrencyConversions,
  getOrganizationCurrency,
} from "../parts/functions/queries";
import { FilesTable } from "../common/filesTable/filesTable";
import DokulyTabs from "../dokuly_components/dokulyTabs/dokulyTabs";
import Heading from "../dokuly_components/Heading";
import useOrganization from "../common/hooks/useOrganization";

const DisplayPurchaseOrder = (props) => {
  const location = useLocation();

  const [id, setId] = useState(-1);
  useEffect(() => {
    const url = window.location.href.toString();
    const split = url.split("/");
    setId(Number.parseInt(split[5]));
  }, [location]);

  const [refresh, setRefresh] = useState(false);

  const [purchaseOrder, setPurchaseOrder] = useState(null);
  const [suppliers, setSuppliers] = useState(null);
  const [organizationCurrency, setOrganizationCurrency] = useState("USD");
  const [loadingPurchaseOrder, setLoadingPurchaseOrder] = useState(false);

  const [organization, refreshOrganization, loadingOrganization] =
    useOrganization();

  const navigate = useNavigate();

  useEffect(() => {
    if (purchaseOrder != null && purchaseOrder !== undefined) {
      document.title = `PO${purchaseOrder.purchase_order_number} | Dokuly`;
    }
    getSuppliers().then((res) => {
      if (res.status === 200) {
        setSuppliers(res.data);
      }
    });
    getOrganizationCurrency().then((res) => {
      setOrganizationCurrency(res.data);
    });
  }, [purchaseOrder]);

  useEffect(() => {
    if (id != null && id !== -1) {
      getPurchaseOrder(id)
        .then((res) => {
          if (res.status === 200) {
            setPurchaseOrder(res.data);
          }
        })
        .finally(() => {
          setLoadingPurchaseOrder(false);
        });
    }
  }, [id]);

  useEffect(() => {
    if (refresh === true) {
      if (id != null && id !== -1) {
        getPurchaseOrder(id)
          .then((res) => {
            if (res.status === 200) {
              setPurchaseOrder(res.data);
              setRefresh(false);
            }
          })
          .finally(() => {
            setLoadingPurchaseOrder(false);
          });
      }
    }
  }, [refresh]);

  const tabs = [
    {
      eventKey: "overview",
      title: "Overview",
      content: (
        <>
          {purchaseOrder == null || purchaseOrder === undefined ? (
            <div className="d-flex m-5  justify-content-center">
              <div className="spinner-border" role="status" />
            </div>
          ) : (
            <div>
              <Row>
                <EditPurchaseOrderForm
                  purchaseOrder={purchaseOrder}
                  setRefresh={setRefresh}
                  suppliers={suppliers}
                  setLoadingPurchaseOrder={setLoadingPurchaseOrder}
                />
              </Row>
              <Row>
                <Col>
                  <Row>
                    <Information
                      purchaseOrder={purchaseOrder}
                      setRefresh={setRefresh}
                      supplierName={purchaseOrder?.supplier?.name}
                      supplier={purchaseOrder?.supplier}
                      organization={organization}
                    />
                  </Row>

                  <Row>
                    <FilesTable
                      file_id_list={purchaseOrder?.files}
                      app="PurchaseOrder"
                      objectId={purchaseOrder?.id}
                      setRefresh={setRefresh}
                      release_state={""}
                    />
                  </Row>
                </Col>

                <Col>
                  <Notes
                    purchaseOrder={purchaseOrder}
                    setRefresh={setRefresh}
                  />
                </Col>
              </Row>
            </div>
          )}
        </>
      ),
    },
    {
      eventKey: "orderItems",
      title: "Order items",
      content: (
        <>
          {purchaseOrder == null || purchaseOrder === undefined ? (
            <div className="d-flex m-5 justify-content-center">
              <div className="spinner-border" role="status" />
            </div>
          ) : (
            <div className="row m-3">
              <OrderItemsTable
                po_id={purchaseOrder?.id}
                poState={purchaseOrder?.status}
                purchaseOrder={purchaseOrder}
                loadingPurchaseOrder={loadingPurchaseOrder}
                setRefresh={setRefresh}
                organizationCurrency={organizationCurrency}
                organization={organization}
                readOnly={purchaseOrder?.status !== "Draft"}
                supplier={purchaseOrder?.supplier}
              />
            </div>
          )}
        </>
      ),
    },
  ];

  return (
    <div
      className="container-fluid mt-2 mainContainerWidth"
      style={{ paddingBottom: "1rem" }}
    >
      <img
        className="icon-dark p-2 arrow-back"
        onClick={() => navigate(`/procurement`)}
        src="../../static/icons/arrow-left.svg"
        alt="Arrow Icon"
      />

      <Heading
        item_number={
          `PO${purchaseOrder?.purchase_order_number} - Order date: ` ??
          "PO - Order date: "
        }
        display_name={purchaseOrder?.order_date}
        revision={""}
        is_latest_revision={true}
        app="procurement"
      />
      <DokulyTabs tabs={tabs} basePath={`/procurement/${id}`} />
    </div>
  );
};

export default DisplayPurchaseOrder;
