import React from "react";
import { Container, Table, Col, Row } from "react-bootstrap";
import axios from "axios";
// import { paddleCheckoutDetails } from "../functions/queries";
import { toast } from "react-toastify";
import { useLocation, useNavigate } from "react-router-dom";

const PricingCardV2 = (props) => {
  const location = useLocation();
  const navigate = useNavigate();

  const checkMark = (
    <img
      src="../../static/icons/check.svg"
      alt="check"
      className="red-svg-color"
      style={{
        filter:
          "invert(23%) sepia(97%) saturate(2279%) hue-rotate(93deg) brightness(90%) contrast(84%)",
        width: "30px",
        height: "30px",
      }}
    />
  );

  const crossMark = (
    <img
      src="../../static/icons/x.svg"
      alt="Not Included"
      className="red-svg-color"
      style={{
        width: "30px",
        height: "30px",
      }}
    />
  );

  const handlePlanSelect = () => {
    props?.setSelectedPlanLower({ plan: props });
  };

  return (
    <div className="pricing-card" style={{ minHeight: props?.minHeight }}>
      <Row className="pricing-card-header justify-content-center">
        <Col>
          <h2 className="plan-name text-center">{props.title}</h2>
          <p className="plan-price text-center">
            {props.limited_offer_price !== undefined ? (
              <span>
                <span className="limited-time-offer">
                  Limited time offer** <br />
                </span>
                <span className="strikethrough">${props.price}</span>{" "}
                <span>${props.limited_offer_price}</span>
              </span>
            ) : (
              <span>
                <span className="limited-time-offer">
                  <br />
                </span>

                {props.contact_us ? (
                  <span>Contact us </span>
                ) : (
                  <span>${props.price}</span>
                )}
              </span>
            )}

            {props.contact_us ? (
              <span className="upperText" style={{ color: "#ffffff" }}>
                |
              </span>
            ) : (
              <span className="upperText"> per seat / mo*</span>
            )}
          </p>
          {props.plan_active ? (
            <Row className="text-center justify-content-center">
              {props.contact_us ? (
                <span style={{ marginTop: "1rem", marginBottom: "0.8rem" }}>
                  <a
                    href="mailto:contact@dokuly.com"
                    className="contact-us-button"
                  >
                    Contact us
                  </a>
                </span>
              ) : (
                <span>
                  <button
                    onClick={() => handlePlanSelect()}
                    className="cta-button"
                    type="button"
                  >
                    Select Plan
                  </button>

                  {props.price === 0 && (
                    <div
                      className="text-muted text-center"
                      style={{ marginBottom: "-1.3rem" }}
                    >
                      No credit card needed
                    </div>
                  )}
                </span>
              )}
            </Row>
          ) : (
            <button
              className="plan-signup-btn"
              type="button"
              onClick={() => {
                handleCheckout();
              }}
            >
              Test Paddle!
            </button>
          )}
        </Col>
      </Row>
      <div className="subheader">
        <p className="subheader-text py-1">{props.subheader}</p>
      </div>
      <div className="pricing-card-body">
        <ul className="pricing-card-list list-unstyled">
          {props?.features?.map((feature) => {
            return (
              <li className="pricing-card-list-item">
                <Row>
                  <Col className="col-2">
                    {feature?.toString().includes("?") ? (
                      <>{crossMark}</>
                    ) : (
                      <>{checkMark}</>
                    )}
                  </Col>
                  <Col className="col-10">
                    <span className="pricing-card-list-item-text">
                      {feature?.toString().replace("?", "")}
                    </span>
                  </Col>
                </Row>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};
export default PricingCardV2;
