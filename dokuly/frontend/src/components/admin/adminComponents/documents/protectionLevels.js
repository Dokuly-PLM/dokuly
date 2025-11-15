import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  fetchProtectionLevels,
  deleteProtectionLevel,
} from "../../functions/queries";
import ProtectionLevelForm from "./protectionLevelForm";
import DokulyTable from "../../../dokuly_components/dokulyTable/dokulyTable";

const ProtectionLevels = (props) => {
  const [refresh, setRefresh] = useState(false);
  const [protectionLevels, setProtectionLevels] = useState([]);
  const [protectionLevelSelected, setProtectionLevelSelected] = useState(null);
  const [modalShow, setModalShow] = useState(false);

  useEffect(() => {
    if (refresh || !protectionLevels.length) {
      fetchProtectionLevels()
        .then((res) => {
          if (res.status === 200) {
            setProtectionLevels(res.data);
          } else {
            toast.error("Error fetching protection levels");
          }
        })
        .catch((error) => {
          toast.error("Error fetching protection levels");
        });
    }
    setRefresh(false);
  }, [refresh]);

  const handleEditProtectionLevel = (protectionLevelData) => {
    setProtectionLevelSelected(protectionLevelData);
    setModalShow(true);
  };

  const handleDeleteProtectionLevel = (protectionLevelId) => {
    if (window.confirm("Are you sure you want to delete this protection level? This action cannot be undone.")) {
      deleteProtectionLevel(protectionLevelId)
        .then((res) => {
          if (res.status === 200) {
            toast.success("Protection level deleted successfully");
            setProtectionLevels(res.data);
          }
        })
        .catch((error) => {
          if (error.response?.status === 400) {
            toast.error("Cannot delete protection level that is in use by documents");
          } else {
            toast.error("Error deleting protection level");
          }
        });
    }
  };

  const columns = [
    { key: "level", header: "Level" },
    { key: "name", header: "Name" },
    { key: "description", header: "Description" },
    {
      key: "actions",
      header: "Actions",
      formatter: (row) => (
        <div>
          <button
            className="btn dokuly-btn-transparent btn-sm me-2"
            onClick={() => handleEditProtectionLevel(row)}
          >
            Edit
          </button>
          <button
            className="btn btn-sm"
            style={{ color: "#dc3545" }}
            onClick={() => handleDeleteProtectionLevel(row.id)}
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="card-body bg-white m-3 card rounded">
      <h5>
        <b>Protection Levels</b>
      </h5>
      <p className="text-muted">
        <small>
          Define protection levels to classify document accessibility and
          distribution rights. Examples: Internal, Confidential, Public,
          Customer Releasable.
        </small>
      </p>
      <div className="row">
        <div className="col-md-4">
          <button
            className="btn btn-bg-transparent"
            onClick={() => {
              setProtectionLevelSelected(null);
              setModalShow(true);
            }}
          >
            <div className="row">
              <img
                src="../../../../static/icons/circle-plus.svg"
                className="icon-tabler-dark"
                alt="add"
                width="30px"
                height="30px"
              />
              <span className="btn-text">New protection level</span>
            </div>
          </button>
        </div>
      </div>
      {protectionLevels.length > 0 ? (
        <DokulyTable
          data={protectionLevels}
          columns={columns}
          itemsPerPage={10}
          showSearch={false}
          showPagination={true}
        />
      ) : (
        <div>
          No protection levels found. You can create new ones using the form.
        </div>
      )}
      <ProtectionLevelForm
        show={modalShow}
        onHide={() => {
          setModalShow(false);
          setProtectionLevelSelected(null);
        }}
        setRefresh={setRefresh}
        protectionLevelSelected={protectionLevelSelected}
      />
    </div>
  );
};

export default ProtectionLevels;
