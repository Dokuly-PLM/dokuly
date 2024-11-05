import React, { useContext, useEffect, useRef, useState } from "react";
import {
  disable2FATotp,
  enable2FATotp,
  enable2FATotpFromLogin,
  getUserProfile,
  verify2FA,
  verify2FANoToken,
} from "./functions/queries";
import { QRCodeSVG } from "qrcode.react";
import { Col, Container, Row } from "react-bootstrap";
import { useNavigate } from "react-router";
import {
  loadingSpinner,
  loadingSpinnerCustomMarginAndColor,
} from "../admin/functions/helperFunctions";
import { toast } from "react-toastify";
import { AuthContext } from "../App";
import TOTPInput from "./forms/totpLoginForm";

const Profile2FA = (props) => {
  const { isAuthenticated, setIsAuthenticated } = useContext(AuthContext);
  const [refresh, setRefresh] = useState(false);
  const [profile, setProfile] = useState(
    props?.profile !== null && props?.profile !== undefined
      ? props.profile
      : null,
  );

  const [qrUri, setQrUri] = useState(
    props?.uri !== null && props?.uri !== undefined ? props.uri : null,
  );
  const checkLoading = () => {
    if (props?.uri !== null && props?.uri !== undefined) {
      return false;
    }
    if (
      props?.generateQr !== null &&
      props?.generateQr !== undefined &&
      props?.generateQr === true
    ) {
      return true;
    }
    return false;
  };
  const [mfaStatus, setMfaStatus] = useState(0);
  const [loading, setLoading] = useState(checkLoading());
  const [loadingVerify, setLoadingVerify] = useState(false);
  const [totpCodes, setTOTPCodes] = useState(Array(6).fill(""));
  const [totpCodesNoArray, setTOTPCodesNoArray] = useState(null);
  const [innerWidth, setInnerWidth] = useState(1300);
  const innerWidthLimit = 1080;

  const navigate = useNavigate();

  const verifyToken = () => {
    let data = {};
    if (props?.login) {
      data = {
        code: totpCodesNoArray !== null ? totpCodesNoArray : totpCodes.join(""),
        onLogin: true,
        username: props?.username,
        password: props?.password,
      };
    }
    if (props?.mfaMissing) {
      data = {
        code: totpCodesNoArray !== null ? totpCodesNoArray : totpCodes.join(""),
        onMissing: true,
        username: props?.username,
        password: props?.password,
      };
    }
    if (props?.confirm) {
      data = {
        code: totpCodesNoArray !== null ? totpCodesNoArray : totpCodes.join(""),
        onConfirm: true,
      };
    }
    if (!(props?.login || props?.confirm || props?.mfaMissing)) {
      // Setup new MFA device
      data = {
        code: totpCodesNoArray !== null ? totpCodesNoArray : totpCodes.join(""),
      };
    }
    if (props?.login) {
      verify2FANoToken(data)
        .then((res) => {
          if (res.status === 200) {
            setLoadingVerify(false);
            setMfaStatus(1);
            if (props?.login || props?.mfaMissing) {
              if (props?.login) toast.success("Login successful");
              else toast.success("2FA added, login successful");
              localStorage.setItem("token", res.data.token);
              localStorage.setItem("token_created", res.data.token_created);
              props.setUser(res.data.user);
              if (localStorage.getItem("prevPath")) {
                navigate(localStorage.getItem("prevPath").toString(""));
              } else {
                navigate("/");
              }
              setIsAuthenticated(true);
            }
          }
        })
        .catch((err) => {
          setLoadingVerify(false);
          if (err) {
            if (err.response.status === 409) {
              setMfaStatus(-1); // Error with device
            }
            if (err.response.status === 406) {
              setTOTPCodesNoArray("");
              setTOTPCodes(Array(6).fill(""));
              setMfaStatus(-2); // Codes not matching
            }
            if (err.response.status === 404) {
              setMfaStatus(-3); // Profile not found
            }
            if (err.response.status === 400) {
              setMfaStatus(-4); // Server error
            }
          }
        })
        .finally(() => {
          setLoadingVerify(false);
        });
    } else {
      verify2FA(data)
        .then((res) => {
          if (res.status === 200) {
            setLoadingVerify(false);
            setMfaStatus(1);
            if (
              props?.confirm &&
              props?.updateOrCreateOrg !== null &&
              props?.updateOrCreateOrg !== undefined
            ) {
              toast.success("2FA protocol updated for workspace.");
              props?.updateOrCreateOrg();
              props?.setRefresh();
            }
            toast.success("2FA added");
            setIsAuthenticated(true);
          }
        })
        .catch((err) => {
          setLoadingVerify(false);
          if (err) {
            if (err.response.status === 409) {
              setMfaStatus(-1); // Error with device
            }
            if (err.response.status === 406) {
              setTOTPCodesNoArray("");
              setTOTPCodes(Array(6).fill(""));
              setMfaStatus(-2); // Codes not matching
            }
            if (err.response.status === 404) {
              setMfaStatus(-3); // Profile not found
            }
            if (err.response.status === 400) {
              setMfaStatus(-4); // Server error
            }
          }
        })
        .finally(() => {
          setLoadingVerify(false);
          setRefresh(true);
          if (props?.setRefresh !== null && props?.setRefresh !== undefined) {
            props?.setRefresh(true);
          }
        });
    }
  };

  useEffect(() => {
    // Handler to call on window resize
    function handleResize() {
      // Set window width/height to state
      setInnerWidth(window.innerWidth);
      if (window.innerWidth < innerWidthLimit) {
        setTOTPCodesNoArray("");
      }
    }

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Call handler right away so state gets updated with initial window size
    handleResize();

    // Remove event listener on cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, []); // Empty array ensures that effect is only run on mount

  const keyHandler = (e) => {
    if (e.key === "Enter" && totpCodes.join("") !== "") {
      verifyToken();
    }
    if (e.key === "Enter" && totpCodes.join("") === "") {
      setMfaStatus(-5);
    }
  };

  const useEventListener = (eventName, handler, element = window) => {
    const savedHandler = useRef();
    useEffect(() => {
      savedHandler.current = handler;
    }, [handler]);

    useEffect(() => {
      const isSupported = element?.addEventListener;
      if (!isSupported) return;
      const eventListener = (event) => savedHandler.current(event);
      element.addEventListener(eventName, eventListener);
      return () => {
        element.removeEventListener(eventName, eventListener);
      };
    }, [eventName, element]);
  };

  useEventListener("keydown", keyHandler);

  const enable2fa = () => {
    if (props?.mfaMissing !== null && props?.mfaMissing !== undefined) {
      if (props?.mfaMissing) {
        enable2FATotpFromLogin({
          username: props?.username,
          password: props?.password,
        })
          .then((res) => {
            setQrUri(res.data);
          })
          .catch((err) => {})
          .finally(() => {
            setLoading(false);
            setRefresh(true);
            if (
              !props?.login &&
              props?.setRefresh !== undefined &&
              props?.setRefresh !== null
            ) {
              props?.setRefresh(true);
            }
          });
        return;
      }
    }
    enable2FATotp()
      .then((res) => {
        setQrUri(res.data);
      })
      .catch((err) => {})
      .finally(() => {
        setLoading(false);
        setRefresh(true);
        if (!props?.login) {
          props?.setRefresh(true);
        }
      });
  };

  const getErrorStatus = () => {
    if (mfaStatus === -1) {
      return "Error with the device, contact admin";
    }
    if (mfaStatus === -2) {
      return "Codes not matching, try again";
    }
    if (mfaStatus === -3) {
      return "Profile not found, try again";
    }
    if (mfaStatus === -4) {
      return "Server error, try again later";
    }
    if (mfaStatus === -5) {
      return "Enter a totp code";
    }
  };

  const getClassnameOTPInput = () => {
    if (mfaStatus === 1) {
      return "form-control is-valid";
    }
    if (mfaStatus < 0) {
      return "form-control is-invalid";
    }
    return "form-control";
  };

  useEffect(() => {
    if (!props?.login) {
      if (props?.profile !== null && props?.profile !== undefined) {
        setProfile(props.profile);
      }
      if (profile == null || refresh) {
        getUserProfile().then((res) => {
          setProfile(res.data);
        });
      }
    }
    setRefresh(false);
  }, [props, refresh]);

  useEffect(() => {
    if (props?.generateQr && !props?.profile?.mfa_validated && !props?.login) {
      enable2fa();
    }
  }, []);

  useEffect(() => {
    if (totpCodes) {
      let lastNumberInputed = true;
      for (let i = 0; i < totpCodes.length; i++) {
        if (totpCodes[i] === "") {
          lastNumberInputed = false;
          break;
        }
      }
      if (lastNumberInputed) {
        setLoadingVerify(true);
        verifyToken();
      }
    }
  }, [totpCodes]);

  useEffect(() => {
    if (totpCodesNoArray) {
      if (totpCodesNoArray.length === 6) {
        setLoadingVerify(true);
        verifyToken();
      }
    }
  }, [totpCodesNoArray]);

  if (loading) {
    return loadingSpinner();
  }

  if (props?.login) {
    return (
      <Container style={{ maxWidth: "40rem" }}>
        <div className="card-body card rounded bg-white shadow-sm rounded mt-5">
          <Row className="justify-content-center">
            <h5>2FA Authentication</h5>
          </Row>
          <Row className="justify-content-center mt-4">
            <div className="form-group mt-2">
              {innerWidth < innerWidthLimit ? (
                <div className="form-group">
                  <input
                    className={getClassnameOTPInput()}
                    value={totpCodesNoArray}
                    onChange={(e) => {
                      setTOTPCodesNoArray(e.target.value);
                    }}
                  />
                </div>
              ) : (
                <TOTPInput
                  totpCodes={totpCodes}
                  setTOTPCodes={setTOTPCodes}
                  getErrorStatus={getErrorStatus}
                />
              )}
              <Row className="justify-content-center mt-2">
                <div className="form-group">
                  <small className="form-text dokuly-danger">
                    {getErrorStatus()}
                  </small>
                </div>
              </Row>
              <Row className="justify-content-center mt-2">
                <button
                  className="btn btn-primary dokuly-bg-primary"
                  type="button"
                  onClick={() => {
                    verifyToken();
                  }}
                  style={{
                    width: "8rem",
                    maxWidth: "8rem",
                    minWidth: "8rem",
                    height: "3rem",
                    maxHeight: "3rem",
                    minHeight: "3rem",
                  }}
                >
                  {loadingVerify
                    ? loadingSpinnerCustomMarginAndColor(
                        0,
                        0,
                        0,
                        0,
                        "dokuly-white",
                      )
                    : "Submit"}
                </button>
              </Row>
            </div>
          </Row>
          <Row className="justify-content-center mt-4">
            <Col className="col-8 col-sm-8 col-md-8 col-lg-8 col-xl-8">
              <small>
                Enter the code from your two-factor authenticator app. If you've
                lost your device, either enter a backup code or contact your
                workspace admin to reset the device.
              </small>
            </Col>
          </Row>
        </div>
      </Container>
    );
  }

  if (qrUri !== null && qrUri !== undefined) {
    return (
      <Container style={{ maxWidth: "40rem" }}>
        <div className="card-body card rounded bg-white shadow-sm rounded mt-5">
          <Row className="justify-content-center">
            <h5>2FA Verification</h5>
          </Row>
          <Row className="justify-content-center mt-4">
            <QRCodeSVG value={qrUri} />
          </Row>
          <Row className="justify-content-center mt-4">
            <div className="form-group mt-2">
              {innerWidth < innerWidthLimit ? (
                <div className="form-group">
                  <input
                    className={getClassnameOTPInput()}
                    value={totpCodesNoArray}
                    onChange={(e) => {
                      setTOTPCodesNoArray(e.target.value);
                    }}
                  />
                </div>
              ) : (
                <TOTPInput
                  totpCodes={totpCodes}
                  setTOTPCodes={setTOTPCodes}
                  getErrorStatus={getErrorStatus}
                />
              )}
              <Row className="justify-content-center mt-2">
                <div className="form-group">
                  <small className="form-text dokuly-danger">
                    {getErrorStatus()}
                  </small>
                </div>
              </Row>
              <Row className="justify-content-center mt-2">
                <button
                  className="btn btn-primary dokuly-bg-primary"
                  type="button"
                  onClick={() => {
                    verifyToken();
                  }}
                  style={{
                    width: "8rem",
                    maxWidth: "8rem",
                    minWidth: "8rem",
                    height: "3rem",
                    maxHeight: "3rem",
                    minHeight: "3rem",
                  }}
                >
                  {loadingVerify
                    ? loadingSpinnerCustomMarginAndColor(
                        0,
                        0,
                        0,
                        0,
                        "dokuly-white",
                      )
                    : "Submit"}
                </button>
              </Row>
            </div>
          </Row>
          <Row className="justify-content-center mt-4">
            <Col className="col-8 col-sm-8 col-md-8 col-lg-8 col-xl-8">
              {props?.generateQr ? (
                <small>
                  Your organization requires 2FA. Set up on your preferred 2FA
                  application, and enter the passcode below to authenticate.
                </small>
              ) : (
                <small>
                  Enter the passcode from your TOTP device to verify the MFA
                  device and activate MFA on your account.
                </small>
              )}
            </Col>
          </Row>
        </div>
      </Container>
    );
  }

  return <div>Ops, something went wrong here, try reloading...</div>;
};

export default Profile2FA;
