import React from "react";
import { InfoRow } from "../requirements/components/requirementsInfoCard";
import { ProgressBar } from "react-bootstrap";
import { getColor } from "../production/lots/lotInfoCard";

const ProgressionBar = ({
  currentProgressCount = 0,
  totalCount = 1,
  rowStyle = {},
  rowClassname = "",
  firstColClassname = "",
  secondColClassname = "",
  label = "Progress:",
  tooltipText = "- Shows the progression of the task.",
  tooltipTitle = "Progress",
}) => {
  const progress = (currentProgressCount / totalCount) * 100;
  const progressFormatted = `${progress.toFixed(1)}%`;
  return (
    <InfoRow
      style={rowStyle}
      label={label}
      toolTip={tooltipText}
      toolTipTitle={tooltipTitle}
      firstColClassname={firstColClassname}
      secondColClassname={secondColClassname}
      rowClassname={rowClassname}
      value={
        <div style={{ display: "flex", alignItems: "center" }}>
          <span className="mr-2">
            {currentProgressCount} / {totalCount}
          </span>
          <ProgressBar
            now={progress}
            variant={getColor(progress)}
            label=""
            style={{ width: "25%", marginRight: "10px" }}
          />
          <span>{progressFormatted}</span>
        </div>
      }
    />
  );
};

export default ProgressionBar;
