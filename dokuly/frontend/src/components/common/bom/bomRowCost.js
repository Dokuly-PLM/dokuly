import React from "react";
import { Badge } from "react-bootstrap";

const BomRowCost = ({ quantity, unitPrice }) => {
  const totalCost = quantity * unitPrice;

  return (
    <Badge pill variant="info">
      ${totalCost.toFixed(2)}
    </Badge>
  );
};

export default BomRowCost;
