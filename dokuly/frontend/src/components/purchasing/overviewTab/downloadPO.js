import React, { useEffect, useRef, useState } from "react";
import { Modal, Button, Row, Col } from "react-bootstrap";
import { tableCss } from "./tableCss";
import { fetchSelectedLogoImage } from "../../timesheetAdmin/functions/queries";
import DokulyDateFormat from "../../dokuly_components/formatters/dateFormatter";
import DokulyPriceFormatter from "../../dokuly_components/formatters/priceFormatter";
import { fetchOrg } from "../../admin/functions/queries";
import { getUser } from "../../profiles/functions/queries";
import DokulyImage from "../../dokuly_components/dokulyImage";
import { toast } from "react-toastify";
import OrderItemsTable from "../orderItems/orderItemsTable";
import DokulyMarkdown from "../../dokuly_components/dokulyMarkdown/dokulyMarkdown";
import { exchangeTotalPrice, getExchangeRate } from "./information";
import AddButton from "../../dokuly_components/AddButton";
import SubmitButton from "../../dokuly_components/submitButton";

const DownLoadPO = ({ show, onHide, purchaseOrder, organization }) => {
  const modalContentRef = useRef(null);
  const tableRef = useRef(null);
  const [imageUri, setImageUri] = useState(-1);
  const [organizationName, setOrganizationName] = useState("");
  const [purchaserName, setPurchaserName] = useState("");

  useEffect(() => {
    fetchSelectedLogoImage()
      .then((res) => {
        if (res.status === 200) {
          setImageUri(res.data);
        } else {
          toast.error(res.data);
          setImageUri(-1);
        }
      })
      .catch((err) => {
        if (err) {
          setImageUri(-1);
          if (err?.response?.data && err?.response?.status !== 500) {
            toast.error(err.response.data);
          } else {
            toast.error("Something went wrong! Could not fetch the logo.");
          }
        }
      });

    fetchOrg().then((res) => {
      if (res.status === 200) {
        setOrganizationName(res.data.name);
      } else {
        toast.error(res.data);
        setOrganizationName("");
      }
    });

    getUser().then((res) => {
      if (res.status === 200) {
        setPurchaserName(`${res.data.first_name} ${res.data.last_name}`);
      } else {
        toast.error(res.data);
        setPurchaserName("");
      }
    });
  }, []);

  const handlePrint = () => {
    const printWindow = window.open("", "PRINT", "height=600,width=800");

    const content = modalContentRef.current?.innerHTML;
    const css = `
        ${tableCss}
        @media print {
            @page {
                size: A4 landscape;
                margin: 10mm;
            }
            body {
                width: 297mm;
                height: 210mm;
            }
        }
    `; // A4 size: 210mm x 297mm

    if (printWindow) {
      printWindow.document.write(`
            <html>
                <head>
                    <title>Print</title>
                    <style>${css}</style>
                </head>
                <body>${content}</body>
            </html>
        `);

      printWindow.document.close(); // necessary for IE >= 10
      printWindow.focus(); // necessary for IE >= 10

      printWindow.print();
      printWindow.close();
    }
  };

  return (
    <Modal
      dialogClassName="modal-90w"
      show={show}
      onHide={onHide}
      className="printable-modal"
    >
      <Modal.Header>
        <Modal.Title>{`PO${purchaseOrder?.purchase_order_number}`}</Modal.Title>{" "}
        <button
          type="button"
          className="close"
          aria-label="Close"
          onClick={onHide} // Remove the parentheses to pass the function
        >
          <span aria-hidden="true">&times;</span>
        </button>
      </Modal.Header>
      <Modal.Body>
        <div ref={modalContentRef}>
          <div className="print-div p-5">
            {purchaseOrder?.supplier && (
              <div className="row">
                <div className="col col-3 justify-content-center">
                  <div className="row">
                    <div className="col" style={{ marginTop: "-20px" }}>
                      {imageUri !== -1 && (
                        <DokulyImage
                          src={imageUri}
                          style={{ maxWidth: "180px", maxHeight: "80px" }}
                          alt="no logo set"
                        />
                      )}
                    </div>
                  </div>
                  <div className="row">
                    <div className="mt-3 col">
                      <h6>{organizationName}</h6>
                    </div>
                  </div>
                  <div className="row">
                    <div className="mt-1 col">
                      <b>Att.: </b>
                      {purchaserName}
                    </div>
                  </div>
                  <div className="row">
                    <div className="mt-1 col">
                      <b>Delivery address: </b>
                      {purchaseOrder?.delivery_address}
                    </div>
                  </div>
                  <div className="row">
                    <div className="mt-1 col">
                      <b>Postal code, City: </b>
                      {purchaseOrder?.postal_code}
                    </div>
                  </div>
                  <div className="row">
                    <div className="mt-1 col">
                      <b>Billing address: </b>
                      {purchaseOrder?.billing_address}
                    </div>
                  </div>
                  {purchaseOrder?.purchasing_reference && (
                    <div className="row">
                      <div className="mt-1 col">
                        <b>Purchasing reference: </b>
                        {purchaseOrder?.purchasing_reference}
                      </div>
                    </div>
                  )}
                </div>
                <div className="col col-4 justify-content-center">
                  <div className="row">
                    <h5>Supplier Information</h5>
                  </div>

                  <div className="row">
                    <div className="mt-1 col">
                      <b>Name:</b>
                    </div>
                    <div className="mt-1 col">
                      {purchaseOrder?.supplier?.name}
                    </div>
                  </div>

                  <div className="row">
                    <div className="mt-1 col">
                      <b>Contact: </b>
                    </div>
                    <div className="mt-1 col">
                      {purchaseOrder?.supplier?.contact}
                    </div>
                  </div>

                  <div className="row">
                    <div className="mt-1 col">
                      <b>Phone: </b>
                    </div>
                    <div className="mt-1 col">
                      {purchaseOrder?.supplier?.phone}
                    </div>
                  </div>

                  <div className="row">
                    <div className="mt-1 col">
                      <b>Email: </b>
                    </div>
                    <div className="mt-1 col">
                      {purchaseOrder?.supplier?.email}
                    </div>
                  </div>

                  <div className="row">
                    <div className="mt-1 col">
                      <b>PO Number: </b>
                    </div>
                    <div className="mt-1 col">
                      {purchaseOrder?.purchase_order_number}
                    </div>
                  </div>

                  <div className="row">
                    <div className="mt-1 col">
                      <b>Order date: </b>
                    </div>
                    <div className="mt-1 col">
                      <DokulyDateFormat date={purchaseOrder?.order_date} />
                    </div>
                  </div>

                  <div className="row">
                    <div className="mt-1 col">
                      <b>Incoterms: </b>
                    </div>
                    <div className="mt-1 col">
                      {purchaseOrder?.incoterms ? (
                        purchaseOrder?.incoterms
                      ) : (
                        <span className="badge badge-danger">Not selected</span>
                      )}
                    </div>
                  </div>

                  <div className="row">
                    <div className="mt-1 col">
                      <b>Payment Terms: </b>
                    </div>
                    <div className="mt-1 col">
                      {purchaseOrder?.payment_terms ? (
                        purchaseOrder?.payment_terms
                      ) : (
                        <span className="badge badge-danger">Not selected</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="col-5">
                  {(purchaseOrder?.notes || purchaseOrder?.notes !== "") && (
                    <>
                      <Row className="justify-content-left">
                        <b>Notes:</b>
                      </Row>
                      <Row>
                        <br />
                        <Col className="d-flex m-2">
                          <br />
                          <DokulyMarkdown markdownText={purchaseOrder?.notes} />
                        </Col>
                      </Row>
                    </>
                  )}
                </div>
              </div>
            )}
            <div className="row mb-2 mt-3">
              <OrderItemsTable
                po_id={purchaseOrder?.id}
                purchaseOrder={purchaseOrder}
                organizationCurrency={purchaseOrder?.po_currency}
                readOnly={true}
                isPrintable={true}
              />
            </div>
            <div className="row mt-5">
              <div className="col col-6" />
              <div className="col col-6">
                <div className="row">
                  <div className="mt-3 col">
                    <b>Total:</b>{" "}
                  </div>
                  <div className="mt-3 col">
                    <DokulyPriceFormatter
                      price={purchaseOrder?.total_price}
                      organization={organization}
                      supplier={purchaseOrder?.supplier}
                      returnRawPriceFormatted={true}
                      purchaseOrder={purchaseOrder}
                    />
                  </div>
                </div>
                <div className="row" style={{ paddingBottom: "0.5rem" }}>
                  <div className="mt-2 col">VAT:</div>
                  <div className="mt-2 col">{purchaseOrder?.vat}%</div>
                </div>
                <div
                  className="row"
                  style={{
                    borderTop: "1px dashed gray",
                  }}
                >
                  <div className="mt-2 col">
                    <b>Total inc. VAT:</b>{" "}
                  </div>
                  <div className="mt-2 col">
                    <DokulyPriceFormatter
                      price={
                        purchaseOrder?.total_price +
                        (purchaseOrder?.vat / 100) * purchaseOrder?.total_price
                      }
                      organization={organization}
                      supplier={purchaseOrder?.supplier}
                      returnRawPriceFormatted={true}
                      purchaseOrder={purchaseOrder}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer className="d-flex justify-content-start p-3">
        <Row className="w-100 justify-content-end">
          <Col />
          <Col className="col-2 d-flex justify-content-center">
            <SubmitButton
              type="button"
              id="print-button"
              className="btn-lg"
              onClick={() => handlePrint()}
            >
              Print
            </SubmitButton>
          </Col>
        </Row>
      </Modal.Footer>
    </Modal>
  );
};

export default DownLoadPO;
