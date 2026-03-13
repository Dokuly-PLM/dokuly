import React, { useState, useRef, useEffect } from "react";

/**
 * Wraps a thumbnail image and shows a larger preview on hover.
 * The preview is positioned via a portal-like fixed overlay so it
 * is never clipped by parent overflow:hidden.
 */
const ThumbnailHoverZoom = ({ children }) => {
  const [hovered, setHovered] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const ref = useRef(null);

  useEffect(() => {
    if (!hovered || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    // Position the preview to the right of the thumbnail, vertically centered
    setPos({
      top: rect.top + rect.height / 2,
      left: rect.right + 12,
    });
  }, [hovered]);

  // Find the image src from the children tree
  const findImageSrc = (element) => {
    if (!element) return null;
    if (element.type === "img" || element.type?.displayName === "DokulyImage") {
      return element.props?.src;
    }
    // Check DokulyImage by component name
    if (typeof element.type === "function" || typeof element.type === "object") {
      if (element.props?.src) return element.props.src;
    }
    if (element.props?.children) {
      const kids = Array.isArray(element.props.children)
        ? element.props.children
        : [element.props.children];
      for (const child of kids) {
        if (child && typeof child === "object") {
          const found = findImageSrc(child);
          if (found) return found;
        }
      }
    }
    return null;
  };

  // We can't easily get the blob URL from DokulyImage children via React tree.
  // Instead, on hover we grab the rendered <img> element from the DOM.
  const getRenderedImgSrc = () => {
    if (!ref.current) return null;
    const img = ref.current.querySelector("img");
    return img?.src || null;
  };

  const imgSrc = hovered ? getRenderedImgSrc() : null;

  return (
    <div
      ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ position: "relative", display: "inline-block" }}
    >
      {children}
      {hovered && imgSrc && (
        <div
          style={{
            position: "fixed",
            top: `${pos.top}px`,
            left: `${pos.left}px`,
            transform: "translateY(-50%)",
            zIndex: 9999,
            pointerEvents: "none",
            background: "#fff",
            borderRadius: "8px",
            boxShadow: "0 4px 24px rgba(0,0,0,0.25)",
            padding: "6px",
          }}
        >
          <img
            src={imgSrc}
            alt="Preview"
            style={{
              maxWidth: "280px",
              maxHeight: "280px",
              objectFit: "contain",
              display: "block",
            }}
          />
        </div>
      )}
    </div>
  );
};

export default ThumbnailHoverZoom;
