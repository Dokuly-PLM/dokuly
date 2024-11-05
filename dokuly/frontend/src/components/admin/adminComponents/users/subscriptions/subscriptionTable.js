import React, { useEffect, useState } from "react";
import { Col, Container, Row } from "react-bootstrap";
import { toast } from "react-toastify";
import DokulyTable from "../../../../dokuly_components/dokulyTable/dokulyTable";
import DokulyModal from "../../../../dokuly_components/dokulyModal";
import SubmitButton from "../../../../dokuly_components/submitButton";
import CancelButton from "../../../../dokuly_components/cancelButton";
import AddButton from "../../../../dokuly_components/AddButton";
import {
  refreshPaddleSubscriptions,
  removePaddleSubscriptions,
} from "../../../functions/queries";

// Function to flatten a nested object
const flattenObject = (obj, excludeKey = "") => {
  const flattened = {};

  const go = (currentObj, prefix = "") => {
    for (const [key, value] of Object.entries(currentObj)) {
      const newPrefix = prefix ? `${prefix}.${key}` : key;

      if (typeof value === "object" && value !== null) {
        go(value, newPrefix);
      } else {
        if (excludeKey && newPrefix.startsWith(`${excludeKey}.`)) {
          flattened[newPrefix.substring(excludeKey.length + 1)] = value;
        } else if (!excludeKey) {
          flattened[newPrefix] = value;
        }
      }
    }
  };

  go(obj);
  return flattened;
};

