import React from "react";
import { InfoRow } from "../../requirements/components/requirementsInfoCard";
import { ProgressBar } from "react-bootstrap";
import { getColor } from "../lots/lotInfoCard";

const ProductionProgress = ({
  lot,
  currentProducedCount = 0,
  rowStyle = {},
  firstColClassname = "",
  secondColClassname = "",
}) => {
  const quantity = lot?.quantity || 0;
  const totalProducedItems = currentProducedCount || 0;
  const productionProgress =
    quantity > 0 ? (totalProducedItems / quantity) * 100 : 0;
  const productionProgressFormatted = `${productionProgress.toFixed(1)}%`;

  return (
    <InfoRow
      style={rowStyle}
      label="Produced:"
      toolTip={"- Shows the status of the current lot production progression."}
      toolTipTitle={"Production progression"}
      firstColClassname={firstColClassname}
      secondColClassname={secondColClassname}
      value={
        <div style={{ display: "flex", alignItems: "center" }}>
          <span className="mr-2">
            {currentProducedCount} / {lot?.quantity}
          </span>
          <ProgressBar
            now={productionProgress}
            variant={getColor(productionProgress)}
            label=""
            style={{ width: "25%", marginRight: "10px" }}
          />
          <span>{productionProgressFormatted}</span>
        </div>
      }
    />
  );
};

export default ProductionProgress;
