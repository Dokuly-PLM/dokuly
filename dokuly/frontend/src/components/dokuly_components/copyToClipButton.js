import React from "react";
import { toast } from "react-toastify";

const CopyToClipButton = ({ text, className, style }) => {
  const copyToClipboard = (text) => {
    // Try modern clipboard API first (works in secure contexts)
    if (navigator?.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => {
        toast.info("Copied to clipboard");
      }).catch(() => {
        // Fallback if clipboard API fails
        fallbackCopyTextToClipboard(text);
      });
    } else {
      // Fallback for insecure contexts (HTTP)
      fallbackCopyTextToClipboard(text);
    }
  };

  const fallbackCopyTextToClipboard = (text) => {
    try {
      // Create a temporary textarea element
      const textArea = document.createElement("textarea");
      textArea.value = text;
      
      // Avoid scrolling to bottom
      textArea.style.top = "0";
      textArea.style.left = "0";
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      // Execute the copy command
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        toast.info("Copied to clipboard");
      } else {
        toast.error("Failed to copy to clipboard");
      }
    } catch (err) {
      toast.error("Copy to clipboard not supported");
    }
  };

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
