import React from "react";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import ReactMarkdown from "react-markdown";

const QuestionToolTip = ({
  optionalHelpText,
  titleText = "",
  iconPath = "../../static/icons/question-circle.svg",
  placement = "right",
  showTitle = false, // Add a flag to conditionally render title text
  boldTitle = true, // Add a flag to conditionally render title text in bold
  renderIcon = true, // Add a flag to conditionally render icon
}) => {
  if (!renderIcon) {
    // Prepare the content for the tooltip
    const tooltipContent = (
      <Tooltip>
        <ReactMarkdown className="tooltip-content">
          {optionalHelpText && optionalHelpText !== ""
            ? optionalHelpText
            : titleText}
        </ReactMarkdown>
      </Tooltip>
    );

    // Prepare the trigger element, ensuring it's a single element
    const triggerElement = showTitle ? (
      <span>{boldTitle ? <b>{titleText}</b> : titleText}</span>
    ) : null;

    // Return the overlay trigger with the tooltip
    return (
      <OverlayTrigger
        placement={placement}
        delay={{ show: 500, hide: 400 }}
        overlay={tooltipContent}
      >
        {triggerElement}
      </OverlayTrigger>
    );
  }

  return optionalHelpText ? (
    <>
      {showTitle && boldTitle && <b>{titleText}</b>}
      {showTitle && !boldTitle && titleText}
      <OverlayTrigger
        placement={placement}
        delay={{ show: 500, hide: 400 }}
        overlay={
          <Tooltip>
            <ReactMarkdown className="tooltip-content">
              {optionalHelpText}
            </ReactMarkdown>
          </Tooltip>
        }
      >
        <img
          className="question-icon"
          width="15px"
          style={{ cursor: "pointer" }}
          src={iconPath}
          alt="help icon"
        />
      </OverlayTrigger>
    </>
  ) : null;
};

export default QuestionToolTip;
