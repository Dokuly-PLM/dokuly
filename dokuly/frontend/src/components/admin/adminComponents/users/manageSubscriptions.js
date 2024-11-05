import axios from "axios";
import React, { useEffect, useState } from "react";
import { Col, Container, Row } from "react-bootstrap";
import { tokenConfig } from "../../../../configs/auth";
import { fetchOrg, getMaxAllowedActiveUsers } from "../../functions/queries";
import { toast } from "react-toastify";
import NewSubscription from "./subscriptions/newSubscription";
import SubscriptionTable from "./subscriptions/subscriptionTable";

export const fetchSubscriptions = () => {
  const promise = axios.get("api/profiles/manageSubscriptions/", tokenConfig());
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const deleteSubscription = (data) => {
  const promise = axios.post(
    "api/profiles/manageSubscriptions/",
    data,
    tokenConfig()
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const getSubdomain = () => {
  const hostname = window.location.hostname;
  const parts = hostname.split(".");

  // Check if running on localhost
  if (hostname.includes("localhost")) {
    return parts[0];
  }

  if (parts.length > 2) {
    return parts[0];
  }

  return null; // No subdomain
};

const ManageSubscriptions = (props) => {
  const [maxAllowedUsers, setMaxAllowedUsers] = useState(
    props?.allowedUsers !== null && props?.allowedUsers !== undefined
      ? props?.allowedUsers
      : null
  );
  const [refresh, setRefresh] = useState(false);
  const [addSub, setAddSub] = useState(false);
  const [seeSubs, setSeeSubs] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [subscriptionToEdit, setSubscriptionToEdit] = useState({});
  const [subscriptions, setSubscriptions] = useState(null);
  const [newQty, setNewQty] = useState(0);
  const [removeQty, setRemoveQty] = useState(0);
  const [token, setToken] = useState(null);
  const [organizationId, setOrganiztionId] = useState(null);
  const [tenant, setTenant] = useState(null);

  useEffect(() => {
    if (props?.allowedUsers !== null && props?.allowedUsers !== undefined) {
      setMaxAllowedUsers(props?.allowedUsers);
    }
    if (maxAllowedUsers === null || maxAllowedUsers === undefined || refresh) {
      getMaxAllowedActiveUsers().then((res) => {
        setMaxAllowedUsers(res.data);
      });
    }
    if (subscriptions === null || refresh) {
      fetchSubscriptions().then((res) => {
        setSubscriptions(res.data);
        if (props?.setSubscriptions) {
          props.setSubscriptions(res.data);
        }
      });
    }
    setRefresh(false);
  }, [props, refresh]);

  useEffect(() => {
    setToken(localStorage.getItem("token"));
    fetchOrg().then((res) => {
      setOrganiztionId(res.data.id);
    });
    setTenant(getSubdomain());
  }, []);

  const refreshParent = () => {
    props?.setRefresh(true);
  };

  if (addSub) {
    return (
      <NewSubscription
        allowedUsers={maxAllowedUsers ? maxAllowedUsers : props.allowedUsers}
        organizationId={organizationId}
        token={token}
        tenant={tenant}
        subscriptions={subscriptions}
        setRefresh={setRefresh}
        setAddSub={setAddSub}
      />
    );
  }

  if (seeSubs) {
    return (
      <SubscriptionTable
        subscriptions={subscriptions}
        setRefresh={setRefresh}
        setSeeSubs={setSeeSubs}
        refreshParent={refreshParent}
      />
    );
  }

  return (
    <div className="card-body card rounded bg-white p-5">
      <h5>
        <b>Manage subscriptions</b>
      </h5>
      <Row>
        <button
          type="button"
          className="btn btn btn-bg-transparent mt-2 mb-2"
          onClick={(e) => {
            props?.setRefresh(true);
            setRefresh(true);
            setAddSub(true);
          }}
        >
          <img
            className="icon-dark"
            style={{ marginRight: "0.1rem", marginBottom: "0.2rem" }}
            src="../../static/icons/circle-plus.svg"
            alt="plus"
          />
          <span className="btn-text">Add subscription</span>
        </button>
        <button
          type="button"
          className="btn btn btn-bg-transparent mt-2 mb-2"
          onClick={(e) => {
            props?.setRefresh(true);
            setRefresh(true);
            setSeeSubs(true);
          }}
        >
          <img
            className="icon-dark"
            style={{ marginRight: "0.1rem", marginBottom: "0.2rem" }}
            src="../../static/icons/eye.svg"
            alt="eye"
          />
          <span className="btn-text">View subscriptions</span>
        </button>
        <h5 className="ml-2 mt-3">
          {maxAllowedUsers?.active_users} /{" "}
          {maxAllowedUsers?.allowed_active_users} Active users
        </h5>
        <h5 className="ml-4 mt-3">
          {maxAllowedUsers?.viewer_users ?? 0} /{" "}
          {maxAllowedUsers?.allowed_viewer_users ?? 0} Viewer users
        </h5>
      </Row>
    </div>
  );
};

export default ManageSubscriptions;
