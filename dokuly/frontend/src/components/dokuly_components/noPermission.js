import React from "react";

const NoPermission = ({ errorMessage }) => {
  return (
    <div className="alert alert-danger mt-5" role="alert">
      {errorMessage}
    </div>
  );
};

export default NoPermission;
