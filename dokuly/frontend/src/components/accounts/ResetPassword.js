import React, { useState } from "react";
import { useSpring, config, animated } from "react-spring";
import { Navigate, useNavigate } from "react-router-dom";
import { check_token, resetPassword } from "../admin/functions/queries";
import { toast } from "react-toastify";
import { useEffect } from "react";
import { Container } from "react-bootstrap";

const ResetPassword = (props) => {
  const url = window.location.href.toString();
  const split = url.split("/");
  const token = split[5];
  const userId = split[6];

  const [authenticated, setAuthenticated] = useState(false);
  const [redirect, setNavigate] = useState(false);
  const [errorStatus, setErrorStatus] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const [innerWidth, setInnerWidth] = useState(window.innerWidth);

  useEffect(() => {
    // Handler to call on window resize
    function handleResize() {
      // Set window width/height to state
      setInnerWidth(window.innerWidth);
    }

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Call handler right away so state gets updated with initial window size
    handleResize();

    // Remove event listener on cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, []); // Empty array ensures that effect is only run on mount

  useEffect(() => {
    const data = {
      token: token,
      user: parseInt(userId),
    };
    check_token(data)
      .then((res) => {
        if (res.status === 200) {
          setAuthenticated(true);
        }
      })
      .catch((err) => {
        setAuthenticated(false);
        setErrorStatus(err.response.status);
      });
  }, []);

  const savePassword = () => {
    if (password !== password2) {
      setErrorMsg("The passwords must match");
      return;
    }
    if (password.length < 8) {
      setErrorMsg(
        `Password must be atleast 8 characters long, current: ${password.length}`
      );
      return;
    }
    const data = {
      password: password,
      token: token,
    };
    resetPassword(parseInt(userId), data)
      .then((res) => {
        if (res.status === 202) {
          toast.success("Password updated, login to start session");
          setTimeout(setNavigate(true), 500);
        }
      })
      .catch((err) => {
        setAuthenticated(false);
        setErrorStatus(err.response.status);
        setErrorMsg("Error saving new password, contact admin.");
      });
  };

  const springCircleRender = useSpring({
    reset: true,
    from: { opacity: 0 },
    to: { opacity: 1 },
    config: config.slow,
  });

  const resetPasswordForm = () => {
    return (
      <React.Fragment>
        <div className="form-group">
          <label>New password</label>
          <input
            type="password"
            className="form-control"
            name="password"
            onChange={(e) => {
              setPassword(e.target.value);
            }}
            value={password}
          />
        </div>

        <div className="form-group">
          <div className="row">
            <div className="col">
              <label>Confirm password</label>
              <input
                type="password"
                className="form-control"
                name="password"
                onChange={(e) => {
                  setPassword2(e.target.value);
                }}
                value={password2}
              />
            </div>
            <div className="col-md-auto" style={{ marginTop: "1.8rem" }}>
              {password === password2 && password !== "" && password2 !== "" ? (
                <animated.div style={springCircleRender}>
                  <img
                    alt="Passwords Matching"
                    data-toggle="tooltip"
                    data-placement="right"
                    title="Passwords matching!"
                    src="../../../../static/icons/circle-check.svg"
                    style={{
                      filter:
                        "invert(81%) sepia(36%) saturate(4745%) hue-rotate(93deg) brightness(106%) contrast(101%)",
                      marginTop: "0.33rem",
                    }}
                    className="ml-1"
                    width="30px"
                    height="30px"
                  />
                </animated.div>
              ) : (
                <animated.div style={springCircleRender}>
                  <img
                    alt="Passwords Not Matching"
                    data-toggle="tooltip"
                    data-placement="right"
                    title="Passwords not matching!"
                    src="../../../../static/icons/alert-circle.svg"
                    style={{
                      filter:
                        "invert(42%) sepia(72%) saturate(6100%) hue-rotate(1deg) brightness(101%) contrast(107%)",
                      marginTop: "0.33rem",
                    }}
                    className="ml-1"
                    width="30px"
                    height="30px"
                  />
                </animated.div>
              )}
            </div>
            {errorMsg !== "" && (
              <span className="p-2" style={{ color: "red" }}>
                <b>{errorMsg}</b>
              </span>
            )}
          </div>
        </div>

        <div className="form-group">
          <button
            className="btn dokuly-bg-primary"
            type="button"
            onClick={(e) => {
              savePassword();
            }}
          >
            Save New Password
          </button>
        </div>
      </React.Fragment>
    );
  };

  if (redirect) {
    return (
      <div>
        <Navigate to="/login" />
      </div>
    );
  }

  if (
    localStorage.getItem("token") !== undefined &&
    localStorage.getItem("token") !== null
  ) {
    return (
      <div>
        <Navigate to="/" />
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-5 align-self-center">
            <div className="card card-body mt-5">
              <b>Status: {errorStatus} Check your email link or try again.</b>
              {errorMsg !== "" && (
                <h5 style={{ color: "red" }}>
                  <b>{errorMsg}</b>
                </h5>
              )}
              <button
                className="btn btn-sm btn-primary"
                style={{ marginTop: "1rem" }}
                type="button"
                onClick={() => {
                  setNavigate(true);
                }}
              >
                Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="m-1">
      {innerWidth > 650 ? (
        <Container>
          <div className="row justify-content-center">
            <div className="col-5">
              <div className="card card-body mt-5">
                <h2 className="text-center mb-2">Reset Password</h2>
                {resetPasswordForm()}
              </div>
            </div>
          </div>
        </Container>
      ) : (
        <div className="card card-body mt-5">
          <h2 className="text-center mb-2">Reset Password</h2>
          {resetPasswordForm()}
        </div>
      )}
    </div>
  );
};

export default ResetPassword;
