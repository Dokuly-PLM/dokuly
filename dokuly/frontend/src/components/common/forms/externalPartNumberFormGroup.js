import QuestionToolTip from "../../dokuly_components/questionToolTip";
import { toast } from "react-toastify";
import { FormField } from "../../dokuly_components/dokulyForm/formComponents";

const ExternalPartNumberFormGroup = ({
  externalPartNumber,
  setExternalPartNumber,
  tooltipText,
}) => {
  const defaultToolTip = tooltipText
    ? tooltipText
    : "(Optional) Use this field to enter any external part number, for example from your ERP.";

  return (
    <FormField
      label={
        <>
          External part number{" "}
          <QuestionToolTip optionalHelpText={defaultToolTip} placement="right" />
        </>
      }
    >
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
    </FormField>
  );
};

export default ExternalPartNumberFormGroup;
