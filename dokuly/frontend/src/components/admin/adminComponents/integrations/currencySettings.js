import React from "react";
import DokulyCard from "../../../dokuly_components/dokulyCard";
import SubmitButton from "../../../dokuly_components/submitButton";

const CurrencySettings = ({
  loading,
  currencyApiKey,
  setCurrencyApiKey,
  hasCurrencyCredentials,
  handleTestConnection,
  testingConnection,
  handleSubmit,
}) => {
  return (
    <DokulyCard title="Currency API Configuration">
      <div className="p-3">
        <h5>Integration Status</h5>
        <p className="text-muted">
          Configure the ExchangeRate-API integration used for automatic currency
          conversion rates.
        </p>

        {loading ? (
          <div className="text-center py-4">
            <div className="spinner-border" role="status">
              <span className="sr-only">Loading...</span>
            </div>
          </div>
        ) : (
          <>
            <div className="alert alert-info">
              <strong>How to get your API key:</strong>
              <ol className="mb-0 mt-2" style={{ fontSize: "0.9em" }}>
                <li>
                  Go to{" "}
                  <a
                    href="https://www.exchangerate-api.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    exchangerate-api.com
                  </a>
                </li>
                <li>Sign up for a free or paid plan</li>
                <li>Copy the API key from your dashboard</li>
              </ol>
            </div>

            <div className="mt-4">
              <div className="form-group">
                <label>API Key *</label>
                <input
                  type="password"
                  className="form-control"
                  value={currencyApiKey}
                  onChange={(e) => setCurrencyApiKey(e.target.value)}
                  placeholder={
                    hasCurrencyCredentials
                      ? "••••••••"
                      : "Enter ExchangeRate-API key"
                  }
                />
                {hasCurrencyCredentials && (
                  <small className="text-success">
                    ✓ API key configured
                  </small>
                )}
                {!hasCurrencyCredentials && (
                  <small className="text-muted">
                    Without an API key, currency conversion will fall back to the
                    environment variable or default to USD only.
                  </small>
                )}
              </div>
            </div>

            <div className="mt-4">
              <div className="d-flex align-items-center gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-success mr-2"
                  onClick={handleTestConnection}
                  disabled={
                    loading ||
                    testingConnection ||
                    !currencyApiKey
                  }
                >
                  {testingConnection ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      />
                      Testing...
                    </>
                  ) : (
                    "Test Connection"
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
            </div>
          </>
        )}
      </div>
    </DokulyCard>
  );
};

export default CurrencySettings;
