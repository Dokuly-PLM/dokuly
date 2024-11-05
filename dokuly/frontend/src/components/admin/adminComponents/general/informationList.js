import React, { useState, useEffect } from "react";
import { useSpring, animated, config } from "react-spring";
import { newOrg, editOrg, deleteTenant } from "../../functions/queries";
import { fadeIn1C } from "../../functions/helperFunctions";
import "../../../projects/gantt/styling/gantt.css";
import { Col, Form, Row } from "react-bootstrap";
import Profile2FA from "../../../profiles/profileMfa";
import { toast } from "react-toastify";
import SubmitButton from "../../../dokuly_components/submitButton";

const InformationList = (props) => {
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(false);
  const [orgData, setOrgData] = useState(
    props.org !== null && props.org !== undefined ? props.org : { id: -1 }
  );
  const [edit, setEdit] = useState(false);
  const [name, setName] = useState("");
  const [num_employees, setNumEmployees] = useState(0);
  const [logo, setLogo] = useState(null);
  const [description, setDescription] = useState("");
  const [mutation, setMutation] = useState(false);
  const [prevEnforce2FA, setPrevEnforce2FA] = useState(false);
  const [enforce2FA, setEnforce2FA] = useState(false);
  const [confirm2FA, setConfirm2FA] = useState(false);
  const [checked, setChecked] = useState(false);
  const [currency, setCurrency] = useState("USD");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [country, setCountry] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [billingAddress, setBillingAddress] = useState("");

  const loadStates = (org) => {
    setName(org?.name ?? "");
    setNumEmployees(org?.num_employees ?? 1);
    setDescription(org?.description ?? "");
    setLogo(org?.logo ?? "");
    setEnforce2FA(org?.enforce_2fa ?? false);
    setPrevEnforce2FA(org?.enforce_2fa ?? false);
    setCurrency(org?.currency ?? "USD");
    setDeliveryAddress(org?.delivery_address ?? "");
    setCountry(org?.country ?? "");
    setPostalCode(org?.postal_code ?? "");
    setBillingAddress(org?.billing_address ?? "");
  };

  const submit = () => {
    if (prevEnforce2FA && orgData?.enforce_2fa && !enforce2FA) {
      setConfirm2FA(true);
      setRefresh(true);
      return;
    }
    if (name === "" || name.length < 1) {
      toast.error("Enter a name");
      return;
    }
    updateOrCreateOrg();
  };

  const deleteAccountDialog = () => {
    if (
      !confirm(
        "Continue the deletion dialog? You can still go back from this point."
      )
    ) {
      return;
    }
    if (
      !confirm(
        "Last chance to go back! Are you sure you want to continue the deletion dialog? Deleting the workspace is an IRREVERSIBLE action!"
      )
    ) {
      return;
    }
    $("#workspaceDeletion").modal("show");
  };

  const showModal = () => {
    if (edit) {
      $("#formModal").modal("show");
    } else {
      $("#formModal").modal("hide");
    }
  };

  useEffect(() => {
    setCurrency(orgData?.currency ?? "USD");
    showModal();
  }, [edit]);

  const editFormModal = (
    <div
      className="modal fade"
      id="formModal"
      tabIndex="-1"
      role="dialog"
      aria-labelledby="formModalLabel"
      aria-hidden="true"
    >
      <div className="modal-dialog" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" id="formModalLabel">
              {orgData?.id !== -1 ? "Edit Organization" : "Create Organization"}
            </h5>
            <button
              type="button"
              className="close"
              data-dismiss="modal"
              aria-label="Close"
              onClick={() => setEdit(false)}
            >
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div className="modal-body">
            {/* Name input */}
            <div className="form-group">
              <label>Name</label>
              <input
                className="form-control"
                type="text"
                placeholder="Enter the Organization name..."
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <Form.Group>
              <Form.Label>Delivery address</Form.Label>
              <Form.Control
                type="text"
                name="deliveryAddress"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
              />
            </Form.Group>
            <Row>
              <Col>
                <Form.Group className="mt-2">
                  <Form.Label>Country</Form.Label>
                  <Form.Control
                    type="text"
                    name="country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col>
                <Form.Group className="mt-2">
                  <Form.Label>ZIP / Postal code, City</Form.Label>
                  <Form.Control
                    type="text"
                    name="postalCode"
                    placeholder="3030, Oslo"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group>
              <Form.Label>Billing address</Form.Label>
              <Form.Control
                type="text"
                name="billingAddress"
                value={billingAddress}
                onChange={(e) => setBillingAddress(e.target.value)}
              />
            </Form.Group>

            {/* Currency select */}
            <div className="form-group mt-2">
              <label>Currency</label>
              <select
                className="form-control"
                name="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="NOK">NOK</option>
                <option value="DKK">DKK</option>
                <option value="PLN">PLN</option>
                <option value="CNY">CNY</option>
                <option value="JPY">JPY</option>
                <option value="SEK">SEK</option>
                <option value="CHF">CHF</option>
                <option value="CAD">CAD</option>
                <option value="AUD">AUD</option>
                <option value="NZD">NZD</option>
              </select>
            </div>

            {/* Two-factor authentication toggle */}
            <div className="form-group">
              <input
                className="dokuly-checkbox"
                type="checkbox"
                value={enforce2FA}
                checked={enforce2FA}
                onChange={() => setEnforce2FA(!enforce2FA)}
              />
              <label className="ml-2">
                {"Enable Two-Factor Authentication (2FA)?"}
              </label>
            </div>

            {/* Additional fields can be added here */}
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              data-dismiss="modal"
              onClick={() => setEdit(false)}
            >
              Close
            </button>
            <SubmitButton
              onClick={submit}
              type="button"
              className="btn dokuly-btn-primary"
            >
              Submit
            </SubmitButton>
          </div>
        </div>
      </div>
    </div>
  );

  const deleteAccount = () => {
    deleteTenant().then((res) => {
      if (res.status === 200) {
        $("workspaceDeletion").modal("hide");
        window.location.href = res.data;
      }
    });
  };

  const updateOrCreateOrg = () => {
    if (mutation) {
      editOrg(orgData.id, {
        name: name,
        description: description,
        enforce_2fa: enforce2FA,
        currency: currency,
        delivery_address: deliveryAddress,
        country: country,
        postal_code: postalCode,
        billing_address: billingAddress,
      })
        .then((res) => {
          if (res.status === 200) {
            setConfirm2FA(false);
            setOrgData(res.data);
            props.setOrgData(res.data);
          }
        })
        .finally(() => {
          if (!confirm2FA) {
            toast.success("Organization updated.");
          }
          setEdit(false);
          setRefresh(true);
          props.setRefresh(true);
        });
    } else {
      newOrg(data)
        .then((res) => {
          setOrgData(res.data);
          props.setOrgData(res.data);
        })
        .finally(() => {
          setEdit(false);
          setRefresh(true);
        });
    }
  };

  const fadeReverse = useSpring({ opacity: edit ? 0 : 1, config: config.slow });

  const fadeIn1 = useSpring(fadeIn1C(true));

  useEffect(() => {
    if (props.org !== null && props.org !== undefined && !edit) {
      loadStates(props.org);
      setOrgData(props.org);
    }
    if (refresh) {
      setRefresh(false);
    }
    setLoading(false);
    if (!(logo || edit)) {
      return;
    }
  }, [props, refresh]);

  if (confirm2FA) {
    return (
      <Profile2FA
        confirm={true}
        login={false}
        updateOrCreateOrg={updateOrCreateOrg}
      />
    );
  }

  if (orgData?.id !== -1) {
    return (
      <div>
        <animated.div style={fadeIn1}>
          <div className="row mb-4">
            {props?.user?.role === "Owner" && (
              <div className="col-md-auto">
                <button
                  className="btn btn-bg-transparent"
                  onClick={() => {
                    setEdit(true);
                    setMutation(true);
                    setRefresh(true);
                  }}
                >
                  <div className="row">
                    <img
                      src="../../../../static/icons/edit.svg"
                      className="icon-tabler-dark"
                      alt="edit"
                      width="30px"
                      height="30px"
                    />
                    <span className="btn-text">Edit</span>
                  </div>
                </button>
              </div>
            )}
          </div>
          <div className="row">
            <div className="col">
              <b>Name:</b>
            </div>
            <div className="col">{name}</div>
          </div>

          <div className="row">
            <div className="col">
              <b>2FA:</b>
            </div>
            <div className="col">{enforce2FA ? "Yes" : "No"}</div>
          </div>
          <div className="row">
            <div className="col">
              <b>Currency:</b>
            </div>
            <div className="col">{orgData?.currency}</div>
          </div>
          <div className="row">
            <div className="col">
              <b>Delivery Address:</b>
            </div>
            <div className="col">{orgData?.delivery_address}</div>
          </div>
          <div className="row">
            <div className="col">
              <b>Postal Code, City:</b>
            </div>
            <div className="col">{orgData?.postal_code}</div>
          </div>
          <div className="row">
            {props?.user?.role === "Owner" && (
              <div>
                <button
                  className="btn btn-bg-transparent mt-4 ml-4"
                  onClick={(e) => {
                    deleteAccountDialog();
                  }}
                >
                  <div className="row">
                    <img
                      className="icon-dark red-svg-color"
                      src="../../static/icons/trash.svg"
                      alt="trash"
                    />
                    <span className="btn-text text-danger">
                      Delete workspace
                    </span>
                  </div>
                </button>
              </div>
            )}
          </div>
        </animated.div>
        {editFormModal}
        <div
          className="modal fade"
          id="workspaceDeletion"
          tabIndex="-1"
          role="dialog"
          aria-labelledby="workspaceDeletion"
          aria-hidden="true"
        >
          <div className="modal-dialog" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" id="workspaceDeletionLabel">
                  Workspace deletion
                </h5>
              </div>
              <div className="m-2 p-2">
                <h6>
                  You are about to delete the workspace. This includes removing
                  all subscriptions to Dokuly, all user data and organization
                  data. {"\n"}
                  Your files will be kept in the storage system for 14 days,
                  however if you want them deleted contact support for instant
                  removal. The workspace will NOT remain active until the end of
                  the current subscription. Do you understand the terms and want
                  to finalize the deletion process?{" "}
                  <b>
                    There is no more dialog after pressing the delete button!
                  </b>
                </h6>
                <div
                  className="form-check"
                  style={{
                    marginLeft: "0.5rem",
                    marginTop: "1rem",
                    marginBottom: "1rem",
                  }}
                >
                  <input
                    className="form-check-input"
                    name="enableDeletionButton"
                    type="checkbox"
                    onChange={(e) => {
                      setChecked(e.target.checked);
                    }}
                    checked={checked}
                  />
                  <label
                    className="form-check-label"
                    htmlFor="flexCheckDefault"
                  >
                    Enable Deletion Button
                  </label>
                </div>
                <Row>
                  <Col>
                    {checked ? (
                      <button
                        className="btn btn-danger"
                        onClick={() => {
                          deleteAccount();
                        }}
                      >
                        Delete Workspace
                      </button>
                    ) : (
                      <button
                        className="btn btn-secondary"
                        disabled
                        style={{ cursor: "not-allowed" }}
                      >
                        Delete Workspace
                      </button>
                    )}
                  </Col>
                  <Col>
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        $("#workspaceDeletion").modal("hide");
                      }}
                    >
                      Cancel
                    </button>
                  </Col>
                </Row>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <animated.div style={fadeReverse}>
        <h5>
          <b>Organization setup not completed</b>
        </h5>
        <button
          onClick={() => {
            setEdit(true);
            setRefresh(true);
          }}
          className="btn btn-bg-transparent mt-2 mb-2"
        >
          <div className="row">
            <img
              className="icon-dark"
              src="../../static/icons/circle-plus.svg"
              alt="plus"
            />
            <span className="btn-text">Add organization</span>
          </div>
        </button>
      </animated.div>
    </div>
  );
};

export default InformationList;
