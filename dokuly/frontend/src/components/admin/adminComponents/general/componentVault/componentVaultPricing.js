import React, { useEffect, useState } from "react";
import APIKeysPricingCard from "./apiKeysPricingCard";
import { Col, Container, Row } from "react-bootstrap";
import { useSpring, animated } from "react-spring";
import { basicFadeInSpring } from "../../../functions/helperFunctions";

const ComponentVaultPricing = ({
  orgId,
  setSignupCompVault,
  setSelectedPlan,
  setAddExistingKey,
}) => {
  const spring = useSpring(basicFadeInSpring());
  return (
    <animated.div style={spring}>
      <Container>
        <h1 className="display-4 text-center pt-5">
          Improve your production pipeline
        </h1>
        <h5 className=" text-center py-2">
          <span className="text-muted">
            <b>
              Build better products, <i>accurately</i>.
            </b>{" "}
          </span>
        </h5>
        <Row>
          <Col>
            <APIKeysPricingCard
              setSignupCompVault={setSignupCompVault}
              setSelectedPlan={setSelectedPlan}
              maxHeight={"30rem"}
              index={0}
              quantity={1}
              title="Component Vault Lite"
              subheader="For individuals and startups with limited budgets"
              price={15}
              freeTrail={true}
              minHeight="750px"
              plan_active={true}
              features={[
                "All features of Component Vault Standard except these limitations",
                "100 requests",
                "1 API Key",
                "? Volume breaks",
                "? Availability history",
                "? Pricing history",
              ]}
            />
          </Col>
          <Col>
            {" "}
            <APIKeysPricingCard
              setSignupCompVault={setSignupCompVault}
              setSelectedPlan={setSelectedPlan}
              maxHeight={"30rem"}
              index={0}
              quantity={1}
              title="Component Vault Standard"
              price={89}
              minHeight="750px"
              subheader="For engineering teams that require up-to-date data for their parts"
              features={[
                "All features of Component Vault Pro except these limitations:",
                "1 000 requests",
                "2 API keys",
                "? Availability history",
                "? Pricing history",
              ]}
            />
          </Col>
          <Col>
            {" "}
            <APIKeysPricingCard
              setSignupCompVault={setSignupCompVault}
              setSelectedPlan={setSelectedPlan}
              maxHeight={"30rem"}
              index={0}
              quantity={1}
              title="Component Vault Pro"
              subheader="For engineering teams that also need production timeline history"
              price={279}
              // limited_offer_price={0}
              pricing_recurring={"monthly"}
              // plan_active={true}
              minHeight="750px"
              features={[
                "10 000 requests",
                "3 API keys",
                "Availability overview",
                "Pricing data",
                "Technical specifications",
                "Environmental classifications",
                "Volume breaks",
                "Availability history",
                "Pricing history",
              ]}
            />
          </Col>
        </Row>
        <Row className="text-center text-muted mt-3 mb-5 ">
          <Col />
          <Col className="col-8">
            * Prices displayed in USD. Taxes may apply.
            <br />
          </Col>
          <Col />
        </Row>
        <Row className="text-center  mt-3 mb-5 ">
          <Col />
          <Col className="col-8">
            <button
              type="button"
              className="btn dokuly-bg-primary"
              onClick={() => {
                setAddExistingKey(true);
              }}
            >
              Add Existing Key
            </button>
          </Col>
          <Col />
        </Row>
      </Container>
    </animated.div>
  );
};

export default ComponentVaultPricing;
