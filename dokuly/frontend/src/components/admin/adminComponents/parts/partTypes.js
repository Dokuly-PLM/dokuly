import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";

import { getPartTypes } from "../../../parts/functions/queries";
import PartTypeForm from "./partTypeForm";
import DokulyTable from "../../../dokuly_components/dokulyTable/dokulyTable";
import { usePartTypes } from "../../../parts/partTypes/usePartTypes";
import DokulyImage from "../../../dokuly_components/dokulyImage";
import EditButton from "../../../dokuly_components/editButton";

const PartTypes = ({ setRefresh }) => {
  const partTypes = usePartTypes();

  const [partTypeSelected, setPartTypeSelected] = useState(null);
  const [modalShow, setModalShow] = useState(false);

  const handleNewPartType = (partTypeData) => {
    setPartTypeSelected(null);
    setModalShow(true);
  };

  const handleEditPartType = (partTypeData) => {
    setPartTypeSelected(partTypeData);
    setModalShow(true);
  };

  const columns = [
    { key: "name", header: "Part type" },
    {
      key: "icon_url",
      header: "Icon",
      includeInCsv: false,
      formatter: (row) =>
        row.icon_url ? (
          <img src={row.icon_url} alt={row.name} width="30" height="30" />
        ) : null,
    },
    { key: "description", header: "Description" },
    { key: "prefix", header: "Prefix" },
    { key: "default_unit", header: "Default Unit" },
    {
      key: "actions",
      header: "",
      includeInCsv: false,
      formatter: (row) => (
        <EditButton
          onClick={() => handleEditPartType(row)}
          buttonText="Edit"
          classNameExtension="dokuly-btn-transparent btn-sm"
          imgAlt="edit"
        />
      ),
    },
  ];

  return (
    <div className="card-body bg-white m-3 card rounded">
      <h5>
        <b>Part Types</b>
      </h5>
      <div className="row">
        <div className="col-md-4">
          <button
            className="btn btn-bg-transparent"
            onClick={() => {
              handleNewPartType();
            }}
          >
            <div className="row">
              <img
                src="../../../../static/icons/circle-plus.svg"
                className="icon-tabler-dark"
                alt="edit"
                width="30px"
                height="30px"
              />
              <span className="btn-text">New part type</span>
            </div>
          </button>
        </div>
      </div>
      <DokulyTable
        data={partTypes}
        columns={columns}
        itemsPerPage={10}
        showSearch={false}
        showPagination={true}
      />

      <PartTypeForm
        show={modalShow}
        onHide={() => {
          setModalShow(false);
          setPartTypeSelected(null);
        }}
        setRefresh={setRefresh}
        partTypeSelected={partTypeSelected}
      />
    </div>
  );
};
export default PartTypes;
