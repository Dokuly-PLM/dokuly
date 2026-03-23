import React from "react";
import DokulyCard from "../../../dokuly_components/dokulyCard";
import SubmitButton from "../../../dokuly_components/submitButton";

const AiSettings = ({
  loading,
  aiApiKey,
  setAiApiKey,
  aiModel,
  setAiModel,
  hasAiCredentials,
  handleTestConnection,
  testingConnection,
  handleSubmit,
}) => {
  const modelOptions = [
    { value: "claude-sonnet-4-20250514", label: "Claude Sonnet 4" },
    { value: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5" },
  ];

  return (
    <DokulyCard title="AI Configuration">
      <div className="p-3">
        <h5>Integration Status</h5>
        <p className="text-muted">
          Configure the Anthropic API integration for AI-powered features such
          as part naming suggestions.
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
                    href="https://console.anthropic.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    console.anthropic.com
                  </a>
                </li>
                <li>Create an account or sign in</li>
                <li>Navigate to API Keys and create a new key</li>
              </ol>
            </div>

            <div className="mt-4">
              <div className="form-group">
                <label>API Key *</label>
                <input
                  type="password"
                  className="form-control"
                  value={aiApiKey}
                  onChange={(e) => setAiApiKey(e.target.value)}
                  placeholder={
                    hasAiCredentials ? "••••••••" : "Enter Anthropic API key"
                  }
                />
                {hasAiCredentials && (
                  <small className="text-success">API key configured</small>
                )}
              </div>

              <div className="form-group mt-3">
                <label>Model</label>
                <select
                  className="form-control"
                  value={aiModel}
                  onChange={(e) => setAiModel(e.target.value)}
                >
                  {modelOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group mt-3">
                <label>Provider</label>
                <input
                  type="text"
                  className="form-control"
                  value="Anthropic"
                  disabled
                />
              </div>
            </div>

            <div className="mt-4">
              <div className="d-flex align-items-center gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-success mr-2"
                  onClick={handleTestConnection}
                  disabled={loading || testingConnection || !aiApiKey}
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

export default AiSettings;
