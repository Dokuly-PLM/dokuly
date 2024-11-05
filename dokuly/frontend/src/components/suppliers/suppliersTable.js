import React, { useState, useEffect, useContext } from "react";
import { Row, Col } from "react-bootstrap";

import { getSuppliers } from "./functions/queries";
import NewSupplierForm from "./forms/newSupplierForm";
import EditSupplierForm from "./forms/editSupplierForm";
import DokulyTable from "../dokuly_components/dokulyTable/dokulyTable";
import { AuthContext } from "../App";
import { useNavigate } from "react-router-dom";
import DokulyImage from "../dokuly_components/dokulyImage";
import { formatCloudImageUri } from "../pcbas/functions/productionHelpers";

const imageFormatter = (cell, row) => {
  const containerStyle = {
    display: "flex",
    justifyContent: "center", // Center horizontally
    alignItems: "center", // Center vertically (if needed)
    maxHeight: "70px", // Ensure the container has a fixed height
    width: "70px", // Use full width of the cell
  };

  if (row?.thumbnail !== undefined && row?.thumbnail !== null) {
    return (
      <div style={containerStyle}>
        <DokulyImage
          src={formatCloudImageUri(row?.thumbnail)}
          alt="Thumbnail"
          style={{
            maxWidth: "70px",
            maxHeight: "70px",
            objectFit: "contain",
            display: "block",
            margin: "auto",
          }}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = ""; // set default image to no image
          }}
        />
      </div>
    );
  }

  return "";
};

export default function SupplierTable() {
  const { isAuthenticated, setIsAuthenticated } = useContext(AuthContext);
  const [refresh, setRefresh] = useState(true);
  const [suppliers, setSuppliers] = useState([]);
  const [showInactiveSuppliers, setShowInactiveSuppliers] = useState(false);
  const [supplierGetStatus, setSupplierGetStatus] = useState(200);
  const [editSupplier, setEditSupplier] = useState(0);
  const [supplierToEdit, setSupplierToEdit] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    if (refresh) {
      // Optionally check local storage for cached suppliers here
      refetchSuppliers();
    }
    document.title = "Suppliers | Dokuly";
  }, [refresh]);

  useEffect(() => {
    if (!showInactiveSuppliers) {
      setSuppliers((prevSuppliers) =>
        prevSuppliers.filter((supplier) => supplier.is_active),
      );
    }
  }, [showInactiveSuppliers]);

  const refetchSuppliers = () => {
    getSuppliers()
      .then((res) => {
        if (res.status === 200) {
          setSupplierGetStatus(res.status);
          setSuppliers(res.data);
          // Optionally cache suppliers to local storage here
        }
      })
      .catch((err) => {
        if (err?.response?.status === 401) {
          setIsAuthenticated(false);
        }
      })
      .finally(() => {
        setRefresh(false);
      });
  };

  const toggleShowInactive = () =>
    setShowInactiveSuppliers((prevState) => !prevState);

  const columns = [
    {
      key: "thumbnail",
      header: "",
      includeInCsv: false,
      formatter: (row) => imageFormatter({}, row),
      maxWidth: "70px",
    },
    {
      key: "supplier_id",
      header: "Supplier Number",
      includeInCsv: true,
    },

    { key: "name", header: "Supplier Name", includeInCsv: true },
    {
      key: "is_active",
      header: "Active",
      includeInCsv: true,
      formatter: (row) => {
        if (
          row?.is_active !== null &&
          row?.is_active !== undefined &&
          row?.is_active === true
        ) {
          return (
            <img
              src="../../static/icons/check.svg"
              alt="checked"
              width="30px"
              height="30px"
            />
          );
        }
        return "";
      },
    },
  ];

  const formatEditSupplier = (supplier) => {
    return (
      <button
        className="btn btn-sm"
        onClick={() => handleEditSupplier(supplier)}
      >
        <img src="../../static/icons/edit.svg" alt="Edit" />
      </button>
    );
  };

  const handleEditSupplier = (supplier) => {
    setEditSupplier((prevState) => prevState + 1);
    setSupplierToEdit(supplier);
  };

  // Filter suppliers based on active/inactive state
  const filteredSuppliers = suppliers.filter(
    (supplier) => showInactiveSuppliers || supplier.is_active,
  );

  const handleRowClick = (rowIndex, row) => {
    if (event.ctrlKey || event.metaKey) {
      window.open(`/#/suppliers/${row.id}`);
    } else {
      navigate(`/suppliers/${row.id}`);
    }
  };
  return (
    <div className="container-fluid mt-2" style={{ paddingBottom: "1rem" }}>
      <NewSupplierForm setRefresh={setRefresh} />

      <div className="card rounded p-3">
        <div className="m-2">
          {supplierGetStatus !== 200 ? (
            <div className="m-2">
              <h5>No Suppliers created</h5>
            </div>
          ) : (
            <>
              <Row className="mb-2">
                <Col>
                  <div className="form-check">
                    <input
                      className="dokuly-checkbox"
                      type="checkbox"
                      id="showInactiveSuppliers"
                      checked={showInactiveSuppliers}
                      onChange={toggleShowInactive}
                    />
                    <label
                      className="form-check-label ml-1"
                      htmlFor="showInactiveSuppliers"
                    >
                      Show Inactive Suppliers
                    </label>
                  </div>
                </Col>
              </Row>
              <DokulyTable
                data={filteredSuppliers}
                columns={columns}
                showCsvDownload={true}
                onRowClick={handleRowClick}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
