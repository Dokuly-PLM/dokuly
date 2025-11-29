import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import DokulyTable from "../dokuly_components/dokulyTable/dokulyTable";
import AddButton from "../dokuly_components/AddButton";
import DokulyDateFormat from "../dokuly_components/formatters/dateFormatter";
import { releaseStateFormatter } from "../dokuly_components/formatters/releaseStateFormatter";
import { getAllEcos, createEco, deleteEco } from "./functions/queries";
import { AuthContext } from "../App";
import { loadingSpinner } from "../admin/functions/helperFunctions";
import DeleteRowButton from "../dokuly_components/deleteRowButton";

const EcoTable = ({ refresh: externalRefresh, setRefresh: setExternalRefresh }) => {
  const navigate = useNavigate();
  const { isAuthenticated, setIsAuthenticated } = useContext(AuthContext);
  const [ecos, setEcos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [internalRefresh, setInternalRefresh] = useState(true);
  const [tableTextSize, setTableTextSize] = useState("16px");

  // Handle both internal and external refresh
  const refresh = externalRefresh !== undefined ? externalRefresh : internalRefresh;
  const setRefresh = setExternalRefresh !== undefined ? setExternalRefresh : setInternalRefresh;

  useEffect(() => {
    if (!refresh && !loading) return;

    getAllEcos()
      .then((res) => {
        if (res.status === 200) {
          setEcos(res.data);
        }
      })
      .catch((err) => {
        if (err?.response?.status === 401) {
          setIsAuthenticated(false);
        }
        toast.error("Failed to load ECOs");
      })
      .finally(() => {
        setLoading(false);
        setRefresh(false);
        setInternalRefresh(false);
      });
  }, [refresh, internalRefresh]);

  const handleCreateEco = () => {
    createEco({})
      .then((res) => {
        if (res.status === 201) {
          toast.success("ECO created successfully");
          navigate(`/eco/${res.data.id}`);
        }
      })
      .catch((err) => {
        toast.error("Failed to create ECO");
      });
  };

  const handleDeleteEco = (id) => {
    if (!confirm("Are you sure you want to delete this ECO?")) {
      return;
    }
    deleteEco(id)
      .then((res) => {
        if (res.status === 204) {
          toast.success("ECO deleted successfully");
          setRefresh(true);
        }
      })
      .catch((err) => {
        if (err?.response?.status === 400) {
          toast.error(err.response.data);
        } else {
          toast.error("Failed to delete ECO");
        }
      });
  };

  const columns = [
    {
      key: "id",
      header: "#",
      headerTooltip: "ECO ID",
      sortable: true,
      defaultShowColumn: true,
      maxWidth: "60px",
      formatter: (row) => <b>ECO-{row.id}</b>,
    },
    {
      key: "display_name",
      header: "Name",
      headerTooltip: "ECO Display Name",
      sortable: true,
      defaultShowColumn: true,
      maxWidth: "200px",
      formatter: (row) => row.display_name || "-",
    },
    {
      key: "release_state",
      header: "State",
      headerTooltip: "Release State",
      sortable: true,
      filterType: "select",
      filterValue: (row) => row.release_state || "",
      defaultShowColumn: true,
      maxWidth: "100px",
      formatter: releaseStateFormatter,
    },
    {
      key: "responsible",
      header: "Responsible",
      headerTooltip: "Responsible person",
      sortable: true,
      defaultShowColumn: true,
      maxWidth: "150px",
      formatter: (row) =>
        row.responsible
          ? `${row.responsible.first_name} ${row.responsible.last_name}`
          : "-",
    },
    {
      key: "created_at",
      header: "Created",
      headerTooltip: "Creation date",
      sortable: true,
      defaultShowColumn: true,
      maxWidth: "120px",
      formatter: (row) => <DokulyDateFormat date={row.created_at} />,
    },
    {
      key: "actions",
      header: "",
      defaultShowColumn: true,
      maxWidth: "50px",
      formatter: (row) =>
        row.release_state !== "Released" && (
          <DeleteRowButton
            row={row}
            handleDelete={() => handleDeleteEco(row.id)}
          />
        ),
    },
  ];

  const handleRowClick = (rowId, row, event) => {
    if (event.ctrlKey || event.metaKey) {
      window.open(`#/eco/${row.id}`, "_blank");
    } else {
      navigate(`/eco/${row.id}`);
    }
  };

  if (loading) {
    return (
      <div className="container-fluid mt-2 mainContainerWidth">
        {loadingSpinner()}
      </div>
    );
  }

  return (
    <div
      className="container-fluid mt-2 mainContainerWidth"
      style={{ paddingBottom: "1rem" }}
    >
      <AddButton onClick={handleCreateEco} buttonText="New ECO" />
      <div className="card rounded p-3">
        <DokulyTable
          tableName="ecoTable"
          data={ecos}
          columns={columns}
          showColumnSelector={true}
          itemsPerPage={50}
          onRowClick={handleRowClick}
          defaultSort={{ columnNumber: 0, order: "desc" }}
          textSize={tableTextSize}
          setTextSize={setTableTextSize}
          showTableSettings={true}
          showColumnFilters={true}
          showFilterChips={true}
        />
      </div>
    </div>
  );
};

export default EcoTable;
