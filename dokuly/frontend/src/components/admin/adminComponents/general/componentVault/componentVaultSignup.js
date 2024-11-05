import React, { useEffect, useState } from "react";
import { Col, Container, Row } from "react-bootstrap";
import {
  editOrg,
  sendRequestToComponentVault,
} from "../../../functions/queries";
import FormInput from "../../../../dokuly_components/formInput";
import { useSpring, animated } from "react-spring";
import { basicFadeInSpring } from "../../../functions/helperFunctions";
import { toast } from "react-toastify";

const ComponentVaultSignup = (props) => {
  const [email, setEmail] = useState("");
  const [emailCheck, setEmailCheck] = useState(0);
  const [inputOk, setInputOk] = useState(false);
  const [registrationSpinner, setRegistrationSpinner] = useState(false);

  const spring = useSpring(basicFadeInSpring());

  const inputCheck = () => {
    let ok = true;
    if (email === "") {
      ok = false;
      setEmailCheck(-2);
    } else {
      // Check that email is valid
      const regCheck = /\S+@\S+\.\S+/;
      const emailCheck = regCheck.test(email);
      if (!emailCheck) {
        ok = false;
        setEmailCheck(-1);
      } else {
        setEmailCheck(1);
      }
    }
    return ok;
  };

  const checkout = () => {
    if (inputCheck()) {
      setRegistrationSpinner(true);
      // checkout with paddle, if res here is good continue
      // checkoutPaddleComponentVault().then((res) => ...
      // TODO: remove api key after testing
      sendRequestToComponentVault({
        password: "AdmseroaisemoaeIAMDoimoamfseaofdsfsamefpo",
        request: "api/admin/generateApiKey/",
        method: "PUT",
      })
        .then((res) => {
          if (res.status === 200) {
            toast.success(
              "API key purchased, Component Vault welcomes you and your team onboard"
            );
            editOrg(props?.orgId, { component_vault_api_key: res.data })
              .then((res) => {
                toast.success("Organization updated, API key added");
              })
              .catch((err) => {
                toast.error("Error with updating organization.");
              })
              .finally(() => {
                props.setRefresh(true);
              });
          }
        })
        .catch((err) => {
          toast.error("Error with purchasing, try again later.");
        })
        .finally(() => {
          setRegistrationSpinner(false);
        });
    }
  };

  const emailFeedback = () => {
    if (emailCheck === -2) {
      return "Email is required.";
    }
    return "Email is not valid";
  };

  const checkEmail = () => {
    if (emailCheck === -1 || emailCheck === -2) {
      return "form-control is-invalid";
    } else if (emailCheck === 1) {
      return "form-control is-valid";
    }
    return "form-control";
  };

  const onChange = (e) => {
    if (e.target.value.length > 50) {
      alertR.info("Email input too long!");
      return;
    }
    setInputOk(false);
    setEmail(e.target.value);
  };

  useEffect(() => {}, [props]); // Empty useEffect for refresh on new props

  return (
    <Container>
      <animated.div
        className="card-body card rounded bg-white p-5 mt-2"
        style={spring}
      >
        <h5 className=" text-center py-2">
          <span className="text-muted">
            <b>
              Build better products, <i>accurately</i>.
            </b>{" "}
          </span>
        </h5>
        <FormInput
          input={email}
          onChange={onChange}
          feedback={emailFeedback}
          buttonClassName={checkEmail}
          includeColSpacing={true}
          labelTitle={"Business email address*"}
          rowClassName={"pb-2"}
          type="text"
        />
        {!inputOk && (
          <Row>
            <Col />{" "}
            <small className="mt-2 text-color-gray">* required fields</small>
            <Col />{" "}
          </Row>
        )}
        {/* TODO: fix weird centering bug here */}
        <Container className="py-2">
          <Row>
            <Col />{" "}
            <button
              className="btn btn-danger mt-4 mr-4"
              type="button"
              onClick={() => {
                props.setSignupCompVault(false);
              }}
            >
              Cancel
            </button>
            {registrationSpinner ? (
              <button className="btn btn-sm btn-bg-transparent" type="button">
                <div className="spinner-border" role="status" />
              </button>
            ) : (
              <button
                type="button"
                className="btn dokuly-bg-primary mt-4 mr-4"
                onClick={() => {
                  checkout();
                }}
              >
                Checkout
              </button>
            )}
            <Col />
          </Row>
          <Row className="pb-2 mt-4">
            <Col />
            <span className="text-muted">
              By clicking 'Checkout', I agree to Component Vault's{" "}
              <a
                href="https://www.freeprivacypolicy.com/live/786c20c6-50a3-4890-8099-c52abe4e0d90"
                target="_blank"
                rel="noreferrer"
                className="border-bottom"
              >
                {" "}
                End-User License Agreement
              </a>{" "}
              and{" "}
              <a
                href="https://www.freeprivacypolicy.com/live/5abe812f-a944-4693-9109-1fd42e9fed66"
                target="_blank"
                rel="noreferrer"
                className="border-bottom"
              >
                Privacy Policy
              </a>
            </span>
            <Col />
          </Row>
        </Container>
      </animated.div>
    </Container>
  );
};

export default ComponentVaultSignup;
