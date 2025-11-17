import QuestionToolTip from "../../dokuly_components/questionToolTip";
import { toast } from "react-toastify";

const ExternalPartNumberFormGroup = ({
  externalPartNumber,
  setExternalPartNumber,
  tooltipText,
}) => {
  const defaultToolTip = tooltipText
    ? tooltipText
    : "(Optional) Use this field to enter any external part number, for example from your ERP.";

  return (
    <div className="form-group">
      <label className="mr-2">External part number</label>
      <QuestionToolTip optionalHelpText={defaultToolTip} placement="right" />
      <input
        className="form-control"
        type="text"
        name="external_part_number"
        onChange={(e) => {
          if (e.target.value.length > 1000) {
            toast.error("Max length 1000");
            return;
          }
          setExternalPartNumber(e.target.value);
        }}
        value={externalPartNumber}
      />
    </div>
  );
};

export default ExternalPartNumberFormGroup;
