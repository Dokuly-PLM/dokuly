import React, { useEffect, useState } from "react";
// import PlansTable from "../pricing/plansTable";
import { Col, Container, Row } from "react-bootstrap";
// import { paddleFetchSubscriptionsPlans } from "../functions/queries";
import { toast } from "react-toastify";
import PricingCardV2 from "./pricingCard";
import PricingCardV2Mobile from "./pricingCardMobile";

const PricingTable = ({
  subscriptions,
  setSelectedPlan,
  selectedPlan,
  activeUsers,
}) => {
  const [innerWidth, setInnerWidth] = useState(window.innerWidth);
  const widthToSwitchToMobileView = 1507;

  useEffect(() => {
    function handleResize() {
      setInnerWidth(window.innerWidth);
    }
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
    }, 0); // Adjust the delay as needed

    return () => {
      clearTimeout(timer);
    };
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    window.scrollTo({
      top: 200,
      behavior: "smooth",
    });
  }, [selectedPlan]);

  return (
    <div>
      <h5 className="text-center py-2">
        <span className="text-muted">
          <b>Build better products, faster.</b>{" "}
        </span>
      </h5>
      <Row>
        <Col className="col-10 col-sm-10 col-md-10 col-lg-4 offset-lg-0 offset-1">
          {" "}
          <PricingCardV2
            index={1} // 0 is the old free plan
            quantity={1}
            title="Dokuly Pro"
            price={30}
            minHeight="650px"
            subheader="For teams that want to gain control over their product management"
            plan_active={true}
            features={[
              "Product Data",
              "Document tracking",
              "BOM management",
              "Production data",
              "Time tracking",
              "Two-factor authentication",
              "API access",
              "?Requirements management",
            ]}
            setSelectedPlanLower={setSelectedPlan}
            selectedPlan={selectedPlan}
          />
        </Col>

        <Col className="col-10 col-sm-10 col-md-10 col-lg-4 offset-lg-0 offset-1">
          {" "}
          <PricingCardV2
            index={2}
            quantity={1}
            title="Dokuly Pro + Requirements"
            subheader="For teams that makes sure their products fulfill the requirements needed of their product"
            price={60}
            // limited_offer_price={0}
            pricing_recurring={"monthly"}
            plan_active={true}
            minHeight="650px"
            features={[
              "Product Data",
              "Document tracking",
              "BOM management",
              "Production data",
              "Time tracking",
              "Two-factor authentication",
              "API access",
              "Requirements management",
            ]}
            setSelectedPlanLower={setSelectedPlan}
            selectedPlan={selectedPlan}
          />
        </Col>
        <Col className="col-10 col-sm-10 col-md-10 col-lg-4 offset-lg-0 offset-1">
          {" "}
          <PricingCardV2
            index={3}
            quantity={1}
            title="Dokuly Enterprise"
            subheader="For large teams that need on-premise installation"
            contact_us={true}
            plan_active={true}
            minHeight="400px"
            features={[
              "Everything from Dokuly Pro + Requirements, plus:",
              "On-premise installation",
              "Migration services",
            ]}
            setSelectedPlanLower={setSelectedPlan}
            selectedPlan={selectedPlan}
          />
        </Col>
      </Row>

      <Row className="text-center text-muted mt-3 mb-5 ">
        <Col />
        <Col className="col-8">
          * Prices displayed in USD, per user. Taxes may apply.
          <br />
        </Col>
        <Col />
      </Row>
    </div>
  );
};

export default PricingTable;
