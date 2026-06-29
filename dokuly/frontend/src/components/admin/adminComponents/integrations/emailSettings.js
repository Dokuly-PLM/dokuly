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
  handleSubmit,
}) => {
  return (
    <DokulyCard title="Email (SMTP) Configuration">
      <div className="p-3">
        <h5>Integration Status</h5>
        <p className="text-muted">
          Configure the SMTP server used to send invitation and password-reset
          emails. Settings saved here take priority over the environment
          variables in <code>.env</code>; env variables act as a fallback when
          no database settings are configured.
        </p>

        {loading ? (
          <div className="text-center py-4">
            <div className="spinner-border" role="status">
              <span className="sr-only">Loading...</span>
            </div>
          </div>
        ) : (
          <>
            {hasEmailCredentials && (
              <div className="alert alert-success mb-3">
                ✓ SMTP credentials are configured
              </div>
            )}
            {!hasEmailCredentials && (
              <div className="alert alert-info mb-3">
                No SMTP credentials stored in the database. Emails will use the
                environment variable fallback (if configured).
              </div>
            )}

            <div className="row">
              <div className="col-md-8">
                <div className="form-group mb-3">
                  <label>SMTP Host</label>
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
                  <label>Port</label>
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
              <label>Username</label>
              <input
                type="text"
                className="form-control"
                value={emailHostUser}
                onChange={(e) => setEmailHostUser(e.target.value)}
                placeholder="your-email@example.com"
              />
            </div>

            <div className="form-group mb-3">
              <label>Password / App Password *</label>
              <input
                type="password"
                className="form-control"
                value={emailHostPassword}
                onChange={(e) => setEmailHostPassword(e.target.value)}
                placeholder={hasEmailCredentials ? "••••••••" : "Enter SMTP password"}
              />
              {hasEmailCredentials && (
                <small className="text-success">✓ Password configured</small>
              )}
            </div>

            <div className="form-group mb-3">
              <label>From Address (Sender)</label>
              <input
                type="text"
                className="form-control"
                value={emailSender}
                onChange={(e) => setEmailSender(e.target.value)}
                placeholder="noreply@yourcompany.com"
              />
              <small className="text-muted">
                The address shown in the From header. Defaults to the username
                if left blank.
              </small>
            </div>

            <div className="row mb-3">
              <div className="col-md-6">
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="emailUseTls"
                    checked={emailUseTls}
                    onChange={(e) => {
                      setEmailUseTls(e.target.checked);
                      if (e.target.checked) setEmailUseSsl(false);
                    }}
                  />
                  <label className="form-check-label" htmlFor="emailUseTls">
                    Use STARTTLS (recommended, port 587)
                  </label>
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="emailUseSsl"
                    checked={emailUseSsl}
                    onChange={(e) => {
                      setEmailUseSsl(e.target.checked);
                      if (e.target.checked) setEmailUseTls(false);
                    }}
                  />
                  <label className="form-check-label" htmlFor="emailUseSsl">
                    Use implicit SSL (port 465)
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <div className="d-flex align-items-center gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-success mr-2"
                  onClick={handleTestConnection}
                  disabled={loading || testingConnection || !emailHost || !emailHostUser}
                >
                  {testingConnection ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      />
                      Sending test email...
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
              <small className="text-muted mt-2 d-block">
                The test email will be sent to your account's work email address.
              </small>
            </div>
          </>
        )}
      </div>
    </DokulyCard>
  );
};

export default EmailSettings;
