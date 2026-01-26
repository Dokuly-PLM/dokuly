import React, { useState, useEffect, useContext } from "react";

import { fetchProjects } from "../projects/functions/queries";
import { fetchCustomers } from "../customers/funcitons/queries";
import { fetchNewestPcbaRevisions } from "./functions/queries";

import { dateFormatter } from "../documents/functions/formatters";
import {
  numberFormatter,
  ThumbnailFormatterComponent,
} from "./functions/formatters";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../App";
import NewPcbaForm from "./forms/pcbaNewForm";
import DokulyTable from "../dokuly_components/dokulyTable/dokulyTable";
import { releaseStateFormatter } from "../dokuly_components/formatters/releaseStateFormatter";
import DokulyTags from "../dokuly_components/dokulyTags/dokulyTags";
import { useSyncedSearchParam } from "../common/hooks/useSyncedSearchParam";
import { starFormatter } from "../dokuly_components/formatters/starFormatter";
import { starPcba, unstarPcba } from "./functions/queries";

export default function PcbaTable(props) {
  const [refresh, setRefresh] = useState(true);
  const [pcbas, setPcbas] = useState([]);
  const [processedPcbas, setProcessedPcbas] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [projects, setProjecs] = useState([]);
  const [searchTerm, setSearchTerm] = useSyncedSearchParam("search", 250, "pcbas");
  const navigate = useNavigate();
  const location = useLocation();

  const { isAuthenticated, setIsAuthenticated } = useContext(AuthContext);

  useEffect(() => {
    // Check if there is data in local storage

    const cachedPcbas = localStorage.getItem("pcbas");
    if (cachedPcbas) {
      try {
        setPcbas(JSON.parse(cachedPcbas));
      } catch (e) {
        localStorage.removeItem("pcbas");
      }
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
    // check local storage for cached projects
    const cachedProjects = localStorage.getItem("projects");
    if (cachedProjects) {
      try {
        setProjecs(JSON.parse(cachedProjects));
      } catch (e) {
        localStorage.removeItem("projects");
      }
    }

    if (pcbas === [] || pcbas == null || refresh === true) {
      fetchNewestPcbaRevisions()
        .then((res) => {
          if (res.status === 200) {
            setPcbas(res.data);
            localStorage.setItem("pcbas", JSON.stringify(res.data));
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
    if (customers === [] || customers == null || refresh === true) {
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
    if (projects === [] || projects == null || refresh === true) {
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
    setRefresh(false);

    // Updates tab title
    document.title = "PCBA | Dokuly";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refresh]);

  useEffect(() => {
    if (props?.refresh === true) {
      setRefresh(true);
    }
  }, [props.refresh]);

  useEffect(() => {
    const tempPcbas = [];

    // Creates a new sorted array
    const sortedPcbas = [...pcbas].sort((a, b) =>
      a.revision < b.revision ? 1 : -1
    );

    // Populate tempPcbas with the latest revision of each PCBA
    sortedPcbas.forEach((pcba) => {
      if (!tempPcbas.some((e) => e.part_number === pcba.part_number)) {
        tempPcbas.push(pcba);
      }
    });

    setProcessedPcbas(tempPcbas);
  }, [pcbas]);

  const handleRowClick = (row_id, row, event) => {
    // Navigate to detail without search param (search is persisted in localStorage)
    const target = `/pcbas/${row.id}`;
    if (event?.ctrlKey || event?.metaKey) {
      window.open(`/#${target}`);
    } else {
      navigate(target);
    }
  };

  const handleStarClick = (e, row) => {
    e.stopPropagation();
    if (row.is_starred) {
      // Unstar
      // Optimistically update the UI
      setPcbas((prevPcbas) =>
        prevPcbas.map((pcba) =>
          pcba.id === row.id ? { ...pcba, is_starred: false } : pcba
        )
      );
      unstarPcba(row.id)
        .then((res) => {
          if (res.status === 200) {
            // Force refresh - fetch data again
            fetchNewestPcbaRevisions()
              .then((fetchRes) => {
                if (fetchRes.status === 200) {
                  setPcbas(fetchRes.data);
                  localStorage.setItem("pcbas", JSON.stringify(fetchRes.data));
                }
              })
              .catch((err) => {
                console.error("Error fetching PCBAs:", err);
              });
          }
        })
        .catch((err) => {
          console.error("Error unstarring PCBA:", err);
          // Revert on error - refresh to get correct state
          setRefresh(true);
        });
    } else {
      // Star (always personal)
      // Optimistically update the UI
      setPcbas((prevPcbas) =>
        prevPcbas.map((pcba) =>
          pcba.id === row.id ? { ...pcba, is_starred: true } : pcba
        )
      );
      starPcba(row.id)
        .then((res) => {
          if (res.status === 200) {
            // Force refresh - fetch data again
            fetchNewestPcbaRevisions()
              .then((fetchRes) => {
                if (fetchRes.status === 200) {
                  setPcbas(fetchRes.data);
                  localStorage.setItem("pcbas", JSON.stringify(fetchRes.data));
                }
              })
              .catch((err) => {
                console.error("Error fetching PCBAs:", err);
              });
          }
        })
        .catch((err) => {
          console.error("Error starring PCBA:", err);
          // Revert on error - refresh to get correct state
          setRefresh(true);
        });
    }
  };

  const starColumnFormatter = (row) => {
    return starFormatter(row, "pcbas", handleStarClick);
  };

  const columns = [
    {
      key: "star",
      header: "",
      formatter: starColumnFormatter,
      filterable: false,
      sortable: false,
      maxWidth: "50px",
      defaultShowColumn: true,
    },
    {
      key: "full_part_number",
      header: "Part number",
      formatter: numberFormatter,
    },
    {
      key: "pcb_renders",
      header: "",
      formatter: (row) => {
        return <ThumbnailFormatterComponent row={row} />;
      },
      filterable: false,
    },
    {
      key: "display_name",
      header: "Display name",
    },
    {
      key: "tags",
      header: "Tags",
      maxWidth: "140px",
      filterType: "multiselect",
      filterValue: (row) => {
        const tags = row?.tags ?? [];
        return tags?.length > 0 ? tags.map((tag) => tag.name) : [];
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
      filterValue: (row) => {
        return row?.project?.customer?.name || "";
      },
      formatter: (row) => {
        return row?.project?.customer?.name || "";
      },
    },
    {
      key: "project_name",
      header: "Project",
      filterType: "select",
      filterValue: (row) => {
        return row?.project?.title || "";
      },
      formatter: (row) => {
        return row.project ? row.project.title : "";
      },
    },
    {
      key: "external_part_number",
      header: "External P/N",
      defaultShowColumn: false,
    },
    {
      key: "release_state",
      header: "State",
      filterType: "select",
      filterValue: (row) => row.release_state || "",
      formatter: releaseStateFormatter,
    },
    {
      key: "last_updated",
      header: "Last modified",
      filterType: "date",
      formatter: dateFormatter,
    },
  ];

  return (
    <div
      className="container-fluid mt-2 mainContainerWidth"
      style={{ paddingBottom: "1rem" }}
    >
      <NewPcbaForm setRefresh={props?.setRefresh} />
      <div className="card rounded p-3">
        <DokulyTable
          tableName="pcbas"
          data={processedPcbas}
          columns={columns}
          itemsPerPage={100}
          onRowClick={handleRowClick}
          defaultSort={{ columnNumber: 8, order: "desc" }}
          showColumnFilters={true}
          showFilterChips={true}
          showSavedViews={true}
          showColumnSelector={true}
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          showClearSearch={true}
        />
      </div>
    </div>
  );
}
