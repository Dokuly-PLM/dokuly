import React, { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import { fetchProjects } from "../projects/functions/queries";
import { fetchCustomers } from "../customers/funcitons/queries";
import { getAssembliesLatestRevisions } from "./functions/queries";
import { mapProjectCustomerItems } from "../pcbas/functions/helperFuncitons";

import { dateFormatter } from "../documents/functions/formatters";
import { numberFormatter, thumbnailFormatter } from "./functions/formatters";
import NewAssemblyForm from "./forms/assemblyNewForm";
import { releaseStateFormatter } from "../dokuly_components/formatters/releaseStateFormatter";
import DokulyTable from "../dokuly_components/dokulyTable/dokulyTable";
import DokulyTags from "../dokuly_components/dokulyTags/dokulyTags";

export default function AssembliesTable(props) {
  const navigate = useNavigate();

  const [refresh, setRefresh] = useState(true);
  const [assemblies, setAssemblies] = useState([]);
  const [unProcessedAssemblies, setUnProcessedAssemblies] = useState([]);

  const [customers, setCustomers] = useState([]);
  const [projects, setProjecs] = useState([]);

  useEffect(() => {
    if (
      unProcessedAssemblies?.lenght === 0 ||
      unProcessedAssemblies == null ||
      refresh === true
    ) {
      getAssembliesLatestRevisions()
        .then((res) => {
          if (res.status === 200) {
            setUnProcessedAssemblies(res.data);
          }
        })
        .catch((err) => {
          if (err?.response) {
            if (err?.response?.status === 401) {
              localStorage.removeItem("token");
              localStorage.removeItem("token_created");
            }
          }
        });
    }
    if (customers?.length === 0 || customers == null || refresh === true) {
      fetchCustomers()
        .then((res) => {
          setCustomers(res.data);
        })
        .catch((err) => {
          if (err?.response) {
            if (err?.response?.status === 401) {
              localStorage.removeItem("token");
              localStorage.removeItem("token_created");
            }
          }
        });
    }
    if (projects?.length === 0 || projects == null || refresh === true) {
      fetchProjects()
        .then((res) => {
          setProjecs(res.data);
        })
        .catch((err) => {
          if (err?.response) {
            if (err?.response?.status === 401) {
              localStorage.removeItem("token");
              localStorage.removeItem("token_created");
            }
          }
        });
    }
    setRefresh(false);

    // Updates tab title
    document.title = "Assemblies | Dokuly";
  }, [refresh]);

  useEffect(() => {
    if (props?.refresh === true) {
      setRefresh(true);
    }
  }, [props.refresh]);

  useEffect(() => {
    if (
      unProcessedAssemblies.length !== 0 &&
      projects.length !== 0 &&
      customers.length !== 0
    ) {
      setAssemblies(
        mapProjectCustomerItems(unProcessedAssemblies, projects, customers)
      );
    }
  }, [unProcessedAssemblies, customers, projects]);


  const handleRowClick = (row_id, row, event) => {
    if (event?.ctrlKey || event?.metaKey) {
      window.open(`/#/assemblies/${row.id}`);
    } else {
      navigate(`/assemblies/${row.id}`);
    }
  };

  const columns = [
    {
      key: "full_part_number",
      header: "Part number",
      formatter: numberFormatter,
    },
    {
      key: "thumbnail",
      header: "",
      includeInCsv: false,
      formatter: thumbnailFormatter,
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
    },
    {
      key: "project_name",
      header: "Project",
      filterType: "select",
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
      <NewAssemblyForm setRefresh={props?.setRefresh} />
      <div className="card rounded p-3">
        <DokulyTable
          tableName="assemblies"
          data={assemblies}
          columns={columns}
          itemsPerPage={100}
          onRowClick={handleRowClick}
          defaultSort={{ columnNumber: 8, order: "desc" }}
          showColumnFilters={true}
          showFilterChips={true}
          showSavedViews={true}
          showColumnSelector={true}
        />
      </div>
    </div>
  );
}
