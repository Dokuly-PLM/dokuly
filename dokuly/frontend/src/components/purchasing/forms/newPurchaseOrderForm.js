import React, { useContext, useEffect, useState } from "react";
import Select from "react-select";
import { Col, Form, OverlayTrigger, Row } from "react-bootstrap";
import DokulyModal from "../../dokuly_components/dokulyModal";

import { createPurchaseOrder } from "../functions/queries";
import {
  getIncotermDescription,
  getPaymentTermsDescription,
  renderIncotermTooltip,
  renderPaymentTermTooltip,
} from "./editPurchaseOrderForm";
import { AuthContext } from "../../App";
import useOrganization from "../../common/hooks/useOrganization";
import QuestionToolTip from "../../dokuly_components/questionToolTip";
import PaymentTermsSelect from "../components/paymentTermsSelect";
import ShippingTermsSelect from "../components/shippingTermsSelect";
import DropdownFormSection from "../../dokuly_components/dokulyForm/dropdownFormSection";

export const handleIsUnauthorized = (err, setIsAuthenticated) => {
  if (err?.response?.status === 401) {
    setIsAuthenticated(false);
  }
};

const NewPurchaseOrderForm = (props) => {
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState("");
  const [orderDate, setOrderDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [supplier, setSupplier] = useState("");
  const [supplierOptions, setSupplierOptions] = useState([]);
  const [notes, setNotes] = useState("");
  const [totalPrice, setTotalPrice] = useState(0.0);
  const [showModal, setShowModal] = useState(false);
  const [incoterm, setIncoterm] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [vat, setVat] = useState("0");
  const [purchasingReference, setPurchasingReference] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");

  const [purchaserCollapsed, setPurchaserCollapsed] = useState(true);
  const [orderDetailsCollapsed, setOrderDetailsCollapsed] = useState(true);

  const [organization, refreshOrganization, loading] = useOrganization();
  const { isAuthenticated, setIsAuthenticated } = useContext(AuthContext);

  const openNewPurchaseOrderForm = () => {
    setShowModal(true);
    const options = props?.suppliers?.map((supplier) => {
      return supplier.is_active
        ? {
            label: `${supplier?.supplier_id} - ${supplier?.name}`,
            value: supplier.id,
            key: supplier.id,
            default_payment_terms: supplier.default_payment_terms,
            default_shipping_terms: supplier.default_shipping_terms,
            default_vat: supplier.default_vat ?? "0",
          }
        : null;
    });
    const filteredOptions = options.filter((option) => option !== null);
    setSupplierOptions(filteredOptions ?? []);
  };

  const handleClose = () => setShowModal(false);

  function onSubmit() {
    const data = {
      supplier: supplier.key,
      notes: notes,
      estimated_delivery_date: estimatedDeliveryDate,
      order_date: orderDate,
      total_price: totalPrice,
      payment_terms: paymentTerms,
      incoterm: incoterm,
      billing_address: billingAddress,
      vat: Number.parseFloat(vat),
      purchasing_reference: purchasingReference,
      delivery_address: deliveryAddress,
      postal_code: postalCode,
      country: country,
      tracking_number: trackingNumber,
    };

    createPurchaseOrder(data)
      .then((res) => {
        if (res.status === 201) {
          setSupplier("");
          setNotes("");
          setTotalPrice(0.0);
          setEstimatedDeliveryDate("");
          setOrderDate(new Date().toISOString().slice(0, 10));
          setIncoterm("");
          setBillingAddress("");
          setPaymentTerms("");
          setVat("0");
          setPurchasingReference("");
          setDeliveryAddress("");
          setPostalCode("");
          setCountry("");
          props?.setRefresh(true);
          handleClose();
        }
      })
      .catch((error) => {
        handleIsUnauthorized(error, setIsAuthenticated);
      });
  }

  useEffect(() => {
    if (organization) {
      setBillingAddress(organization?.billing_address);
      setCountry(organization?.country);
      setPostalCode(organization?.postal_code);
      setDeliveryAddress(organization?.delivery_address);
    }
  }, [organization]);

  useEffect(() => {
    if (supplier) {
      setPaymentTerms(supplier?.default_payment_terms);
      setIncoterm(supplier?.default_shipping_terms);
      setVat(supplier?.default_vat);
    }
  }, [supplier]);

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

  return (
    <div className="container-fluid">
      <button
        type="button"
        className="btn btn-bg-transparent mt-2 mb-2"
        onClick={openNewPurchaseOrderForm}
      >
        <div className="row">
          <img
            className="icon-dark"
            src="../../static/icons/circle-plus.svg"
            alt="icon"
          />
          <span className="btn-text">New purchase order</span>
        </div>
      </button>

      <DokulyModal
        show={showModal}
        onHide={handleClose}
        title="Create new purchase order"
      >
        <div className="form-group">
          <label>Order date</label>
          <input
            className="form-control"
            type="date"
            name="order_date"
            onChange={(e) => {
              setOrderDate(e.target.value);
            }}
            value={orderDate}
          />
        </div>

        <div className="form-group">
          <label>Supplier *</label>
          <Select
            name="supplier"
            placeholder="Select supplier"
            value={supplier}
            options={supplierOptions}
            onChange={(e) => setSupplier(e)}
          />
        </div>

        <div className="form-group">
          <label>Estimated delivery date *</label>
          <input
            className="form-control"
            type="date"
            name="estimatedDeliveryDate"
            onChange={(e) => {
              setEstimatedDeliveryDate(e.target.value);
            }}
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

        <div className="form-group mt-3">
          <button
            className="btn dokuly-bg-primary "
            onClick={onSubmit}
            type="button"
            disabled={supplier === "" || estimatedDeliveryDate === ""}
          >
            Submit
          </button>
        </div>
      </DokulyModal>
    </div>
  );
};

export default NewPurchaseOrderForm;
