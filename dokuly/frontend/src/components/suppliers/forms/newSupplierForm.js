import React, { useState, useEffect } from "react";
import { createSupplier } from "../functions/queries";
import SubmitButton from "../../dokuly_components/submitButton";
import GenericDropdownSelector from "../../dokuly_components/dokulyTable/components/genericDropdownSelector";
import useCurrencyConversions from "../../common/hooks/useCurrencyConversions";
import { getOrganizationCurrency } from "../../parts/functions/queries";
import DokulyModal from "../../dokuly_components/dokulyModal";
import PaymentTermsSelect from "../../purchasing/components/paymentTermsSelect";
import ShippingTermsSelect from "../../purchasing/components/shippingTermsSelect";

const NewSupplierForm = (props) => {
  const [supplierName, setSupplierName] = useState("");
  const [contact, setContact] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [currencyKeysOptions, setCurrencyKeysOptions] = useState([]);
  const [organizationCurrency, setOrganizationCurrency] = useState("");
  const [defaultCurrency, setDefaultCurrency] = useState("");
  const [defaultPaymentTerms, setDefaultPaymentTerms] = useState("");
  const [defaultShippingTerms, setDefaultShippingTerms] = useState("");
  const {
    currencyPairs,
    currencyKeys,
    conversionRate,
    fetchCurrencyConversions,
  } = useCurrencyConversions(organizationCurrency);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    getOrganizationCurrency().then((res) => {
      setOrganizationCurrency(res.data);
    });
    const currencyKeysOptions = currencyKeys.map((currency) => ({
      label: currency,
      value: currency,
    }));
    setCurrencyKeysOptions(currencyKeysOptions);
  }, [currencyKeys]);

  const openNewSupplierForm = () => {
    setShowModal(true);
  };

  function onSubmit(event) {
    event.preventDefault();

    const data = {
      name: supplierName,
      address: address,
      contact: contact,
      phone: phone,
      email: email,
      notes: notes,
      default_currency: defaultCurrency,
      default_payment_terms: defaultPaymentTerms,
      default_shipping_terms: defaultShippingTerms,
    };

    createSupplier(data).then((res) => {
      if (res.status === 201) {
        setSupplierName("");
        setAddress("");
        setContact("");
        setPhone("");
        setEmail("");
        setNotes("");
        setDefaultCurrency("");
        setDefaultPaymentTerms("");
        setDefaultShippingTerms("");
        props?.setRefresh(true);
      }
    });
    setShowModal(false);
  }

  return (
    <div className="container-fluid">
      <button
        type="button"
        className="btn btn-bg-transparent mt-2 mb-2"
        onClick={openNewSupplierForm}
      >
        <div className="row">
          <img
            className="icon-dark"
            src="../../static/icons/circle-plus.svg"
            alt="icon"
          />
          <span className="btn-text">New supplier</span>
        </div>
      </button>

      <DokulyModal
        show={showModal}
        onHide={() => setShowModal(false)}
        title="Create new supplier"
      >
        <div className="form-group">
          <label>Name*</label>
          <input
            className="form-control"
            type="text"
            name="supplierName"
            onChange={(e) => {
              setSupplierName(e.target.value);
            }}
            value={supplierName}
          />
        </div>

        <div className="form-group">
          <label>Address</label>
          <input
            className="form-control"
            type="text"
            name="address"
            onChange={(e) => {
              setAddress(e.target.value);
            }}
            value={address}
          />
        </div>

        <div className="form-group">
          <label>Contact</label>
          <input
            className="form-control"
            type="text"
            name="contact"
            onChange={(e) => {
              setContact(e.target.value);
            }}
            value={contact}
          />
        </div>

        <div className="form-group">
          <label>Phone</label>
          <input
            className="form-control"
            type="text"
            name="phone"
            onChange={(e) => {
              setPhone(e.target.value);
            }}
            value={phone}
          />
        </div>

        <div className="form-group">
          <label>Email</label>
          <input
            className="form-control"
            type="text"
            name="email"
            onChange={(e) => {
              setEmail(e.target.value);
            }}
            value={email}
          />
        </div>

        <div className="form-group">
          <label>Default currency</label>

          <GenericDropdownSelector
            state={defaultCurrency || null}
            setState={(value) => setDefaultCurrency(value)}
            dropdownValues={currencyKeysOptions}
            placeholder="Select currency"
            borderIfPlaceholder={true}
          />
        </div>

        <PaymentTermsSelect
          paymentTerms={defaultPaymentTerms}
          setPaymentTerms={setDefaultPaymentTerms}
        />

        <ShippingTermsSelect
          incoterm={defaultShippingTerms}
          setIncoterm={setDefaultShippingTerms}
        />

        <div className="form-group">
          <SubmitButton
            type={"submit"}
            className="btn dokuly-bg-primary "
            disabledTooltip="Please fill out all required fields."
            onClick={onSubmit}
            disabled={supplierName === ""}
          >
            Submit
          </SubmitButton>
        </div>
      </DokulyModal>
    </div>
  );
};

export default NewSupplierForm;
