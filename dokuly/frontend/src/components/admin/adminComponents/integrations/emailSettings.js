import React from "react";
import DokulyCard from "../../../dokuly_components/dokulyCard";
import SubmitButton from "../../../dokuly_components/submitButton";

const EmailSettings = ({
  loading,
  emailHost,
  setEmailHost,
  emailPort,
  setEmailPort,
  emailHostUser,
  setEmailHostUser,
  emailHostPassword,
  setEmailHostPassword,
  emailSender,
  setEmailSender,
  emailUseTls,
  setEmailUseTls,
  emailUseSsl,
  setEmailUseSsl,
  hasEmailCredentials,
  handleTestConnection,
  testingConnection,
  testResult,
  handleSubmit,
}) => {
  return (
    <DokulyCard title="Email (SMTP) Configuration">
      <div className="p-3">
        <span className="dokuly-section-label">Integration Status</span>
        <p className="text-muted" style={{ fontSize: "0.875rem" }}>
          Configure the SMTP server used to send invitation and password-reset
          emails. Settings saved here take priority over the environment
          variables in <code>.env</code>; env variables act as a fallback when
          no database settings are configured.
        </p>

        {loading ? (
          <div className="text-center py-4">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <>
            {hasEmailCredentials ? (
              <div className="alert alert-success mb-3" style={{ fontSize: "0.875rem" }}>
                ✓ SMTP host is configured
              </div>
            ) : (
              <div className="alert alert-info mb-3" style={{ fontSize: "0.875rem" }}>
                No SMTP host stored in the database. Emails will use the
                environment variable fallback (if configured).
              </div>
            )}

            <hr className="dokuly-divider" />

            <div className="row">
              <div className="col-md-8">
                <div className="form-group mb-3">
                  <label className="dokuly-section-label">SMTP Host *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={emailHost}
                    onChange={(e) => setEmailHost(e.target.value)}
                    placeholder="e.g. smtp.gmail.com"
                  />
                </div>
              </div>
              <div className="col-md-4">
                <div className="form-group mb-3">
                  <label className="dokuly-section-label">Port</label>
                  <input
                    type="number"
                    className="form-control"
                    value={emailPort}
                    onChange={(e) => setEmailPort(e.target.value)}
                    placeholder="587"
                  />
                </div>
              </div>
            </div>

            <div className="form-group mb-3">
              <label className="dokuly-section-label">
                SMTP Username{" "}
                <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, color: "#9CA3AF" }}>
                  (optional)
                </span>
              </label>
              <input
                type="text"
                className="form-control"
                value={emailHostUser}
                onChange={(e) => setEmailHostUser(e.target.value)}
                placeholder="your-email@example.com"
              />
              <small className="text-muted d-block mt-1">
                The login credential for your SMTP server — typically the email address
                of the sending account. Leave blank if your server does not require
                authentication (e.g. an internal relay or open test server like{" "}
                <code>smtp.freesmtpservers.com</code>).
              </small>
            </div>

            <div className="form-group mb-3">
              <label className="dokuly-section-label">
                Password{" "}
                <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, color: "#9CA3AF" }}>
                  (optional)
                </span>
              </label>
              <input
                type="password"
                className="form-control"
                value={emailHostPassword}
                onChange={(e) => setEmailHostPassword(e.target.value)}
                placeholder={emailHostPassword === "***" ? "••••••••" : "Enter SMTP password"}
              />
              {emailHostPassword === "***" && (
                <small className="dokuly-success d-block mt-1">✓ Password is saved</small>
              )}
              <small className="text-muted d-block mt-1">
                Leave blank if your SMTP server does not require a password.
              </small>
            </div>

            <div className="form-group mb-3">
              <label className="dokuly-section-label">From Address (Sender)</label>
              <input
                type="text"
                className="form-control"
                value={emailSender}
                onChange={(e) => setEmailSender(e.target.value)}
                placeholder="noreply@yourcompany.com"
              />
              <small className="text-muted d-block mt-1">
                The address shown in the From header. Defaults to the username if left blank.
              </small>
            </div>

            <hr className="dokuly-divider" />

            <span className="dokuly-section-label">Encryption</span>
            <div className="row mt-2 mb-3">
              <div className="col-md-6">
                <div className="d-flex align-items-center gap-2">
                  <input
                    type="checkbox"
                    className="dokuly-checkbox"
                    id="emailUseTls"
                    checked={emailUseTls}
                    onChange={(e) => {
                      setEmailUseTls(e.target.checked);
                      if (e.target.checked) setEmailUseSsl(false);
                    }}
                    style={{ width: "1rem", height: "1rem", cursor: "pointer" }}
                  />
                  <label htmlFor="emailUseTls" style={{ marginBottom: 0, cursor: "pointer", fontSize: "0.875rem" }}>
                    Use STARTTLS <span className="text-muted">(recommended, port 587)</span>
                  </label>
                </div>
              </div>
              <div className="col-md-6">
                <div className="d-flex align-items-center gap-2">
                  <input
                    type="checkbox"
                    className="dokuly-checkbox"
                    id="emailUseSsl"
                    checked={emailUseSsl}
                    onChange={(e) => {
                      setEmailUseSsl(e.target.checked);
                      if (e.target.checked) setEmailUseTls(false);
                    }}
                    style={{ width: "1rem", height: "1rem", cursor: "pointer" }}
                  />
                  <label htmlFor="emailUseSsl" style={{ marginBottom: 0, cursor: "pointer", fontSize: "0.875rem" }}>
                    Use implicit SSL <span className="text-muted">(port 465)</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Inline test result feedback */}
            {testResult && (
              <div
                className={`alert ${testResult.success ? "alert-success" : "alert-danger"} mt-3`}
                style={{ fontSize: "0.875rem" }}
              >
                {testResult.success ? (
                  <><strong>✓ Success:</strong> {testResult.message}</>
                ) : (
                  <><strong>✗ Failed:</strong> {testResult.message}</>
                )}
              </div>
            )}

            <hr className="dokuly-divider" />

            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                className="btn btn-sm dokuly-btn-primary"
                onClick={handleTestConnection}
                disabled={loading || testingConnection || !emailHost}
              >
                {testingConnection ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    />
                    Sending...
                  </>
                ) : (
                  "Send Test Email"
                )}
              </button>
              <SubmitButton
                onClick={handleSubmit}
                disabled={loading}
                disabledTooltip="Loading..."
                className="btn-sm"
              >
                Save Settings
              </SubmitButton>
            </div>
            <small className="text-muted d-block mt-2">
              The test email will be sent to your account's work email address.
            </small>
          </>
        )}
      </div>
    </DokulyCard>
  );
};

export default EmailSettings;
