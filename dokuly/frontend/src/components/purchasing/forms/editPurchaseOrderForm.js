import React, { useState, useEffect } from "react";
import { Col, Row, OverlayTrigger, Tooltip, Form } from "react-bootstrap";
import DokulyModal from "../../dokuly_components/dokulyModal";
import useCurrencyConversions from "../../common/hooks/useCurrencyConversions";
import { deletePurchaseOrder, updatePurchaseOrder } from "../functions/queries";
import DeleteButton from "../../dokuly_components/deleteButton";
import { useNavigate } from "react-router";
import DokulyPriceFormatter from "../../dokuly_components/formatters/priceFormatter";
import QuestionToolTip from "../../dokuly_components/questionToolTip";
import { getTotalPOPrice } from "../overviewTab/information";
import useOrganization from "../../common/hooks/useOrganization";
import PaymentTermsSelect from "../components/paymentTermsSelect";
import ShippingTermsSelect from "../components/shippingTermsSelect";
import useAllLots from "../../common/hooks/useAllLots";
import { toast } from "react-toastify";
import GenericDropdownSelector from "../../dokuly_components/dokulyTable/components/genericDropdownSelector";
import DropdownFormSection from "../../dokuly_components/dokulyForm/dropdownFormSection";

export const renderIncotermTooltip = (props) => (
  <Tooltip id="button-tooltip" {...props}>
    {getIncotermDescription(incoterm)}
  </Tooltip>
);

export const renderPaymentTermTooltip = (props) => (
  <Tooltip id="button-tooltip" {...props}>
    {getPaymentTermsDescription(paymentTerms)}
  </Tooltip>
);

export const getIncotermDescription = (incoterm) => {
  switch (incoterm) {
    case "EXW":
      return "Ex Works: Seller makes the goods available at their premises. Buyer is responsible for all transportation costs and risks.";
    case "FCA":
      return "Free Carrier: Seller delivers goods, cleared for export, to the carrier at a specified place. Buyer assumes risk from that point.";
    case "CPT":
      return "Carriage Paid To: Seller pays for carriage to the named destination, but risk transfers to buyer upon handing goods over to the first carrier.";
    case "CIP":
      return "Carriage and Insurance Paid To: Similar to CPT, but seller also has to insure the goods for transport to the named destination.";
    case "DAP":
      return "Delivered at Place: Seller bears all risks and costs associated with delivering goods to an agreed-upon place but not unloaded.";
    case "DPU":
      return "Delivered at Place Unloaded: Seller delivers and unloads goods at destination place. Risk transfers after unloading.";
    case "DDP":
      return "Delivered Duty Paid: Seller bears cost, risk, and responsibility for cleared goods at named place of destination. Includes duties and taxes.";
    case "FAS":
      return "Free Alongside Ship: Seller must place the goods alongside the ship at the named port. Buyer assumes all risk/cost once goods are alongside ship.";
    case "FOB":
      return "Free on Board: Seller bears all costs and risks until goods are loaded on board the ship. Buyer responsible once goods are on board.";
    case "CFR":
      return "Cost and Freight: Seller must pay the costs and freight to bring goods to the port of destination. Risk transfers once goods are on board.";
    case "CIF":
      return "Cost, Insurance, and Freight: Like CFR, but seller must also provide insurance against buyer's risk of loss/damage during carriage.";
    default:
      return "Select Incoterm to see description";
  }
};

export const getPaymentTermsDescription = (paymentTerm) => {
  switch (paymentTerm) {
    case "Net 7":
      return "Net 7: Payment due in 7 days past the invoice date.";
    case "Net 10":
      return "Net 10: Payment due in 10 days past the invoice date.";
    case "Net 30":
      return "Net 30: Payment due in 30 days past the invoice date.";
    case "Net 60":
      return "Net 60: Payment due in 60 days past the invoice date.";
    case "Net 90":
      return "Net 90: Payment due in 90 days past the invoice date.";
    case "CBS":
      return "CBS: Cash before shipment. this term is common among businesses that make custom work for clients, such as designers, artists, and furniture makers. They typically require a down payment before shipping the goods to protect them from loss should the client fail to clear the rest of the invoice.";
    case "PIA":
      return "PIA: Payment in advance. this term is similar to CBS. However, this one indicates a requirement for full payment before work begins.";
    case "EOM":
      return "EOM: End of month. Indicates that payment is due on the last day of the month of the invoice date.";
    default:
      return "Select Payment Terms to see description";
  }
};

