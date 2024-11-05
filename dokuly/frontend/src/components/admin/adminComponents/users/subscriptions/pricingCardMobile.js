import React from "react";
import { Container, Table, Col, Row } from "react-bootstrap";
import axios from "axios";
// import { paddleCheckoutDetails } from "../functions/queries";
import { toast } from "react-toastify";
import { useLocation, useNavigate } from "react-router-dom";

const PricingCardV2Mobile = (props) => {
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
      <div className="pricing-card-header text-center text-md-left">
        <h2 className="plan-name">{props.title}</h2>
        <p className="plan-price text-md">
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
            <span className="upperText"> /mo*</span>
          )}
        </p>
        {props?.selectedPlan?.plan?.index === props?.index ? (
          <Row className="align-items-center justify-items-center">
            <Col />
            <Col>
              <img
                alt="Selected"
                data-toggle="tooltip"
                data-placement="right"
                title="Selected"
                src="../../../static/icons/check.svg"
                style={{
                  filter:
                    "invert(81%) sepia(36%) saturate(4745%) hue-rotate(93deg) brightness(106%) contrast(101%)",
                }}
                width="30px"
                height="30px"
              />
            </Col>
            <Col />
          </Row>
        ) : (
          <div>
            {props.plan_active ? (
              <span>
                {props.contact_us ? (
                  <span>
                    <a
                      href="mailto:contact@dokuly.com"
                      className="plan-signup-btn-disabled"
                    >
                      Contact us
                    </a>
                    <div className="text-center" style={{ color: "#ffffff" }}>
                      |
                    </div>
                  </span>
                ) : (
                  <span>
                    <button
                      onClick={() => handlePlanSelect()}
                      className="plan-signup-btn"
                      type="button"
                    >
                      Select Plan
                    </button>

                    {props.price === 0 && (
                      <div className="text-muted text-center">
                        No credit card needed
                      </div>
                    )}
                  </span>
                )}
              </span>
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
          </div>
        )}
      </div>
      <div className="subheader">
        <p className="subheader-text py-1 py-md-3">{props.subheader}</p>
      </div>
      <div className="pricing-card-body">
        <ul className="pricing-card-list list-unstyled">
          {props?.features?.map((feature) => {
            return (
              <li className="pricing-card-list-item">
                <Row className="justify-content-center justify-content-md-start">
                  <Col xs={2} md={2}>
                    {feature?.toString().includes("?") ? (
                      <>{crossMark}</>
                    ) : (
                      <>{checkMark}</>
                    )}
                  </Col>
                  <Col xs={10} md={10}>
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
export default PricingCardV2Mobile;
