import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Card, Modal } from "react-bootstrap";
import DokulyTable from "../../../dokuly_components/dokulyTable/dokulyTable";
import ContainerForm from "./containerForm";
import { useSpring } from "react-spring";
import { basicSkeletonLoaderTableCard } from "../../functions/helperFunctions";
import EditContainerForm from "./editContainerForm";

const ContainerList = (props) => {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [types, setTypes] = useState(
    props?.types !== undefined && props?.types !== null ? props.types : []
  );
  const [showModal, setShowModal] = useState(false);
  const [selectedRowData, setSelectedRowData] = useState(null);

  useEffect(() => {
    if (props?.types) {
      setTypes(props.types);
    }
    setLoading(false);
  }, [props.types]);

  const editFormatter = (row, column) => {
    return (
      <span
        style={{ cursor: "pointer" }}
        onClick={() => {
          setSelectedRowData(row);
          setShowModal(true);
        }}
      >
        <img src="../../static/icons/edit.svg" alt="edit" />
      </span>
    );
  };

  const descFormatter = (row) => {
    if (row?.description && row.description.length > 100) {
      return `${row.description.slice(0, 100)}...`;
    }
    return row.description;
  };

  const hasRowOrColFormatter = (row) => {
    return row.has_row_or_col ? "Yes" : "No";
  };

  const columns = [
    {
      key: "display_name",
      header: "Display Name",
    },
    {
      key: "description",
      header: "Description",
      formatter: descFormatter,
    },
    {
      key: "has_row_or_col",
      header: "Rows/Cols",
      formatter: hasRowOrColFormatter,
    },
    {
      key: "edit",
      header: "Edit",
      formatter: editFormatter,
      includeInCsv: false,
    },
  ];

  const spring = useSpring({
    loop: true,
    to: [
      { opacity: 1, color: "#A9A9A9" },
      { opacity: 0.1, color: "gray" },
    ],
    from: { opacity: 0.1, color: "#D3D3D3" },
  });

  if (loading) {
    return (
      <Card className="rounded bg-white p-5 mt-2">
        {basicSkeletonLoaderTableCard(7, 4, spring)}
      </Card>
    );
  }

  return (
    <Card className="rounded bg-white p-5 mt-2">
      <Card.Body>
        <Card.Title>Location Types</Card.Title>
        <div className="mb-3">
          <ContainerForm setOpen={setOpen} setRefresh={props.setRefresh} />
        </div>
        <Card className="rounded p-3 mt-2 shadow-none">
          <Card.Body>
            <DokulyTable
              data={types}
              columns={columns}
              itemsPerPage={10}
              showPagination={true}
              showSearch={true}
            />
          </Card.Body>
        </Card>
        <small>
          Location types describe the various types of physical storage
          locations...
        </small>

        {/* Edit Modal */}
        <Modal show={showModal} onHide={() => setShowModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Edit Location Type</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <EditContainerForm
              rowData={selectedRowData}
              closeModal={() => setShowModal(false)}
              setRefresh={props.setRefresh}
            />
          </Modal.Body>
        </Modal>
      </Card.Body>
    </Card>
  );
};

export default ContainerList;
