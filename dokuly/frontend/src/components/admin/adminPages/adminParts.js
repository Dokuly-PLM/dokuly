import React, { useState, useEffect } from 'react';
import PartTypes from '../adminComponents/parts/partTypes';

const AdminParts = ({ setRefresh }) => {


  return (
    <PartTypes setRefresh={setRefresh} />
  );
};

export default AdminParts;
