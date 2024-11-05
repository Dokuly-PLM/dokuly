import React from "react";

export const titleFormatter = (row, titleKey = "title") => {
  const titleStyle = row?.is_complete
    ? { textDecoration: "line-through", opacity: 0.75 }
    : {};

  return <span style={titleStyle}>{row[titleKey]}</span>;
};
