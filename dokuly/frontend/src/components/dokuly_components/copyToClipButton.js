import React from "react";
import { toast } from "react-toastify";

const CopyToClipButton = ({ text, className, style }) => {
  return (
    <button
      className={className}
      style={style}
      type="button"
      onClick={() => {
        if (navigator?.clipboard && window.isSecureContext) {
          navigator.clipboard.writeText(text);
          toast.info("Copied to clipboard");
        } else {
          toast.error("Clipboard not available, connection is not secure.");
        }
      }}
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
