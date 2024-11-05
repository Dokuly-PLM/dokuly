import React, { useState, useEffect } from "react";
import ReleaseStates from "../adminComponents/general/releaseStates";

const AdminReleaseManagement = ({ setRefresh }) => {
  return <ReleaseStates setRefresh={setRefresh} />;
};

export default AdminReleaseManagement;
