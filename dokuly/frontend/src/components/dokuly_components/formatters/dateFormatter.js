import React from "react";
import PropTypes from "prop-types";
import moment from "moment";

const DokulyDateFormat = ({ date, showTime = false }) => {
  const formatDate = (dateInput) => {
    // First, create a moment object from the input
    const momentDate = moment(dateInput);

    // Check if the momentDate is valid
    if (momentDate.isValid()) {
      // Format and return the date with or without time based on showTime
      return showTime
        ? momentDate.format("YYYY-MM-DD, HH:mm:ss")
        : momentDate.format("YYYY-MM-DD");
    }

    // Return some placeholder or indication for invalid dates
    return "Invalid date";
  };

  return <span>{formatDate(date)}</span>;
};

DokulyDateFormat.propTypes = {
  date: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)])
    .isRequired,
  showTime: PropTypes.bool,
};

export default DokulyDateFormat;
