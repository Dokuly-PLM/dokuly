import React, { useEffect, useState } from "react";

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
          <label
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "#6B7280",
            }}
          >
            Work email
          </label>
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
            <span style={{ color: "#07a20f" }}>
              Email sent! Remember to check spam mail.
            </span>
          </div>
        )}
        {error && (
          <div className="form-group">
            <small className="form-text dokuly-danger">Enter an email!</small>
          </div>
        )}
        {errorProfile && (
          <div className="form-group">
            <small className="form-text dokuly-danger">User not found!</small>
          </div>
        )}
        <div className="form-group" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
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
            className="btn btn-bg-transparent"
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
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        padding: "1rem",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "400px",
        }}
      >
        <div
          className="card"
          style={{
            padding: "2rem",
            border: "1px solid #E5E5E5",
            borderRadius: "4px",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
            <img
              src="../../static/logo.svg"
              alt="Dokuly"
              width="140"
              style={{ marginBottom: "1rem" }}
            />
            <h2
              style={{
                fontSize: "1.25rem",
                fontWeight: 700,
                color: "#111827",
                margin: 0,
              }}
            >
              Reset your password
            </h2>
          </div>
          {forgotPasswordForm()}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
