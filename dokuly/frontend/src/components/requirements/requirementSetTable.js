import React, { useState, useEffect, useContext } from "react";
import { Row, Col } from "react-bootstrap";

import { dateFormatter } from "../documents/functions/formatters";
import { fetchProjects } from "../projects/functions/queries";
import { getRequirementSets } from "./functions/queries";

import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../App";
import DokulyTable from "../dokuly_components/dokulyTable/dokulyTable";
import DokulyTags from "../dokuly_components/dokulyTags/dokulyTags";
import NewRequirementSetForm from "./forms/newRequirementSetForm";
import { useSyncedSearchParam } from "../common/hooks/useSyncedSearchParam";

export default function RequirementSetTable(props) {
  const [refresh, setRefresh] = useState(true);
  const [requirementSets, setRequirementSets] = useState([]);
  const [unProcessedRequirementSets, setUnProcessedRequirementSets] = useState([]);

  const [data, setFilteredItems] = useState([]);
  const [projects, setProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useSyncedSearchParam("search", 250, "requirements");

  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, setIsAuthenticated } = useContext(AuthContext);

  useEffect(() => {
    // Apply search filter if needed (DokulyTable handles its own search now)
    const temp_requirementSets = requirementSets;
    setFilteredItems(temp_requirementSets);
  }, [requirementSets]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: This effect should only run when refresh changes
  useEffect(() => {
    if (
      unProcessedRequirementSets?.length === 0 ||
      unProcessedRequirementSets == null ||
      refresh === true
    ) {
      // check if there is data in local storage
      const cachedRequirementSets = localStorage.getItem("requirementSets");
      if (cachedRequirementSets) {
        try {
          setUnProcessedRequirementSets(JSON.parse(cachedRequirementSets));
        } catch (e) {
          localStorage.removeItem("requirementSets");
        }
      }

      getRequirementSets()
        .then((res) => {
          if (res.status === 200) {
            setUnProcessedRequirementSets(res.data);
            localStorage.setItem("requirementSets", JSON.stringify(res.data));
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

    // check local storage for cached projects
    const cachedProjects = localStorage.getItem("projects");
    if (cachedProjects) {
      try {
        setProjects(JSON.parse(cachedProjects));
      } catch (e) {
        localStorage.removeItem("projects");
      }
    }

    if (projects?.length === 0 || projects == null || refresh === true) {
      fetchProjects()
        .then((res) => {
          setProjects(res.data);
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
    document.title = "Requirements | Dokuly";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refresh]);

  useEffect(() => {
    if (props?.refresh === true) {
      setRefresh(true);
    }
  }, [props.refresh]);

  useEffect(() => {
    if (unProcessedRequirementSets.length !== 0 && projects.length !== 0) {
      // Map projects to requirement sets
      const processedSets = unProcessedRequirementSets.map((set) => {
        const project = projects.find((p) => p.id === set.project);
        return {
          ...set,
          project_name: project?.title || "No project",
        };
      });
      setRequirementSets(processedSets);
    }
  }, [unProcessedRequirementSets, projects]);

  const handleRowClick = (rowIndex, row, event) => {
    // Navigate to detail without search param (search is persisted in localStorage)
    const target = `/requirements/set/${row.id}`;
    if (event?.ctrlKey || event?.metaKey) {
      window.open(`/#${target}`);
    } else {
      navigate(target);
    }
  };

  const columns = [
    {
      key: "display_name",
      header: "Display Name",
      maxWidth: "300px",
    },
    {
      key: "description",
      header: "Description",
      maxWidth: "400px",
      defaultShowColumn: false,
      formatter: (row) => {
        const desc = row.description || "";
        if (desc.length > 100) {
          return desc.substring(0, 100) + "...";
        }
        return desc;
      },
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
      csvFormatter: (row) => (row?.tags ? row.tags.map((tag) => tag.name).join(", ") : ""),
      defaultShowColumn: true,
    },
    {
      key: "project_name",
      header: "Project", 
      filterType: "select",
    },
    {
      key: "last_updated",
      header: "Last Modified",
      filterType: "date",
      formatter: (row) => dateFormatter(row),
    },
  ];

  return (
    <div
      className="container-fluid mt-2 mainContainerWidth"
      style={{ paddingBottom: "1rem" }}
    >
      <NewRequirementSetForm setRefresh={setRefresh} />
      <div className="card rounded p-3">
        <Row className="p-2">
          {data.length > 0 ? (
            <DokulyTable
              data={data}
              tableName="requirements"
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
              defaultSort={{ columnNumber: 5, order: "desc" }}
              searchTerm={searchTerm}
              onSearchTermChange={setSearchTerm}
              showClearSearch={true}
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
                  <h5>No requirement sets found</h5>
                </div>
              )}
            </>
          )}
        </Row>
      </div>
    </div>
  );
}