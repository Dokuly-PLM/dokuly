import React from "react";
import { getIncotermDescription } from "../forms/editPurchaseOrderForm";
import QuestionToolTip from "../../dokuly_components/questionToolTip";

const ShippingTermsSelect = ({ incoterm, setIncoterm }) => {
  return (
    <div className="form-group">
      <label>
        Incoterms{" "}
        <QuestionToolTip
          optionalHelpText={getIncotermDescription(incoterm)}
          placement="right"
        />
      </label>
      <select
        name="incoterm"
        value={incoterm}
        className="form-control"
        onChange={(e) => setIncoterm(e.target.value)}
      >
        <option value="">Select Incoterm</option>
        <option
          data-toggle="tooltip"
          data-placement="top"
          title={getIncotermDescription("EXW")}
          value="EXW"
        >
          EXW (Ex Works)
        </option>
        <option
          data-toggle="tooltip"
          data-placement="top"
          title={getIncotermDescription("FCA")}
          value="FCA"
        >
          FCA (Free Carrier)
        </option>
        <option
          data-toggle="tooltip"
          data-placement="top"
          title={getIncotermDescription("CPT")}
          value="CPT"
        >
          CPT (Carriage Paid To)
        </option>
        <option
          data-toggle="tooltip"
          data-placement="top"
          title={getIncotermDescription("CIP")}
          value="CIP"
        >
          CIP (Carriage and Insurance Paid To)
        </option>
        <option
          data-toggle="tooltip"
          data-placement="top"
          title={getIncotermDescription("DAP")}
          value="DAP"
        >
          DAP (Delivered at Place)
        </option>
        <option
          data-toggle="tooltip"
          data-placement="top"
          title={getIncotermDescription("DPU")}
          value="DPU"
        >
          DPU (Delivered at Place Unloaded)
        </option>
        <option
          data-toggle="tooltip"
          data-placement="top"
          title={getIncotermDescription("DDP")}
          value="DDP"
        >
          DDP (Delivered Duty Paid)
        </option>
        <option
          data-toggle="tooltip"
          data-placement="top"
          title={getIncotermDescription("FAS")}
          value="FAS"
        >
          FAS (Free Alongside Ship)
        </option>
        <option
          data-toggle="tooltip"
          data-placement="top"
          title={getIncotermDescription("FOB")}
          value="FOB"
        >
          FOB (Free on Board)
        </option>
        <option
          data-toggle="tooltip"
          data-placement="top"
          title={getIncotermDescription("CFR")}
          value="CFR"
        >
          CFR (Cost and Freight)
        </option>
        <option
          data-toggle="tooltip"
          data-placement="top"
          title={getIncotermDescription("CIF")}
          value="CIF"
        >
          CIF (Cost, Insurance, and Freight)
        </option>
      </select>
    </div>
  );
};

export default ShippingTermsSelect;
