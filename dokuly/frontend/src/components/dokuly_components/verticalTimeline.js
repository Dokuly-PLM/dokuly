import React from "react";

const VerticalTimeline = ({ steps }) => {
  return (
    <div className="timeline-container">
      <div className="timeline-line" />
      {steps.map((step, index) => (
        <div key={index} className="timeline-step">
          <div className={`timeline-circle ${step.status}`}>
            {step.status === "passed" && <span className="checkmark">✓</span>}
            {step.status === "failed" && <span className="cross">✕</span>}
            {step.status === "question" && (
              <span className="question-mark">?</span>
            )}
            {step.status === "empty" && <span className="empty-symbol"> </span>}
            {step.status === "exclamation" && (
              <span className="exclamation-mark">!</span>
            )}
          </div>
          <div className="step-content">
            <div className="step-title fw-bold">{step.title}</div>
            {step.description && <div>{step.description}</div>}
          </div>
        </div>
      ))}
    </div>
  );
};

export default VerticalTimeline;