const EditPurchaseOrderForm = (props) => {
  const navigate = useNavigate();

  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState("");
  const [orderDate, setOrderDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [paymentTermsInDays, setPaymentTermsInDays] = useState(30);
  const [totalPrice, setTotalPrice] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [status, setStatus] = useState("Draft");
  const [actualDeliveryDate, setActualDeliveryDate] = useState("");
  const [incoterm, setIncoterm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [currency, setCurrency] = useState(""); // State for currency
  const [billingAddress, setBillingAddress] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [nameOfPurchaser, setNameOfPurchaser] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [vat, setVat] = useState("0");
  const [purchasingReference, setPurchasingReference] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("");
  const [connectedLot, setConnectedLot] = useState([]);

  const [purchaserCollapsed, setPurchaserCollapsed] = useState(true);
  const [orderDetailsCollapsed, setOrderDetailsCollapsed] = useState(true);

  const [lots, refreshLots, loadingLots] = useAllLots();

  const [organization, refetchOrganization, loadingOrganization] =
    useOrganization();

  const {
    currencyPairs,
    currencyKeys,
    conversionRate,
    fetchCurrencyConversions,
    loadingCurrency,
    errorCurrency,
  } = useCurrencyConversions("USD"); // Default currency can be set here

  const openEditPurchaseOrderForm = () => {
    setEstimatedDeliveryDate(props?.purchaseOrder?.estimated_delivery_date);
    setOrderDate(props?.purchaseOrder?.order_date);
    setPaymentTermsInDays(props?.purchaseOrder?.payment_terms_in_days);
    setTotalPrice(props?.purchaseOrder?.total_price);
    setIsCompleted(props?.purchaseOrder?.is_completed);
    setStatus(props?.purchaseOrder?.status);
    setActualDeliveryDate(props?.purchaseOrder?.actual_delivery_date);
    setCurrency(props?.purchaseOrder?.po_currency); // Set currency from props
    setBillingAddress(props?.purchaseOrder?.billing_address);
    setDeliveryAddress(props?.purchaseOrder?.delivery_address);
    setNameOfPurchaser(props?.purchaseOrder?.name_of_purchaser);
    setPaymentTerms(props?.purchaseOrder?.payment_terms);
    setIncoterm(props?.purchaseOrder?.incoterms);
    setTrackingNumber(props?.purchaseOrder?.tracking_number);
    setVat(props?.purchaseOrder?.vat);
    setPurchasingReference(props?.purchaseOrder?.purchasing_reference);
    setPostalCode(props?.purchaseOrder?.postal_code);
    setCountry(props?.purchaseOrder?.country);
    setConnectedLot(props?.purchaseOrder?.lot); // This is the connected lot foreign key (id)
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (!confirm("Are you sure you want to delete this purchase order?")) {
      return;
    }

    deletePurchaseOrder(id)
      .then((res) => {
        if (res.status === 204) {
          handleClose();
          navigate("/procurement/");
        }
      })
      .catch((error) => {
        console.error("Error deleting purchase order:", error);
        // Optionally handle error (e.g., show a notification to the user)
      });
  };

  const handleClose = () => setShowModal(false);

  function onSubmit() {
    let connectedLotId = -1;
    if (typeof connectedLot === "string") {
      connectedLotId = parseInt(connectedLot);
    } else if (typeof connectedLot === "object" && connectedLot !== null) {
      connectedLotId = connectedLot.id;
    } else {
      connectedLotId = connectedLot;
    }

    const data = {
      id: props?.purchaseOrder?.id,
      purchase_order_number: props?.purchaseOrder?.purchase_order_number,
      estimated_delivery_date: estimatedDeliveryDate,
      order_date: orderDate,
      // payment_terms_in_days: paymentTermsInDays,
      payment_terms: paymentTerms,
      incoterms: incoterm,
      total_price: totalPrice,
      status: status,
      is_completed: isCompleted,
      actual_delivery_date: isCompleted
        ? new Date().toISOString().slice(0, 10)
        : null,
      po_currency: currency,
      billing_address: billingAddress,
      delivery_address: deliveryAddress,
      name_of_purchaser: nameOfPurchaser,
      tracking_number: trackingNumber,
      vat: vat,
      purchasing_reference: purchasingReference,
      postal_code: postalCode,
      country: country,
      lot: connectedLotId,
    };

    updatePurchaseOrder(data).then((res) => {
      if (res.status === 200 || res.status === 206) {
        setEstimatedDeliveryDate("");
        setOrderDate("");
        setPaymentTermsInDays(30);
        setTotalPrice(0);
        setIsCompleted(false);
        setStatus("Draft");
        setCurrency("USD");
        setBillingAddress("");
        setDeliveryAddress("");
        setNameOfPurchaser("");
        setTrackingNumber("");
        setVat("0");
        setPurchasingReference("");
        setPostalCode("");
        setCountry("");
        props?.setRefresh(true);
        handleClose();
      }
      if (res.status === 206) {
        toast.info("Lot not found, PO update still successful");
      }
    });
  }

  const purchaserOptions = [
    {
      label: "Delivery address",
      value: deliveryAddress,
      onChange: setDeliveryAddress,
      key: "deliveryAddress",
    },
    {
      asGroup: true,
      groups: [
        {
          label: "Billing address",
          value: billingAddress,
          onChange: setBillingAddress,
          key: "billingAddress",
          className: "mt-2",
        },
        {
          label: "ZIP / Postal code",
          value: postalCode,
          onChange: setPostalCode,
          key: "postalCode",
          className: "mt-2",
        },
      ],
    },
    {
      label: "Billing address",
      value: billingAddress,
      onChange: setBillingAddress,
      key: "billingAddress",
      className: "mt-2",
    },
    {
      label: "Name of purchaser",
      value: nameOfPurchaser,
      onChange: setNameOfPurchaser,
      key: "nameOfPurchaser",
      className: "mt-2",
    },
  ];

  const orderDetails = [
    {
      label: "Tracking number",
      value: trackingNumber,
      onChange: setTrackingNumber,
      key: "trackingNumber",
      className: "mt-2",
    },
    {
      label: "Purchasing reference",
      value: purchasingReference,
      onChange: setPurchasingReference,
      key: "purchasingReference",
      className: "mt-2",
    },
    {
      label: "VAT (%)",
      value: vat,
      onChange: setVat,
      key: "vat",
      className: "mt-2",
    },
    {
      label: "Payment terms",
      value: paymentTerms,
      onChange: setPaymentTerms,
      key: "paymentTerms",
      useCustomSelect: true,
      customSelectChildren: () => (
        <PaymentTermsSelect
          paymentTerms={paymentTerms}
          setPaymentTerms={setPaymentTerms}
        />
      ),
    },
    {
      label: "Shipping terms",
      value: incoterm,
      onChange: setIncoterm,
      key: "incoterm",
      useCustomSelect: true,
      customSelectChildren: () => (
        <ShippingTermsSelect incoterm={incoterm} setIncoterm={setIncoterm} />
      ),
    },
  ];

  const currencyKeysOptions = currencyKeys.map((currency) => ({
    label: currency,
    value: currency,
  }));

  return (
    <div className="container-fluid">
      <button
        type="button"
        className="btn btn-bg-transparent mt-2 mb-2"
        onClick={openEditPurchaseOrderForm}
      >
        <div className="row">
          <img
            className="icon-dark"
            src="../../static/icons/edit.svg"
            alt="icon"
          />
          <span className="btn-text">Edit purchase order</span>
        </div>
      </button>
      <DokulyModal
        show={showModal}
        onHide={handleClose}
        title="Edit purchase order"
      >
        <div className="form-group mt-1 mb-1">
          <label>Order date</label>
          <input
            className="form-control"
            type="date"
            name="order_date"
            onChange={(e) => setOrderDate(e.target.value)}
            value={orderDate}
          />
        </div>

        <div className="form-group mt-1 mb-2">
          <label>Estimated delivery date *</label>
          <input
            className="form-control"
            type="date"
            name="estimatedDeliveryDate"
            onChange={(e) => setEstimatedDeliveryDate(e.target.value)}
            value={estimatedDeliveryDate}
          />
        </div>

        <DropdownFormSection
          formGroups={purchaserOptions}
          isCollapsed={purchaserCollapsed}
          handleToggle={() => setPurchaserCollapsed(!purchaserCollapsed)}
          collapsedText="Purchaser details"
          wrapperClassname="mt-1 mb-3"
          className="mt-1 mb-2"
        />

        <DropdownFormSection
          formGroups={orderDetails}
          isCollapsed={orderDetailsCollapsed}
          handleToggle={() => setOrderDetailsCollapsed(!orderDetailsCollapsed)}
          collapsedText="Order details"
          wrapperClassname="mt-1 mb-3"
          className="mt-1 mb-2"
        />

        <Form.Group>
          <Form.Label>Connected production lot</Form.Label>
          <Form.Control
            as="select"
            name="connectedLot"
            value={connectedLot}
            onChange={(e) => setConnectedLot(e.target.value)}
          >
            <option value="">Select lot</option>
            {lots?.map((lot) => (
              <option key={lot.id} value={lot.id}>
                Lot {lot?.lot_number} - {lot?.title || "No title"}
              </option>
            ))}
          </Form.Control>
        </Form.Group>
        <Form.Group className="mt-2 mb-2">
          <Form.Label>Default currency</Form.Label>
          <GenericDropdownSelector
            state={currency || null}
            setState={(value) => setCurrency(value)}
            dropdownValues={currencyKeysOptions}
            placeholder="Select currency"
            borderIfPlaceholder={true}
          />
        </Form.Group>

        <div className="form-group">
          <label>Status</label>
          <select
            name="status"
            value={status}
            className="form-control"
            onChange={(e) => setStatus(e.target.value)}
            disabled={isCompleted === true}
          >
            <option>Draft</option>
            <option>Sent</option>
            <option>Discarded</option>
          </select>
        </div>

        <div className="form-group">
          <label className="mx-2">Received</label>
          <input
            type="checkbox"
            name="isCompleted"
            onChange={(e) => setIsCompleted(!isCompleted)}
            disabled={status !== "Sent"}
            checked={isCompleted}
          />
        </div>
        <div
          className="form-group mb-2"
          style={{ borderTop: "1px dashed gray", paddingTop: "1rem" }}
        >
          <Row className="align-items-center">
            <Col className="col-auto">
              <span>Total price {vat !== "0" && vat ? "(inc VAT)" : ""}</span>
            </Col>
            <Col className="col-6">
              {totalPrice !== null && (
                <DokulyPriceFormatter
                  price={totalPrice + (totalPrice * vat) / 100}
                  organization={organization}
                  supplier={props?.purchaseOrder?.supplier}
                />
              )}
            </Col>
          </Row>
        </div>
        <div className="form-group mt-3 d-flex align-items-center">
          <button
            className="btn dokuly-bg-primary"
            onClick={() => {
              props?.setLoadingPurchaseOrder(true);
              onSubmit();
            }}
            disabled={estimatedDeliveryDate === ""}
            type="button"
          >
            Submit
          </button>
          <DeleteButton
            onDelete={() => handleDelete(props?.purchaseOrder?.id)}
          />
        </div>
      </DokulyModal>
    </div>
  );
};

export default EditPurchaseOrderForm;
