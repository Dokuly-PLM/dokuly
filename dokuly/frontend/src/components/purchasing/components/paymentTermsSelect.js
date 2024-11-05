import React from "react";
import { getPaymentTermsDescription } from "../forms/editPurchaseOrderForm";
import QuestionToolTip from "../../dokuly_components/questionToolTip";

const PaymentTermsSelect = ({ paymentTerms, setPaymentTerms }) => {
  return (
    <div className="form-group">
      <label>
        Payment Terms{" "}
        <QuestionToolTip
          optionalHelpText={getPaymentTermsDescription(paymentTerms)}
          placement="right"
        />
      </label>

      <select
        name="paymentTerms"
        value={paymentTerms}
        className="form-control"
        onChange={(e) => setPaymentTerms(e.target.value)}
      >
        <option value="">Select Payment Terms</option>
        <option
          data-toggle="tooltip"
          data-placement="top"
          title={getPaymentTermsDescription("Net 7")}
          value="Net 7"
        >
          Net 7 days
        </option>
        <option
          data-toggle="tooltip"
          data-placement="top"
          title={getPaymentTermsDescription("Net 10")}
          value="Net 10"
        >
          Net 10 days
        </option>
        <option
          data-toggle="tooltip"
          data-placement="top"
          title={getPaymentTermsDescription("Net 30")}
          value="Net 30"
        >
          Net 30 days
        </option>
        <option
          data-toggle="tooltip"
          data-placement="top"
          title={getPaymentTermsDescription("Net 60")}
          value="Net 60"
        >
          Net 60 days
        </option>
        <option
          data-toggle="tooltip"
          data-placement="top"
          title={getPaymentTermsDescription("Net 90")}
          value="Net 90"
        >
          Net 90 days
        </option>
        <option
          data-toggle="tooltip"
          data-placement="top"
          title={getPaymentTermsDescription("CBS")}
          value="CBS"
        >
          CBS (Cash before shipment)
        </option>
        <option
          data-toggle="tooltip"
          data-placement="top"
          title={getPaymentTermsDescription("PIA")}
          value="PIA"
        >
          PIA (Payment in advance)
        </option>
        <option
          data-toggle="tooltip"
          data-placement="top"
          title={getPaymentTermsDescription("EOM")}
          value="EOM"
        >
          EOM (End of month)
        </option>
      </select>
    </div>
  );
};

export default PaymentTermsSelect;
