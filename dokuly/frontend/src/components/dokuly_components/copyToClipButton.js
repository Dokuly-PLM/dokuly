import React from "react";
import { copyToClipboard } from "./funcitons/copyToClipboard";

const CopyToClipButton = ({ text, className, style }) => {
  return (
    <button
      className={className}
      style={style}
      type="button"
      onClick={() => copyToClipboard(text)}
    >
      <div className="row">
        <img
          className="icon-dark"
          src="../../static/icons/copy.svg"
          alt="icon"
        />
      </div>
    </button>
  );
};

export default CopyToClipButton;
