import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { updateSupplier, deleteSupplier } from "../functions/queries";
import SubmitButton from "../../dokuly_components/submitButton";
import EditButton from "../../dokuly_components/editButton";
import GenericDropdownSelector from "../../dokuly_components/dokulyTable/components/genericDropdownSelector";
import useCurrencyConversions from "../../common/hooks/useCurrencyConversions";
import { getOrganizationCurrency } from "../../parts/functions/queries";
import DeleteButton from "../../dokuly_components/deleteButton";
import { Row, Col } from "react-bootstrap";
import DokulyModal from "../../dokuly_components/dokulyModal";
import PaymentTermsSelect from "../../purchasing/components/paymentTermsSelect";
import ShippingTermsSelect from "../../purchasing/components/shippingTermsSelect";
import DokulyFormSection from "../../dokuly_components/dokulyForm/dokulyFormSection";
import DropdownFormSection from "../../dokuly_components/dokulyForm/dropdownFormSection";
import DokulyCheckFormGroup from "../../dokuly_components/dokulyCheckFormGroup";

const EditSupplierForm = ({ supplier, setRefresh }) => {
  const [supplierName, setSupplierName] = useState("");
  const [contact, setContact] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [currencyKeysOptions, setCurrencyKeysOptions] = useState([]);
  const [organizationCurrency, setOrganizationCurrency] = useState("");
  const [defaultCurrency, setDefaultCurrency] = useState("");
  const [defaultPaymentTerms, setDefaultPaymentTerms] = useState("");
  const [defaultShippingTerms, setDefaultShippingTerms] = useState("");
  const [defaultVat, setDefaultVat] = useState("0");
  const [supplierTermsCollapsed, setSupplierTermsCollapsed] = useState(true);
  const [website, setWebsite] = useState("");
  const {
    currencyPairs,
    currencyKeys,
    conversionRate,
    fetchCurrencyConversions,
  } = useCurrencyConversions(organizationCurrency);

  const navigate = useNavigate();
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

  const [is_active, setIsActive] = useState(false);

  useEffect(() => {
    if (supplier === null) {
      return;
    }
    setSupplierName(supplier?.name ?? "");
    setWebsite(supplier?.website ?? "");
    setAddress(supplier?.address ?? "");
    setContact(supplier?.contact ?? "");
    setPhone(supplier?.phone ?? "");
    setEmail(supplier?.email ?? "");
    setIsActive(supplier?.is_active);
    setDefaultCurrency(supplier?.default_currency ?? "");
    setDefaultPaymentTerms(supplier?.default_payment_terms ?? "");
    setDefaultShippingTerms(supplier?.default_shipping_terms ?? "");
    setDefaultVat(supplier?.default_vat ?? "0");
  }, [supplier]);

  function onSubmit() {
    const data = {
      name: supplierName,
      address,
      website,
      contact,
      phone,
      email,
      is_active,
      default_currency: defaultCurrency,
      default_payment_terms: defaultPaymentTerms,
      default_shipping_terms: defaultShippingTerms,
      default_vat: Number.parseFloat(defaultVat),
    };

    updateSupplier(supplier.id, data).then((res) => {
      if (res.status === 200) {
        setRefresh(true);
      }
    });
    setShowModal(false);
  }

  const handleOnDelete = () => {
    if (!window.confirm("Are you sure you want to delete this supplier?")) {
      return;
    }
    setShowModal(false);
    deleteSupplier(supplier.id).then(() => {
      navigate("/suppliers");
    });
  };

  const supplierTermOptions = [
    {
      label: "Default currency",
      value: defaultCurrency,
      onChange: setDefaultCurrency,
      key: "default_currency",
      useCustomSelect: true,
      customSelectChildren: () => (
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
      ),
    },
    {
      label: "Default payment terms",
      value: defaultPaymentTerms,
      onChange: setDefaultPaymentTerms,
      key: "default_payment_terms",
      useCustomSelect: true,
      customSelectChildren: () => (
        <PaymentTermsSelect
          paymentTerms={defaultPaymentTerms}
          setPaymentTerms={setDefaultPaymentTerms}
        />
      ),
    },
    {
      label: "Default shipping terms",
      value: defaultShippingTerms,
      onChange: setDefaultShippingTerms,
      key: "default_shipping_terms",
      useCustomSelect: true,
      customSelectChildren: () => (
        <ShippingTermsSelect
          incoterm={defaultShippingTerms}
          setIncoterm={setDefaultShippingTerms}
        />
      ),
    },
    {
      label: "Default VAT",
      value: defaultVat,
      onChange: setDefaultVat,
      key: "default_vat",
    },
  ];

  return (
    <div className="container-fluid">
      <EditButton
        buttonText="Edit"
        onClick={() => {
          setShowModal(true);
        }}
      />
      <DokulyModal
        show={showModal}
        onHide={() => setShowModal(false)}
        title="Edit supplier"
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
          <label>Website </label>
          <input
            className="form-control"
            type="text"
            name="website"
            onChange={(e) => {
              setWebsite(e.target.value);
            }}
            value={website}
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

        <DropdownFormSection
          formGroups={supplierTermOptions}
          isCollapsed={supplierTermsCollapsed}
          handleToggle={() =>
            setSupplierTermsCollapsed(!supplierTermsCollapsed)
          }
          collapsedText="Supplier terms + currency"
          wrapperClassname="mt-1 mb-3"
          className="mt-1 mb-2"
        />

        <DokulyCheckFormGroup
          label={"Active"}
          onChange={(e) => {
            setIsActive(!is_active);
          }}
          value={is_active}
          id={"is_active"}
        />

        <div className="form-group">
          <Row>
            <Col>
              <SubmitButton
                onClick={onSubmit}
                disabled={supplierName === ""}
                disabledTooltip={"Please enter a supplier name"}
              >
                Submit
              </SubmitButton>
            </Col>
            <Col>
              <DeleteButton onDelete={handleOnDelete}>Delete</DeleteButton>
            </Col>
          </Row>
        </div>
      </DokulyModal>
    </div>
  );
};

export default EditSupplierForm;
