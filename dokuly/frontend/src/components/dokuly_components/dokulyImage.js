import React, { useEffect, useState, useRef } from "react";
import { getFile } from "../common/filesTable/functions/queries";
import { loadingSpinnerCustomMarginAndColor } from "../admin/functions/helperFunctions";

const DokulyImage = ({
  className,
  alt,
  height,
  width,
  style,
  src,
  defaultSrc,
  onClick,
  onError,
  onLoad,
  lazy = true, // Enable lazy loading by default
}) => {
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [isInView, setIsInView] = useState(!lazy); // If not lazy, start loading immediately
  const imgRef = useRef(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || !src || isInView) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        }
      },
      {
        rootMargin: "50px", // Start loading 50px before the image enters viewport
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [lazy, src, isInView]);

  // Load image when in view
  useEffect(() => {
    if (!src || !isInView) return;

    let cancelled = false;
    setLoading(true);

    getFile(src)
      .then((blob) => {
        if (cancelled) return;
        const url = window.URL.createObjectURL(blob);
        setImageUrl(url);
      })
      .catch((error) => {
        if (cancelled) return;
        // Don't fallback to src - it requires auth and won't work directly
        // Use defaultSrc or empty string (which will show placeholder)
        setImageUrl(defaultSrc || "");
        // Optionally call onError callback if provided
        if (onError) {
          onError(error);
        }
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [src, defaultSrc, isInView, onError]);

  // Cleanup object URL on unmount
  useEffect(() => {
    return () => {
      if (imageUrl?.startsWith("blob:")) {
        window.URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imageUrl]);

  if (!src) {
    return <div />;
  }

  // Calculate placeholder dimensions from style prop
  const placeholderStyle = {
    display: "inline-block",
    backgroundColor: "#f0f0f0",
    ...(style?.maxWidth && { width: style.maxWidth }),
    ...(style?.maxHeight && { height: style.maxHeight }),
    ...(style?.width && { width: style.width }),
    ...(style?.height && { height: style.height }),
    minWidth: style?.maxWidth || style?.width || "70px",
    minHeight: style?.maxHeight || style?.height || "70px",
  };

  // Handle keyboard events for clickable images
  const handleKeyDown = (e) => {
    if ((e.key === "Enter" || e.key === " ") && onClick) {
      e.preventDefault();
      onClick(e);
    }
  };

  if (loading) {
    return (
      <div
        ref={imgRef}
        style={placeholderStyle}
        className={className}
        onClick={onClick}
        onKeyDown={onClick ? handleKeyDown : undefined}
        role={onClick ? "button" : "img"}
        aria-label={alt || "Loading image"}
        tabIndex={onClick ? 0 : undefined}
      />
    );
  }

  const defaultStyle = {
    maxWidth: "100%",
    height: "auto",
    ...style, // Allows override of default styles
  };

  const altRule = alt?.trim() ? alt : "Image";

  // Don't render img if imageUrl is empty (error case with no defaultSrc)
  if (!imageUrl) {
    return (
      <div
        ref={imgRef}
        style={placeholderStyle}
        className={className}
        role="img"
        aria-label={alt || "Image placeholder"}
      />
    );
  }

  const imgProps = {
    ref: imgRef,
    className,
    src: imageUrl,
    // Ensure alt is always a non-empty string
    alt: altRule,
    // Only set height/width attributes if they're actual numbers/strings (not "auto")
    ...(height != null && height !== "auto" ? { height } : {}),
    ...(width != null && width !== "auto" ? { width } : {}),
    style: defaultStyle,
    onError: (e) => {
      e.target.onerror = null;
      // Don't fallback to src - it requires auth and won't work directly
      // Use defaultSrc or empty string
      setImageUrl(defaultSrc || "");
      if (onError) onError(e);
    },
    onLoad, // Ensure onLoad is forwarded
  };

  if (onClick) {
    imgProps.onClick = onClick;
    imgProps.onKeyDown = handleKeyDown;
    imgProps.role = "button";
    imgProps.tabIndex = 0;
  }

  // Explicitly set alt to satisfy linter
  return <img {...imgProps} alt={altRule} />;
};

export default DokulyImage;
