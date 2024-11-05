import React, { useState, useEffect, useContext } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { sendResetPassMail } from "../admin/functions/queries";
import axios from "axios";
import Profile2FA from "../profiles/profileMfa";
import { toast } from "react-toastify";
import ForgotPassword from "./forgotPassword";
import { AuthContext } from "../App";
import { Col } from "react-bootstrap";
import {
  loadingSpinner,
  loadingSpinnerCustomMarginAndColor,
} from "../admin/functions/helperFunctions";

function Login({ setUser }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [forgotPassword, setForgotPassword] = useState(false);
  const [workEmail, setWorkEmail] = useState("");
  const [error, setError] = useState(false);
  const [errorProfile, setErrorProfile] = useState(false);
  const [success, setSuccess] = useState(false);
  const [mfa, setMfa] = useState(false);
  const [missingMfa, setMissingMfa] = useState(false);
  const [innerWidth, setInnerWidth] = useState(window.innerWidth);
  const [wrongUsernamePassword, setWrongUsernamePassword] = useState(false);
  const { isAuthenticated, setIsAuthenticated } = useContext(AuthContext);
  const [loadingLogin, setLoadingLogin] = useState(false);
  const navigate = useNavigate();

  const onChange = (e) => {
    const { name, value } = e.target;
    if (name === "username") setUsername(value);
    else if (name === "password") setPassword(value);
    else if (name === "workEmail") setWorkEmail(value);
  };

  const checkIfUsernameIsEmail = (text) => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(text);
  };

  const login = (username, password) => {
    const config = {
      headers: {
        "Content-Type": "application/json",
      },
    };

    // Request Body
    let body = JSON.stringify({ username, password });
    if (checkIfUsernameIsEmail(username)) {
      body = JSON.stringify({ email: username, password });
    }

    axios
      .post("/api/auth/login", body, config)
      .then((res) => {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("token_created", res.data.token_created);
        setUser(res.data.user);
        if (localStorage.getItem("prevPath")) {
          navigate(localStorage.getItem("prevPath").toString(""));
        } else {
          navigate("/");
        }
        setLoadingLogin(false);
        setIsAuthenticated(true);
        toast.success("Login successful!");
      })
      .catch((err) => {
        if (err?.response?.status === 401) {
          toast.error("Not authorized");
        } else {
          toast.error("Could not login, check server status");
        }
        setLoadingLogin(false);
      });
    setLoadingLogin(false);
  };

  const submit = (e) => {
    e.preventDefault();
    setWrongUsernamePassword(false);
    setLoadingLogin(true);
    let body = JSON.stringify({
      username,
      password,
    });
    if (checkIfUsernameIsEmail(username)) {
      body = JSON.stringify({
        email: username,
        password,
      });
    }
    const config = {
      headers: {
        "Content-Type": "application/json",
      },
    };
    axios
      .put("/api/auth/login2fa", body, config)
      .then((res) => {
        if (res.status === 202) {
          // User does not have 2fa, and its not enforce, log them in
          login(username, password);
        }
        if (res.status === 201) {
          // User missing 2FA, need to set it up as it is enforced
          setMissingMfa(true);
          setLoadingLogin(false);
        }
        if (res.status === 200) {
          // User has 2FA, render 2FA card to continue login dialog
          setMfa(true);
          setLoadingLogin(false);
        }
      })
      .catch((err) => {
        if (
          err.response.status === 400 ||
          err.response.status === 401 ||
          err.response.status === 403
        ) {
          setWrongUsernamePassword(true);
        } else {
          if (err) {
            toast.error(err?.response?.data?.detail);
          }
        }
        setLoadingLogin(false);
      });
  };

  const forgotPasswordHandler = () => {
    if (workEmail === "" || workEmail.length < 1) {
      setError(true);
      setSuccess(false);
      return;
    }
    const data = {
      workEmail,
    };
    sendResetPassMail(data)
      .then((res) => {
        if (res.status === 200) {
          setSuccess(true);
          setError(false);
          setErrorProfile(false);
        }
      })
      .catch((err) => {
        toast.error(err.response.status);
        if (err.response.status) {
          setErrorProfile(true);
          setSuccess(false);
        }
        setLoadingLogin(false);
      });
  };

  useEffect(() => {
    const resize = () => setInnerWidth(window.innerWidth);
    const handleKeyDown = (e) => {
      if (e.key === "Enter" && !forgotPassword && !mfa && !missingMfa) {
        submit(e);
      }
    };

    window.addEventListener("resize", resize);
    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [forgotPassword, mfa, missingMfa, submit]);

  if (missingMfa) {
    return (
      <Profile2FA
        generateQr={true}
        profile={{ mfa_validated: false }}
        mfaMissing={true}
        username={username}
        password={password}
        setUser={setUser}
      />
    );
  }
  if (mfa) {
    return (
      <Profile2FA
        login={true}
        username={username}
        password={password}
        setUser={setUser}
      />
    );
  }

  if (forgotPassword) {
    return (
      <ForgotPassword
        innerWidth={innerWidth}
        workEmail={workEmail}
        onChange={onChange}
        success={success}
        error={error}
        errorProfile={errorProfile}
        forgotPasswordHandler={forgotPasswordHandler}
        setForgotPassword={setForgotPassword}
        setWorkEmail={setWorkEmail}
      />
    );
  }

  return (
    <div className="m-1">
      {innerWidth > 650 ? (
        <div className="row justify-content-center">
          <Col />
          <div className="col-5">
            <div className="card card-body mt-5">
              <h2 className="text-center">Login</h2>
              <div className="form-group">
                <label>Username or Email</label>
                <input
                  type="text"
                  className="form-control"
                  name="username"
                  onChange={onChange}
                  value={username}
                />
              </div>

              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  className="form-control"
                  name="password"
                  onChange={onChange}
                  value={password}
                />
              </div>

              {wrongUsernamePassword && (
                <div className="form-group">
                  <small className="form-text dokuly-danger">
                    Wrong username, email or password!
                  </small>
                </div>
              )}

              <div className="form-group">
                <button
                  type="button"
                  className="btn dokuly-bg-primary"
                  style={{ color: "white" }}
                  onClick={(e) => {
                    submit(e);
                  }}
                >
                  {loadingLogin
                    ? loadingSpinnerCustomMarginAndColor(0, 0, 0, 0, "white")
                    : "Login"}
                </button>
                <a
                  className="customLink"
                  style={{ marginLeft: "2rem" }}
                  // biome-ignore lint/a11y/useValidAnchor: Want onclick with a style here.
                  onClick={() => {
                    setForgotPassword(true);
                  }}
                >
                  Forgot Password?
                </a>
              </div>
            </div>{" "}
          </div>{" "}
          <Col />
        </div>
      ) : (
        <div className="card card-body mt-5">
          <h2 className="text-center">Login</h2>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              className="form-control"
              name="username"
              onChange={onChange}
              value={username}
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              className="form-control"
              name="password"
              onChange={onChange}
              value={password}
            />
          </div>
          {wrongUsernamePassword && (
            <div className="form-group">
              <small className="form-text dokuly-danger">
                Wrong username or password!
              </small>
            </div>
          )}
          <div className="form-group">
            <button
              type="button"
              className="btn dokuly-bg-primary"
              style={{ color: "white" }}
              onClick={(e) => {
                submit(e);
              }}
            >
              Login
            </button>
            <a
              className="customLink"
              style={{ marginLeft: "2rem" }}
              // biome-ignore lint/a11y/useValidAnchor: Want onclick with a style here.
              onClick={() => {
                setForgotPassword(true);
              }}
            >
              Forgot Password?
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;
