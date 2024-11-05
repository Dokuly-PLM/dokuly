import axios from "axios";
import React, { useEffect, useState } from "react";
import { Container, Row } from "react-bootstrap";
import { useSpring, animated } from "react-spring";
import { tokenConfig } from "../../../../configs/auth";
import { toast } from "react-toastify";

export const addNewSubscription = (data) => {
  const promise = axios.put(
    "api/profiles/manageSubscriptions/",
    data,
    tokenConfig(),
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

const PaymentSuccessful = (props) => {
  const [sentRequest, setSentRequest] = useState(false);

  useEffect(() => {
    if (!sentRequest && props?.success && props?.sessionID) {
      const data = {
        session_id: props.sessionID,
      };
      addNewSubscription(data)
        .then((res) => {
          if (res.status === 201) {
            window.location.href = res.data;
          }
        })
        .catch((err) => {
          toast.error(
            "An unknown error occurred, contact administrator or support",
          );
        });

      setSentRequest(true);
    }
  }, [sentRequest]);

  const [isMounted, setIsMounted] = useState(false);
  const springProps = useSpring({
    from: { opacity: 0, transform: "translate3d(0, 40px, 0)" },
    to: { opacity: 1, transform: "translate3d(0, 0, 0)" },
    config: { duration: 1000 },
    onStart: () => setIsMounted(true),
    onRest: () => setIsMounted(false),
  });

  return (
    <Container className="mt-30p">
      <Row>
        <div className="d-flex flex-column align-items-center">
          <h1 className="text-center">
            Congratulations, your payment was successful!
          </h1>
          <animated.img
            src="../../../../static/icons/check.svg"
            height={"150rem"}
            width={"150rem"}
            alt="checkmark"
            className="green-svg-color"
            style={springProps}
          />
          <p className="text-center">
            Your transaction has been processed and your purchase is complete.
          </p>
          <p className="text-center">
            A receipt for your purchase will be sent to the email address
            provided when the creation of your personal workspace is completed.
          </p>
          <p className="text-center">
            Thank you for choosing <a href="/">Dokuly</a> powered by Norsk
            Datateknikk AS.
          </p>
          <p className="text-center">
            <b>We will now redirect you back to your workspace!</b>
          </p>
        </div>
      </Row>
    </Container>
  );
};

export default PaymentSuccessful;
