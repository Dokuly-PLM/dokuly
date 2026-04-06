import React from "react";
import SubmitButton from "../submitButton";
import RulesStatusIndicator from "../../common/rules/rulesStatusIndicator";

/**
 * Consistent form field wrapper with section-label styled label.
 */
export const FormField = ({ label, required, children, hint }) => (
  <div className="mb-3">
    <label
      className="dokuly-section-label"
      style={{ display: "block", marginBottom: "4px", fontSize: "0.6875rem" }}
    >
      {label}
      {required && <span style={{ color: "#B00020" }}> *</span>}
    </label>
    {children}
    {hint && (
      <small className="form-text" style={{ color: "#9CA3AF", fontSize: "0.75rem" }}>
        {hint}
      </small>
    )}
  </div>
);

/**
 * Section divider with small uppercase label and a hairline.
 */
export const SectionDivider = ({ label }) => (
  <div className="d-flex align-items-center mt-3 mb-2" style={{ gap: "8px" }}>
    <span
      style={{
        fontSize: "0.6875rem",
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        color: "#6B7280",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
    <div style={{ flex: 1, borderBottom: "1px solid #E5E5E5" }} />
  </div>
);

/**
 * Release state selector — three pill buttons for Draft / Review / Released.
 * Shows an "Approved for release" checkbox when in Review state.
 */
export const ReleaseStateSelector = ({
  releaseState,
  setReleaseState,
  isApprovedForRelease,
  setIsApprovedForRelease,
}) => (
  <>
    <SectionDivider label="State" />
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      {["Draft", "Review", "Released"].map((state) => (
        <button
          key={state}
          type="button"
          onClick={() => setReleaseState(state)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 10px",
            borderRadius: "4px",
            border:
              releaseState === state
                ? "1px solid #165216"
                : "1px solid #E5E5E5",
            background: releaseState === state ? "#EEF2EE" : "#fff",
            color: releaseState === state ? "#165216" : "#6B7280",
            fontWeight: releaseState === state ? 600 : 400,
            fontSize: "0.8125rem",
            cursor: "pointer",
            transition: "all 0.1s ease",
          }}
        >
          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: releaseState === state ? "#165216" : "#D1D5DB",
              flexShrink: 0,
            }}
          />
          {state}
        </button>
      ))}
    </div>
    {releaseState === "Review" && (
      <label
        className="d-flex align-items-start mt-3"
        style={{ gap: "6px", fontSize: "0.75rem", color: "#6B7280", cursor: "pointer" }}
      >
        <input
          type="checkbox"
          checked={isApprovedForRelease}
          onChange={() => setIsApprovedForRelease(!isApprovedForRelease)}
          style={{ marginTop: "2px" }}
        />
        Approved for release
      </label>
    )}
  </>
);

/**
 * Right-side panel for edit forms: release state + rules + submit + delete.
 * Use inside a two-column flex layout.
 */
export const EditFormRightPanel = ({
  releaseState,
  setReleaseState,
  isApprovedForRelease,
  setIsApprovedForRelease,
  rulesItemType,
  rulesItemId,
  rulesProjectId,
  onRulesStatusChange,
  setRulesOverride,
  submitDisabled,
  submitDisabledTooltip,
  onSubmit,
  onDelete,
  deleteLabel = "Delete",
}) => (
  <div
    style={{
      width: "200px",
      flexShrink: 0,
      borderLeft: "1px solid #E5E5E5",
      paddingLeft: "24px",
      display: "flex",
      flexDirection: "column",
    }}
  >
    <ReleaseStateSelector
      releaseState={releaseState}
      setReleaseState={setReleaseState}
      isApprovedForRelease={isApprovedForRelease}
      setIsApprovedForRelease={setIsApprovedForRelease}
    />

    {rulesItemType && (
      <RulesStatusIndicator
        itemType={rulesItemType}
        itemId={rulesItemId}
        projectId={rulesProjectId}
        onStatusChange={onRulesStatusChange}
        setOverride={setRulesOverride}
      />
    )}

    <div style={{ marginTop: "auto", paddingTop: "16px" }}>
      <SubmitButton
        type="submit"
        className="w-100"
        disabled={submitDisabled}
        onClick={onSubmit}
        disabledTooltip={submitDisabledTooltip}
      >
        Submit
      </SubmitButton>

      {onDelete && (
        <button
          type="button"
          className="btn btn-bg-transparent w-100 mt-2"
          onClick={onDelete}
          style={{ fontSize: "0.75rem", color: "#9CA3AF" }}
        >
          {deleteLabel}
        </button>
      )}
    </div>
  </div>
);
