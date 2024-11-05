import React from "react";
import QuestionToolTip from "./questionToolTip";

const CardTitle = ({
  titleText,
  optionalHelpText,
  style = { paddingLeft: "15px" },
}) => {
  return (
    <h5 style={style}>
      <b>{titleText}</b>{" "}
      {optionalHelpText && (
        <QuestionToolTip
          optionalHelpText={optionalHelpText}
          titleText={titleText}
          iconPath="../../static/icons/question-circle.svg"
          placement="right"
        />
      )}
    </h5>
  );
};

export default CardTitle;