const SubscriptionTable = ({
  subscriptions,
  setSeeSubs,
  setRefresh,
  refreshParent,
}) => {
  const [data, setData] = useState([]);
  const [open, setOpen] = useState(false);
  const [numberOfActiveSubs, setNumberOfActiveSubs] = useState(0);
  const [subsToRemove, setSubsToRemove] = useState(0);
  const [isInvalid, setIsInvalid] = useState(null);
  const [selectedSubscription, setSelectedSubscription] = useState({});

  const quantityFormatter = (row) => {
    return row?.quantity;
  };

  const checkSubs = (subs) => {
    if (subs?.length === 1) {
      if (subs[0].quantity === 1) {
        return true;
      }
    }
    let count = 0;
    for (let i = 0; i < subs.length; i++) {
      count += subs[i].quantity;
      if (count > 1) {
        return false;
      }
    }
    if (count <= 1) {
      return true;
    }
    return false;
  };

  const refreshDataFromPaddle = () => {
    refreshPaddleSubscriptions(true)
      .then((res) => {
        if (res.status === 200) {
          setRefresh(true);
        }
      })
      .catch((err) => {
        toast.error("Error refreshing data");
      })
      .finally(() => {
        refreshParent();
      });
  };

  const handleSubmit = () => {
    if (
      subsToRemove >= numberOfActiveSubs ||
      subsToRemove === 0 ||
      subsToRemove === ""
    ) {
      setIsInvalid(true);
    } else if (
      selectedSubscription?.status === "trialing" &&
      subsToRemove !== selectedSubscription.quantity
    ) {
      setIsInvalid(true);
      toast.error(
        "Trial plans cannot change their quantity. Finish the trial period or cancel the subscription.",
      );
      return;
    } else {
      setIsInvalid(false);
      const data = {
        subscription_id: selectedSubscription.subscription_id,
        quantity: subsToRemove,
      };
      removePaddleSubscriptions(data)
        .then((res) => {
          if (res.status === 200) {
            toast.success("Subscription removed successfully!");
            setRefresh(true);
          }
        })
        .catch((err) => {
          toast.error("Error removing subscription");
        })
        .finally(() => {
          setOpen(false);
          setSelectedSubscription({});
          setSubsToRemove(0);
          setIsInvalid(null);
          refreshParent();
        });
    }
  };

  const planFormatter = (row) => {
    return row?.plan_name;
  };

  const actionsFormatter = (row) => {
    let checkForLast = false;
    if (checkSubs(subscriptions)) {
      checkForLast = true;
    }
    return (
      <Row>
        <button
          type="button"
          className="btn btn-bg-transparent"
          onClick={() => {
            setSelectedSubscription(row);
            if (row?.status === "trialing") {
              setSubsToRemove(row?.quantity);
            }
            setOpen(true);
          }}
          data-toggle="tooltip"
          data-placement="top"
          title={
            checkForLast
              ? "Cannot remove last subscription! See Danger Zone on the general tab."
              : "Remove Subscription"
          }
          style={
            checkForLast ? { cursor: "not-allowed" } : { cursor: "pointer" }
          }
        >
          <img
            alt="trash icon"
            className="icon-dark"
            style={{ marginRight: "0.1rem", marginBottom: "0.2rem" }}
            src="../../static/icons/trash.svg"
          />
          <span className="btn-text">Remove subscription</span>
        </button>
      </Row>
    );
  };

  const columns = [
    {
      key: "subscription_plan_id",
      header: "Plan",
      formatter: planFormatter,
    },
    {
      key: "status",
      header: "Active",
    },
    {
      key: "quantity",
      header: "Quantity",
      formatter: quantityFormatter,
    },
    {
      isDummyField: true,
      header: "Actions",
      formatter: actionsFormatter,
    },
  ];

  useEffect(() => {
    if (subscriptions && subscriptions.length > 0) {
      const tempArr = subscriptions.map((entry) =>
        flattenObject(entry, "subscription_data"),
      );
      setData(tempArr);
      if (subscriptions.length === 1) {
        setNumberOfActiveSubs(subscriptions[0].count);
      } else {
        let count = 0;
        for (let i = 0; i < subscriptions.length; i++) {
          count += subscriptions[i].count;
        }
        setNumberOfActiveSubs(count);
      }
    }
  }, [subscriptions]);

  return (
    <div className="card-body card rounded bg-white p-5">
      <Row>
        <Col className="justify-content-start">
          <Row>
            <button
              type="button"
              className="btn btn btn-bg-transparent"
              onClick={(e) => {
                setSeeSubs(false);
                setRefresh(true);
              }}
            >
              <img
                className="icon-dark"
                style={{ marginRight: "0.1rem", marginBottom: "0.2rem" }}
                src="../../static/icons/arrow-left.svg"
                alt="arrow left"
              />
              <span className="btn-text">Back</span>
            </button>
            <h5 className="mt-2 ml-2">
              <b>Current subscriptions</b>
            </h5>
          </Row>
        </Col>
        <Col className="d-flex justify-content-end">
          <AddButton
            onClick={refreshDataFromPaddle}
            buttonText={"Refresh data"}
            imgSrc="../../static/icons/refresh.svg"
          />
        </Col>
      </Row>

      <DokulyTable
        data={data}
        columns={columns}
        showCsvDownload={false}
        showPagination={false}
        showSearch={false}
      />
      <DokulyModal
        show={open}
        onHide={() => setOpen(false)}
        title={"How many subscriptions would you like to remove?"}
      >
        <p>Active Subscriptions: {numberOfActiveSubs}</p>
        <div className="form-group">
          <label htmlFor="subsToRemove">Count to remove:</label>
          <input
            type="number"
            className={`form-control ${isInvalid ? "is-invalid" : ""}`}
            id="subsToRemove"
            value={subsToRemove}
            onChange={(e) => {
              const value = Number.parseInt(e.target.value, 10);
              setSubsToRemove(value);
            }}
            min="1"
            max={numberOfActiveSubs}
          />
          {isInvalid && (
            <div className="invalid-feedback">
              {selectedSubscription?.subscription_data?.status === "trailing"
                ? "Trial plans cannot change their quantity. Finish the trial period or by more subscriptions."
                : "Can't delete owner subscription. To cancel owner subscription, you must delete your workspace. By doing so, all your data will be lost."}
            </div>
          )}
        </div>
        <p>
          Subscriptions remaining after update:{" "}
          {numberOfActiveSubs - subsToRemove}
        </p>
        <Row className="ml-1">
          <SubmitButton onClick={handleSubmit}>Submit</SubmitButton>
          <CancelButton
            className="ml-2"
            onClick={() => {
              setSubsToRemove(0);
              setIsInvalid(null);
              setSelectedSubscription({});
              setOpen(false);
            }}
          >
            Cancel
          </CancelButton>
        </Row>
      </DokulyModal>
    </div>
  );
};

export default SubscriptionTable;
