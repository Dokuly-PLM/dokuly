import React from "react";
import QuestionToolTip from "./questionToolTip";

const CardTitle = ({
  titleText,
  optionalHelpText,
  style = { paddingLeft: "15px" },
}) => {
  return (
    <h6 className="dokuly-section-label" style={style}>
      {titleText}{" "}
      {optionalHelpText && (
        <QuestionToolTip
          optionalHelpText={optionalHelpText}
          titleText={titleText}
          iconPath="../../static/icons/question-circle.svg"
          placement="right"
        />
      )}
    </h6>
  );
};

export default CardTitle;
