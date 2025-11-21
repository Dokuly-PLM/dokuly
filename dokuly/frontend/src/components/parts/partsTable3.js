import React, { useState, useEffect, useContext } from "react";
import { Row, Col } from "react-bootstrap";

import { fetchProjects } from "../projects/functions/queries";
import { fetchCustomers } from "../customers/funcitons/queries";
import { getPartsTable } from "./functions/queries";
import { mapProjectCustomerItems } from "../pcbas/functions/helperFuncitons";
import { imageFormatter } from "./functions/formatters";
import { dateFormatter } from "../documents/functions/formatters";
import { useNavigate, useLocation } from "react-router";
import { partSearch } from "./partSearch";
import { AuthContext } from "../App";
import PartNewForm from "./forms/newPartForm2";
import { usePartTypes } from "./partTypes/usePartTypes";
import DokulyTable from "../dokuly_components/dokulyTable/dokulyTable";
import { getUser } from "../layout/queries";
import DokulyTags from "../dokuly_components/dokulyTags/dokulyTags";

export default function PartsTable(props) {
  const [refresh, setRefresh] = useState(true);
  const [parts, setParts] = useState([]);
  const [unProcessedParts, setUnProcessedParts] = useState([]);

  const [data, setFilteredItems] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [projects, setProjecs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [allowed_app, setAllowedApp] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, setIsAuthenticated } = useContext(AuthContext);

  // Part types
  const partTypes = usePartTypes();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchParam = params.get("search");
    const historyState = location.state?.searchTerm;
    setSearchTerm(searchParam || historyState || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state, location.search]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const currentSearchTerm = params.get("search");

    if (currentSearchTerm !== searchTerm && searchTerm !== null) {
      params.set("search", searchTerm);
      navigate(`${location.pathname}?${params.toString()}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, location.pathname, location.search, navigate]);

  useEffect(() => {
    // Apply search filter if needed (DokulyTable handles its own search now)
    const temp_parts = parts;
    setFilteredItems(temp_parts);
  }, [parts]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: This effect should only run when refresh changes
  useEffect(() => {
    getUser().then((res) => {
      if (res.status === 200) {
        // Check if user has access to parts
        if (res.data?.allowed_apps.includes("parts")) {
          setAllowedApp(true);
        } else {
          setAllowedApp(false);
        }
      }
      if (
        unProcessedParts?.length === 0 ||
        unProcessedParts == null ||
        refresh === true
      ) {
        // check if there is data in local storage
        const cachedParts = localStorage.getItem("parts");
        if (cachedParts) {
          try {
            setUnProcessedParts(JSON.parse(cachedParts));
          } catch (e) {
            localStorage.removeItem("parts");
          }
        }

        getPartsTable()
          .then((res) => {
            if (res.status === 200) {
              setUnProcessedParts(res.data);
              localStorage.setItem("parts", JSON.stringify(res.data));
            }
          })
          .catch((err) => {
            if (err?.response) {
              if (err?.response?.status === 401) {
                setIsAuthenticated(false);
              }
            }
          });
      }

      // check local storage for cached customers
      const cachedCustomers = localStorage.getItem("customers");
      if (cachedCustomers) {
        try {
          setCustomers(JSON.parse(cachedCustomers));
        } catch (e) {
          localStorage.removeItem("customers");
        }
      }

      if (customers?.length === 0 || customers == null || refresh === true) {
        fetchCustomers()
          .then((res) => {
            setCustomers(res.data);
            localStorage.setItem("customers", JSON.stringify(res.data));
          })
          .catch((err) => {
            if (err?.response) {
              if (err?.response?.status === 401) {
                setIsAuthenticated(false);
              }
            }
          });
      }
      // check local storage for cached projects
      const cachedProjects = localStorage.getItem("projects");
      if (cachedProjects) {
        try {
          setProjecs(JSON.parse(cachedProjects));
        } catch (e) {
          localStorage.removeItem("projects");
        }
      }

      if (projects?.length === 0 || projects == null || refresh === true) {
        fetchProjects()
          .then((res) => {
            setProjecs(res.data);
            localStorage.setItem("projects", JSON.stringify(res.data));
          })
          .catch((err) => {
            if (err?.response) {
              if (err?.response?.status === 401) {
                setIsAuthenticated(false);
              }
            }
          });
      }
    });

    setRefresh(false);
    // Updates tab title
    document.title = "Parts | Dokuly";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refresh]);

  useEffect(() => {
    if (props?.refresh === true) {
      setRefresh(true);
    }
  }, [props.refresh]);

  useEffect(() => {
    if (
      unProcessedParts.length !== 0 &&
      projects.length !== 0 &&
      customers.length !== 0
    ) {
      setParts(mapProjectCustomerItems(unProcessedParts, projects, customers));
    }
  }, [unProcessedParts, customers, projects]);


  const handleRowClick = (rowIndex, row) => {
    if (event.ctrlKey || event.metaKey) {
      window.open(`/#/parts/${row.id}`);
    } else {
      navigate(`/parts/${row.id}`);
    }
  };

  const columns = [
    {
      key: "full_part_number",
      header: "Part Number",
        formatter: (row) => {
          // full_part_number already contains the properly formatted part number with revision
          return row.full_part_number;
        },
      maxWidth: "100px",
    },
    {
      key: "image_url",
      header: "",
      formatter: (row) => imageFormatter({}, row, partTypes),
      maxWidth: "100px",
      filterable: false,
    },
    {
      key: "display_name",
      header: "Display Name",
      maxWidth: "300px",
    },
    {
      key: "tags",
      header: "Tags",
      maxWidth: "140px",
      filterType: "multiselect",
      filterValue: (row) => {
        const tags = row?.tags ?? [];
        return tags.length > 0 ? tags.map((tag) => tag.name) : [];
      },
      searchValue: (row) => {
        const tags = row?.tags ?? [];
        return tags?.length > 0 ? tags.map((tag) => tag.name).join(" ") : "";
      },
      formatter: (row) => {
        return <DokulyTags tags={row?.tags ?? []} readOnly={true} />;
      },
      csvFormatter: (row) => (row?.tags ? row.tags : ""),
      defaultShowColumn: true,
    },
    {
      key: "customer_name",
      header: "Customer",
      filterType: "select",
    },
    {
      key: "project_name",
      header: "Project",
      filterType: "select",
    },
    {
      key: "release_state",
      header: "State",
      filterType: "select",
      filterValue: (row) => row.release_state || "", // Use raw value for filtering
      formatter: (row) => {
        if (row.release_state === "Draft") {
          return <span className="badge badge-pill badge-warning">Draft</span>;
        }
        if (row.release_state === "Review") {
          return <span className="badge badge-pill badge-warning">Review</span>;
        }
        if (row.release_state === "Released") {
          return row.release_state;
        }
        return null;
      },
    },
    {
      key: "last_updated",
      header: "Last Modified",
      filterType: "date",
      formatter: (row) => dateFormatter(row),
    },
    {
      key: "mpn",
      header: "Mpn",
      defaultShowColumn: false,
    },
    {
      key: "manufacturer",
      header: "Manufacturer",
      defaultShowColumn: false,
    },
    {
      key: "current_total_stock",
      header: "Current Stock",
      filterType: "number",
      defaultShowColumn: false,
    },
    {
      key: "external_part_number",
      header: "External P/N",
      defaultShowColumn: false,
    },
    {
      key: "manufacturer",
      header: "Manufacturer",
      defaultShowColumn: false,
    },
  ];

  return (
    <div
      className="container-fluid mt-2 mainContainerWidth"
      style={{ paddingBottom: "1rem" }}
    >
      <PartNewForm setRefresh={props?.setRefresh} />
      <div className="card rounded p-3">
        <Row className="p-2">
          {data.length > 0 ? (
            <DokulyTable
              data={data}
              tableName="parts"
              columns={columns}
              showCsvDownload={true}
              showColumnSelector={true}
              itemsPerPage={100}
              selectedRowIndex={null}
              onRowClick={handleRowClick}
              showPagination={true}
              showSearch={true}
              showColumnFilters={true}
              showFilterChips={true}
              showSavedViews={true}
              defaultSort={{ columnNumber: 7, order: "desc" }}
            />
          ) : (
            <>
              {refresh && (
                <>
                  <Col />
                  <Col>
                    <div className="spinner-border text-primary" role="status">
                      <span className="sr-only">Loading...</span>
                    </div>
                  </Col>
                  <Col />
                </>
              )}
              {!refresh && data?.length === 0 && (
                <div className="m-2">
                  <h5>No parts found</h5>
                </div>
              )}
            </>
          )}
        </Row>
      </div>
    </div>
  );
}
