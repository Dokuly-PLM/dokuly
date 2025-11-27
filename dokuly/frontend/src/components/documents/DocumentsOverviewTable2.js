import React, { useState, useEffect, useContext } from "react";
import {
  getLatestDocumentRevisions,
  //getLatestDocumentRevisionsFirst25,
} from "./functions/queries";
import { fetchProjects } from "../projects/functions/queries";
import { fetchCustomers } from "../customers/funcitons/queries";

import {
  mapProjectCustomerToDocs,
  filterOlderRevisions,
} from "./functions/helperFunctions";

import {
  dateFormatter,
  numberFormatter2,
  titleFormatter,
} from "./functions/formatters";

import { releaseStateFormatter } from "../dokuly_components/formatters/releaseStateFormatter";
import { ThumbnailFormatter } from "../dokuly_components/dokulyTable/functions/formatters";

import NewDocumentForm from "./documentNewForm2";
import { useNavigate } from "react-router";
import { AuthContext } from "../App";
import DokulyTable from "../dokuly_components/dokulyTable/dokulyTable";
import DokulyTags from "../dokuly_components/dokulyTags/dokulyTags";

export default function DocumentsOverviewTable2() {
  const { isAuthenticated, setIsAuthenticated } = useContext(AuthContext);
  const [refresh, setRefresh] = useState(true);
  const [unprocessedDocuments, setUnprocessedDocuments] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [projects, setProjecs] = useState([]);
  const [documentsStatus, setDocumentsStatus] = useState(200);
  const navigate = useNavigate();

  useEffect(() => {
    if (documents === [] || documents == null || refresh === true) {
      refetch_documents();
    }
    if (customers === [] || customers == null || refresh === true) {
      fetchCustomers()
        .then((res) => {
          setCustomers(res.data);
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
    // Updates the tab text
    document.title = "Documents | Dokuly";
  }, [refresh]);

  function refetch_documents() {
    getLatestDocumentRevisions()
      .then((res) => {
        if (res.status === 200) {
          setDocumentsStatus(res.status);
          setUnprocessedDocuments(res.data);
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

  useEffect(() => {
    if (
      unprocessedDocuments.length !== 0 &&
      projects.length !== 0 &&
      customers.length !== 0
    ) {
      setDocuments(
        mapProjectCustomerToDocs(unprocessedDocuments, projects, customers)
      );
    }
  }, [unprocessedDocuments, projects, customers]);

  const rowEvents = {
    onClick: (rowIndex, row) => {
      if (event.ctrlKey || event.metaKey) {
        window.open(`/#/documents/${row.id}`);
      } else {
        window.location.href = `/#/documents/${row.id}`;
      }
    },
  };

  const columns = [
    {
      key: "full_doc_number",
      header: "Document number",
      formatter: numberFormatter2,
      maxWidth: "150px",
    },
    {
      key: "thumbnail",
      header: "",
      formatter: (row) => {
        return <ThumbnailFormatter thumbnail={row?.thumbnail} />;
      },
      maxWidth: "100px",
      filterable: false,
      sortable: false,
      defaultShowColumn: true,
    },
    {
      key: "title",
      header: "Title ",
      formatter: titleFormatter,
      maxWidth: "300px",
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
    {
      key: "description",
      header: "Description",
      defaultShowColumn: false,
    },
  ];

  return (
    <div
      className="container-fluid mt-2 mainContainerWidth"
      style={{ paddingBottom: "1rem" }}
    >
      <NewDocumentForm setRefresh={setRefresh} documents={documents} />
      <div className="card rounded p-3">
        {documentsStatus !== 200 ? (
          <div className="m-2">
            <h5>
              {documentsStatus === 204 && "No current documents saved."}
            </h5>
          </div>
        ) : (
          <DokulyTable
            tableName="documents"
            data={documents}
            columns={columns}
            showCsvDownload={true}
            showPagination={true}
            showSearch={true}
            itemsPerPage={100}
            onRowClick={rowEvents.onClick}
            defaultSort={{ columnNumber: 7, order: "desc" }}
            showColumnFilters={true}
            showFilterChips={true}
            showSavedViews={true}
            showColumnSelector={true}
          />
        )}
      </div>
    </div>
  );
}
