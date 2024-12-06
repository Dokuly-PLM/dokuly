import React, { useEffect, useState, useRef } from "react";
import moment from "moment";
import { getPurchaseOrder, updatePurchaseOrder } from "../functions/queries";
import { toast } from "react-toastify";
import { Row, Col } from "react-bootstrap";
import DownLoadPO from "./downloadPO";
import DokulyDateFormat from "../../dokuly_components/formatters/dateFormatter";
import DokulyPriceFormatter from "../../dokuly_components/formatters/priceFormatter";
import {
  getIncotermDescription,
  getPaymentTermsDescription,
} from "../forms/editPurchaseOrderForm";
import QuestionToolTip from "../../dokuly_components/questionToolTip";
import useOrganization from "../../common/hooks/useOrganization";
import CopyToClipButton from "../../dokuly_components/copyToClipButton";
import { releaseStateFormatterNoObject } from "../../dokuly_components/formatters/releaseStateFormatter";
import { useNavigate } from "react-router";

const Information = (props) => {
  // Url logic
  const url = window.location.href.toString();
  const split = url.split("/");
  const purchaseOrderID = Number.parseInt(split[5]);

  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [purchaseOrder, setPurchaseOrder] = useState(
    props.purchaseOrder !== undefined ? props.purchaseOrder : null
  );
  const [supplierName, setSupplierName] = useState("");
  // New state for edit mode and edited status
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [editedStatus, setEditedStatus] = useState("");

  const statusDropdownRef = useRef(null);

  const organization = props?.organization;

  // Toggle edit mode and focus on the dropdown
  const toggleEditStatus = () => {
    setIsEditingStatus(true);
    setEditedStatus(purchaseOrder?.status); // Initialize with current status
    setTimeout(() => statusDropdownRef.current?.focus(), 0); // Focus after state update
  };

  // Update status immediately when a new option is selected
  const handleStatusChange = (e) => {
    const newStatus = e.target.value;
    setEditedStatus(newStatus);
    setIsEditingStatus(false); // Exit edit mode

    const updatedOrder = {
      ...purchaseOrder,
      status: newStatus,
    };

    updatePurchaseOrder(updatedOrder).then((res) => {
      if (res.status === 200 || res.status === 206) {
        setPurchaseOrder(updatedOrder); // Update local state
        props.setRefresh(true); // Optional: Trigger a refresh to update the UI
        toast.success("Status updated");
      }
    });
  };

  const [showModal, setShowModal] = useState(false);
  const handleShowModal = () => {
    setShowModal(true);
  };
  const handleCloseModal = () => {
    setShowModal(false);
  };

  // TODO This is an infocard use props only. Not unnecessary db calls.
  if (purchaseOrder == null) {
    getPurchaseOrder(purchaseOrderID)
      .then((res) => {
        setPurchaseOrder(res.data);
      })
      .finally(() => {
        setLoading(false);
      });
  }

  useEffect(() => {
    if (props?.purchaseOrder && props?.supplierName) {
      setPurchaseOrder(props.purchaseOrder);
      setSupplierName(props.supplierName);
    }
  }, [props]);

  const markAsReceived = () => {
    if (!confirm("Are you sure you want to mark this PO as received?")) {
      return;
    }
    const updatedOrder = {
      ...props.purchaseOrder,
      actual_delivery_date: moment().format("YYYY-MM-DD"),
      status: "Sent",
      is_completed: true,
    };

    updatePurchaseOrder(updatedOrder).then((res) => {
      if (res.status === 200 || res.status === 206) {
        props.setRefresh(true);
        toast.success("Purchase order marked as received");
      }
    });
  };

  return (
    <div className="card-body m-3 card rounded">
      {loading && purchaseOrder === undefined ? (
        <div className="d-flex m-5 dokuly-primary justify-content-center">
          <div className="spinner-border" role="status" />
        </div>
      ) : (
        <React.Fragment>
          <h5>
            <b>Information</b>
          </h5>
          <hr />
          {purchaseOrder?.is_completed ? (
            <Row>
              <Col xs="6" sm="6" md="6" lg="4" xl="6">
                <b>Date registered delivered:</b>
              </Col>
              <Col>
                <DokulyDateFormat date={purchaseOrder?.actual_delivery_date} />
              </Col>
            </Row>
          ) : (
            <Row>
              <Col xs="6" sm="6" md="6" lg="4" xl="6">
                <b>Expected delivery date:</b>
              </Col>
              <Col>
                <DokulyDateFormat
                  date={purchaseOrder?.expected_delivery_date}
                />
              </Col>
            </Row>
          )}
          {purchaseOrder?.tracking_number && (
            <Row className="align-items-center">
              <Col xs="6" sm="6" md="6" lg="4" xl="6">
                <b>Tracking number:</b>
              </Col>
              <Col>
                {purchaseOrder?.tracking_number}
                <CopyToClipButton
                  text={purchaseOrder?.tracking_number}
                  className="btn btn-sm btn-bg-transparent ml-2"
                />
              </Col>
            </Row>
          )}
          <Row>
            <Col xs="6" sm="6" md="6" lg="4" xl="6">
              <b>Supplier:</b>
            </Col>
            <Col>{supplierName}</Col>
          </Row>
          <Row>
            <Col xs="6" sm="6" md="6" lg="4" xl="6">
              <b>Delivery address:</b>
            </Col>
            <Col>{purchaseOrder?.delivery_address}</Col>
          </Row>
          <Row>
            <Col xs="6" sm="6" md="6" lg="4" xl="6">
              <b>Billing address:</b>
            </Col>
            <Col>{purchaseOrder?.billing_address}</Col>
          </Row>
          <Row>
            <Col xs="6" sm="6" md="6" lg="4" xl="6">
              <b>Payment terms:</b>
              <QuestionToolTip
                optionalHelpText={getPaymentTermsDescription(
                  purchaseOrder?.payment_terms
                )}
                placement="right"
              />
            </Col>
            <Col>{purchaseOrder?.payment_terms}</Col>
          </Row>
          <Row>
            <Col xs="6" sm="6" md="6" lg="4" xl="6">
              <b>Shipment terms:</b>
              <QuestionToolTip
                optionalHelpText={getIncotermDescription(
                  purchaseOrder?.incoterms
                )}
                placement="right"
              />
            </Col>
            <Col>{purchaseOrder?.incoterms}</Col>
          </Row>
          <Row>
            <Col xs="6" sm="6" md="6" lg="4" xl="6">
              <b>PO Currency:</b>
            </Col>
            <Col>{purchaseOrder?.po_currency}</Col>
          </Row>

          {Number.parseInt(purchaseOrder?.vat || 0) !== 0 && (
            <Row>
              <Col xs="6" sm="6" md="6" lg="4" xl="6">
                <b>VAT (%):</b>
              </Col>
              <Col>{purchaseOrder?.vat}</Col>
            </Row>
          )}
          <Row>
            <Col xs="6" sm="6" md="6" lg="4" xl="6">
              <b>
                Order Total{" "}
                {Number.parseInt(purchaseOrder?.vat) !== 0 &&
                  purchaseOrder?.vat &&
                  "(inc. VAT)"}
              </b>
            </Col>
            <Col>
              {purchaseOrder?.total_price !== null ? (
                <Row style={{ marginLeft: "0.01rem" }}>
                  <DokulyPriceFormatter
                    price={purchaseOrder?.total_price}
                    organization={organization}
                    supplier={props?.supplier}
                    className="mr-1"
                  />
                  {purchaseOrder?.vat > 0 && (
                    <>
                      {" ("}
                      <DokulyPriceFormatter
                        price={
                          purchaseOrder?.total_price +
                          (purchaseOrder?.vat / 100) *
                            purchaseOrder?.total_price
                        }
                        organization={organization}
                        supplier={props?.supplier}
                      />
                      {")"}
                    </>
                  )}
                </Row>
              ) : (
                <span>No items in PO</span>
              )}
            </Col>
          </Row>

          <Row>
            <Col xs="6" sm="6" md="6" lg="4" xl="6">
              <b>Connected lot:</b>
            </Col>
            <Col>
              {purchaseOrder?.lot ? (
                <span
                  style={{ cursor: "pointer" }}
                  className="align-items-center"
                  onClick={() => {
                    navigate(`/production/lot/${purchaseOrder?.lot?.id}`);
                  }}
                >
                  Lot {purchaseOrder?.lot?.lot_number} -{" "}
                  {purchaseOrder?.lot?.title || "No title"}
                  <img
                    src="/static/icons/arrow-right.svg"
                    alt="arrow right"
                    width={20}
                    style={{ marginLeft: "5px" }}
                  />
                </span>
              ) : (
                <span>No connected lot</span>
              )}
            </Col>
          </Row>
          <Row>
            <Col xs="6" sm="6" md="6" lg="4" xl="6">
              <b>PO Status:</b>
            </Col>
            <Col>
              {isEditingStatus ? (
                <select
                  value={editedStatus}
                  onChange={handleStatusChange}
                  className="form-control"
                >
                  {/* List all status options here */}
                  <option value="Draft">Draft</option>
                  <option value="Sent">Sent</option>
                  <option value="Discarded">Discarded</option>
                </select>
              ) : (
                // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
                <span onClick={toggleEditStatus} style={{ cursor: "pointer" }}>
                  {releaseStateFormatterNoObject(purchaseOrder?.status)}
                </span>
              )}
            </Col>
          </Row>
          <Row>
            <Col xs="6" sm="6" md="6" lg="4" xl="6">
              {purchaseOrder?.is_completed ? (
                <span className="badge badge-pill badge-success">Received</span>
              ) : (
                // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
                <span
                  style={{ cursor: "pointer" }}
                  className="badge badge-pill badge-warning"
                  onClick={() => {
                    markAsReceived();
                  }}
                  title="Click to mark as received"
                >
                  Not received
                </span>
              )}
            </Col>
            <Col> </Col>
          </Row>
          <Row>
            <Row className="m-2">
              <button
                className="btn dokuly-bg-transparent"
                onClick={handleShowModal}
                type="button"
              >
                <img
                  // width="15px"
                  className="icon-dark"
                  src="../../static/icons/printer.svg"
                  alt="icon"
                  style={{ cursor: "pointer" }}
                />
              </button>

              <DownLoadPO
                show={showModal}
                onHide={handleCloseModal}
                purchaseOrder={purchaseOrder}
                supplier={props?.supplier}
                organization={organization}
              />
            </Row>
          </Row>
        </React.Fragment>
      )}
    </div>
  );
};

export default Information;
