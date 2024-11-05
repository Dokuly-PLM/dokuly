import React, { useEffect, useState } from "react";
import { Col, Container } from "react-bootstrap";

const ForgotPassword = ({
  innerWidth,
  workEmail,
  onChange,
  success,
  error,
  errorProfile,
  forgotPasswordHandler,
  setForgotPassword,
  setWorkEmail,
}) => {
  const forgotPasswordForm = () => {
    return (
      <React.Fragment>
        <div className="form-group">
          <label>Enter your work email</label>
          <input
            value={workEmail}
            type="text"
            className="form-control"
            name="workEmail"
            onChange={onChange}
          />
        </div>
        {success && (
          <div className="form-group">
            <span style={{ color: "green" }}>
              Email Sent! Remember to check spam mail.
            </span>
          </div>
        )}
        {error && (
          <div className="form-group">
            <span style={{ color: "red" }}>Enter a email!</span>
          </div>
        )}
        {errorProfile && (
          <div className="form-group">
            <span style={{ color: "red" }}>User not found!</span>
          </div>
        )}
        <div className="form-group">
          <button
            type="button"
            className="btn dokuly-bg-primary"
            style={{ color: "white" }}
            onClick={() => {
              forgotPasswordHandler();
            }}
          >
            Submit
          </button>
          <button
            type="button"
            className="btn dokuly-bg-danger ml-2"
            onClick={() => {
              setForgotPassword(false);
              setWorkEmail("");
            }}
          >
            Cancel
          </button>
        </div>
      </React.Fragment>
    );
  };
  return (
    <div className="m-1">
      {innerWidth > 650 ? (
        <Container>
          <div className="row justify-content-center">
            <div className="col-5">
              <div className="card card-body mt-5">
                <h2 className="text-center mb-2">Reset Password</h2>
                {forgotPasswordForm()}
              </div>
            </div>
          </div>
        </Container>
      ) : (
        <div className="card card-body mt-5">
          <h2 className="text-center mb-2">Reset Password</h2>
          {forgotPasswordForm()}
        </div>
      )}
    </div>
  );
};

export default ForgotPassword;
