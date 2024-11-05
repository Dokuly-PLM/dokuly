import React, { useEffect, useState } from "react";
import { Col, Row } from "react-bootstrap";

const APIKeysPricingCard = (props) => {
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

  return (
    <div
      className="pricing-card"
      style={{ minHeight: props?.minHeight, maxHeight: props?.maxHeight }}
    >
      <div className="pricing-card-header">
        <h2 className="plan-name">{props.title}</h2>
        <p className="plan-price">
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
                  type="button"
                  className="plan-signup-btn"
                  onClick={() => {
                    props?.setSignupCompVault(true);
                    props?.setSelectedPlan({
                      price: props?.price,
                      title: props?.title,
                    });
                  }}
                >
                  Select Plan
                </button>
                {props?.freeTrail && (
                  <div className="text-muted text-center">
                    7 days free trail
                  </div>
                )}
              </span>
            )}
          </span>
        ) : (
          <span>
            <span className="plan-signup-btn-disabled">Coming soon</span>{" "}
            <div className="text-center" style={{ color: "#ffffff" }}>
              |
            </div>
          </span>
        )}
      </div>
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

export default APIKeysPricingCard;
