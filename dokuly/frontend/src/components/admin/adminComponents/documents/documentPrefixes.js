import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { editPrefix, fetchPrefixes } from "../../functions/queries";
import DocumentPrefixForm from "./documentPrefixForm";
import DokulyTable from "../../../dokuly_components/dokulyTable/dokulyTable";
import EditButton from "../../../dokuly_components/editButton";

const DocumentPrefixes = (props) => {
  const [refresh, setRefresh] = useState(false);
  const [prefixes, setPrefixes] = useState(
    props.prefixes !== null && props.prefixes !== undefined
      ? props.prefixes
      : []
  );

  const [prefixSelected, setPrefixSelected] = useState(null);
  const [modalShow, setModalShow] = useState(false);

  useEffect(() => {
    if (refresh) {
      fetchPrefixes().then((res) => {
        if (res.status === 200) {
          setPrefixes(res.data);
        } else {
          toast.error("Error fetching prefixes");
        }
      });
    }
    setRefresh(false);
  }, [props, refresh]);

  const handleEditPrefix = (prefixData) => {
    // Open a modal or set state for a form with the prefix data to be edited
    setPrefixSelected(prefixData);
    setModalShow(true);
  };

  const handleSaveEdit = (updatedPrefixData) => {
    // Logic to save the edited prefix
    editPrefix(updatedPrefixData.id, updatedPrefixData)
      .then((res) => {
        setPrefixes(res.data);
        setModalShow(false);
        setPrefixSelected(null);
      })
      .catch((error) => {
        toast.error("Error updating prefix");
        console.error("Error updating prefix", error);
      });
  };

  useEffect(() => {
    setPrefixes(props.prefixes || []);
  }, [props.prefixes]);

  const columns = [
    { key: "display_name", header: "Display Name" },
    { key: "prefix", header: "Prefix" },
    { key: "description", header: "Description" },
    {
      key: "archive",
      header: "Archived",
    },
    {
      key: "actions",
      header: "Actions",
      formatter: (row) => (
        <EditButton
          onClick={() => handleEditPrefix(row)}
          buttonText="Edit"
          textSize="14px"
          iconSize="20px"
        />
      ),
    },
  ];

  return (
    <div className="card-body bg-white m-3 card rounded">
      <h5>
        <b>Document Types</b>
      </h5>
      <div className="row">
        <div className="col-md-4">
          <button
            className="btn btn-bg-transparent"
            onClick={() => {
              setModalShow(true);
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
              <span className="btn-text">New prefix</span>
            </div>
          </button>
        </div>
      </div>
      {prefixes.length > 0 ? (
        <DokulyTable
          data={prefixes}
          columns={columns}
          itemsPerPage={10}
          showSearch={false}
          showPagination={true}
          // Additional DokulyTable props as needed
        />
      ) : (
        <div>No prefixes found. You can create new ones using the form.</div>
      )}
      <DocumentPrefixForm
        show={modalShow}
        onHide={() => {
          setModalShow(false);
          setPrefixSelected(null);
        }}
        setRefresh={setRefresh}
        prefixSelected={prefixSelected}
      />
    </div>
  );
};
export default DocumentPrefixes;
