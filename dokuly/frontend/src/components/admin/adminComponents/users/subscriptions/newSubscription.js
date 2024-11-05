import React, { useEffect, useState } from "react";
import PricingTable from "./pricingTable";
import { Col, Container, Row } from "react-bootstrap";
import { paddleCheckoutDetails } from "../../../functions/queries";

export const getCheckoutMainDomain = () => {
  return "https://dokuly.com";
}

const NewSubscription = ({
  subscriptions,
  setAddSub,
  setRefresh,
  organizationId,
  tenant,
  token,
  allowedUsers,
}) => {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [planId, setPlanId] = useState(null);

  useEffect(() => {
    if (!selectedPlan) {
      return;
    }
    if (selectedPlan?.plan?.index) {
      const data = {
        index: selectedPlan.plan.index,
      }
      paddleCheckoutDetails(data).then((res) => {
        setPlanId(res.data.product_id);
      });
    }
  }, [selectedPlan]);

  const getTotal = (
    active_users,
    allowed_active_users,
    price,
    numberOfSubs,
  ) => {
    if (active_users > allowed_active_users) {
      if (numberOfSubs) {
        return active_users - allowed_active_users;
      }
      return price * (active_users - allowed_active_users);
    }
    if (numberOfSubs) {
      return 1;
    }
    return price * 1;
  };

  return (
    <div className="card-body card rounded bg-white p-5" style={{ width: "90%" }}>
      <Row className="mt-2 mb-2 ml-2">
        <button
          type="button"
          className="btn btn-bg-transparent mb-2"
          onClick={(e) => {
            setAddSub(false);
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
        <h5 className="mt-2 ml-2">Purchase subscriptions</h5>
      </Row>
      <PricingTable
        activeUsers={allowedUsers?.active_users}
        selectedPlan={selectedPlan}
        subscriptions={subscriptions}
        setSelectedPlan={setSelectedPlan}
      />
      {selectedPlan && planId && (
        <Row className="text-center mt-3 mb-5 ">
          <Col />
          <Col className="col-8">
            <div>
              <h5>
                <b>
                  Total: $
                  {getTotal(
                    allowedUsers?.active_users,
                    allowedUsers?.allowed_active_users,
                    selectedPlan.plan.price,
                    false,
                  )}{" "}
                  /mo
                </b>
              </h5>
            </div>

            <div>
              Total based on current active users missing a subscription:{" "}
              <b>
                {allowedUsers?.active_users} active users and{" "}
                {allowedUsers?.allowed_active_users} available subscriptions
              </b>
            </div>
          </Col>
          <Col />
        </Row>
      )}
      {selectedPlan && planId && (
        <a
          type="button"
          className="btn dokuly-bg-primary"
          style={{ color: "white" }}
          href={`${getCheckoutMainDomain()}/?product_id=${planId}&organization_id=${organizationId}&tenant=${tenant}&token=${token}&active_users=${getTotal(
            allowedUsers?.active_users,
            allowedUsers?.allowed_active_users,
            selectedPlan.plan.price,
            true,
          )}#/checkoutFromWorkspace`}
        >
          Checkout
        </a>
      )}
    </div>
  );
};

export default NewSubscription;
