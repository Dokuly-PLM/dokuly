import React, { useEffect, useState } from "react";
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
}) => {
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (src) {
      getFile(src)
        .then((blob) => {
          const url = window.URL.createObjectURL(blob);
          setImageUrl(url);

          // Clean up the created object URL to avoid memory leaks
          return () => window.URL.revokeObjectURL(url);
        })
        .catch((error) => {
          setImageUrl(defaultSrc || src); // Use defaultSrc if available
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [src, defaultSrc]);

  if (!src) {
    return <div />;
  }

  if (loading) {
    return "";
  }
  const defaultStyle = {
    maxWidth: "100%",
    height: "auto",
    ...style, // Allows override of default styles
  };

  return (
    <img
      className={className}
      src={imageUrl}
      alt={alt}
      height={height ?? "auto"}
      width={width ?? "auto"}
      style={defaultStyle}
      onClick={onClick}
      onError={(e) => {
        e.target.onerror = null;
        setImageUrl(defaultSrc || src); // Set imageUrl to defaultSrc on error
        if (onError) onError(e);
      }}
      onLoad={onLoad} // Ensure onLoad is forwarded
    />
  );
};

export default DokulyImage;
