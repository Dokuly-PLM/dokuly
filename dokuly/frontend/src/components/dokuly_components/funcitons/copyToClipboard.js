import { toast } from "react-toastify";

/**
 * Copy text to clipboard with fallback for non-secure contexts (HTTP).
 * Works on localhost, HTTPS, and HTTP over LAN.
 *
 * @param {string} text - The text to copy
 * @param {boolean} [showToast=true] - Whether to show a toast notification
 * @returns {boolean} - Whether the copy succeeded
 */
export function copyToClipboard(text, showToast = true) {
  // Try the modern Clipboard API first (requires secure context)
  if (navigator?.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(
      () => {
        if (showToast) toast.info("Copied to clipboard");
      },
      () => {
        // Clipboard API rejected, try fallback
        fallbackCopy(text, showToast);
      }
    );
    return true;
  }

  // Fallback for non-secure contexts (HTTP over LAN, etc.)
  return fallbackCopy(text, showToast);
}

/**
 * Fallback copy using a temporary textarea + execCommand.
 */
function fallbackCopy(text, showToast) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  // Prevent scrolling to bottom
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "-9999px";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  let success = false;
  try {
    success = document.execCommand("copy");
    if (success && showToast) {
      toast.info("Copied to clipboard");
    } else if (!success && showToast) {
      toast.error("Failed to copy to clipboard");
    }
  } catch (err) {
    if (showToast) {
      toast.error("Failed to copy to clipboard");
    }
  }

  document.body.removeChild(textarea);
  return success;
}

export default copyToClipboard;
