import React from "react";
import DokulyImage from "../../dokuly_components/dokulyImage";

export const paginationOptions = (sizePerPage) => {
  return {
    paginationSize: 1,
    pageStartIndex: 0,
    alwaysShowAllBtns: true,
    withFirstAndLast: false,
    hideSizePerPage: true,
    hidePageListOnlyOnePage: true,
    showTotal: true,
    disablePageTitle: true,
    sizePerPageList: [sizePerPage],
  };
};

/**
 * Return archive list constants, including table, fields, formatters etc.
 * Makes the file using the bootstrap tables for archived objects more generic, can be reused elsewhere.
 * @param {any} users - Saved users, in JSON format.
 * @param {any} projects - Saved projects, in JSON format.
 * @param {any} customers - Saved customers, in JSON format.
 * @return {array} The current bootstrap tables for archive lists.
 *
 * NOTE: Data for the domain is not passed here, only connected data needed for formatters
 * Data is passed in the components that define the bootstrap table.
 *
 * @example
  let columns = []
  let someColumn = { ... }
  columns.push(someColumn)
  let domain = domains(archivedUsers, null, null, null)
  let tableCols = null
  for(let i = 0; i < domain.length; i++) {
    if(domain[i].domainName === "Users"){
      tableCols = domain[i].tableColumns
      break
    }
  }
  // Now we can use tableCols in a bootstrap next table.
  // Can also be used as states, see adminArchive.js for example.
 */
export const domains = (users, projects, customers) => {
  let retArr = [];
  let projectsDomain = null;
  let documentsDomain = null;
  if (customers !== null && customers !== undefined) {
    projectsDomain = {
      domainName: "Projects",
      tableColumns: [
        {
          dataField: "project_number",
          text: "Project_number",
          sort: true,
          style: {
            minWidth: "4rem",
          },
        },
        {
          dataField: "title",
          text: "Title",
          sort: true,
          style: {
            minWidth: "5rem",
          },
        },
        {
          dataField: "customer",
          text: "Customer",
          sort: true,
          formatter: (cell, row) => {
            if (row !== null && row !== undefined) {
              if (
                customers !== null &&
                customers !== undefined &&
                customers?.length > 0
              ) {
                for (let i = 0; i < customers.length; i++) {
                  if (parseInt(row.customer) == parseInt(customers[i].id)) {
                    return <span>{customers[i].name}</span>;
                  }
                }
              }
            }
          },
          style: {
            minWidth: "5rem",
          },
        },
        {
          dataField: "archived_date",
          text: "Archive date",
          sort: true,
          style: {
            minWidth: "5rem",
          },
        },
      ],
    };
  }
  if (
    customers !== null &&
    customers !== undefined &&
    projects !== null &&
    projects !== undefined
  ) {
    documentsDomain = {
      domainName: "Documents",
      tableColumns: [
        {
          dataField: "full_doc_number",
          text: "Document number",
          sort: true,
          formatter: (cell, row) => {
            if (
              row?.full_doc_number !== undefined &&
              row?.full_doc_number !== null
            ) {
              return row?.full_doc_number;
            }
          },
          style: {
            minWidth: "4rem",
          },
        },
        {
          dataField: "title",
          text: "Title",
          sort: true,
          style: {
            minWidth: "8rem",
          },
        },
        {
          dataField: "project",
          text: "Project",
          sort: true,
          formatter: (cell, row) => {
            if (row !== null && row !== undefined) {
              if (
                projects !== null &&
                projects !== undefined &&
                projects?.length > 0
              ) {
                for (let i = 0; i < projects.length; i++) {
                  if (parseInt(row.project) == parseInt(projects[i].id)) {
                    for (let j = 0; j < customers.length; j++) {
                      if (parseInt(customers[j].id) == projects[i].customer) {
                        return (
                          <span>
                            {customers[j].customer_id}
                            {projects[i].project_number}
                            {" - "}
                            {projects[i].title}
                          </span>
                        );
                      }
                    }
                    return (
                      <span>
                        {projects[i].project_number}
                        {"-"}
                        {projects[i].title}
                      </span>
                    );
                  }
                }
              }
            }
          },
          style: {
            minWidth: "7rem",
          },
        },
        {
          dataField: "archived_date",
          text: "Archive date",
          sort: true,
          style: {
            minWidth: "5rem",
          },
        },
      ],
    };
  }
  const imageFilesDomain = {
    domainName: "Images",
    tableColumns: [
      {
        dataField: "preview",
        text: "Preview",
        sort: true,
        formatter: (cell, row) => {
          if (row?.uri) {
            return (
              <DokulyImage src={`${row.uri}`} width="40px" height="40px" />
            );
          }
        },
        style: {
          minWidth: "5rem",
        },
      },
      {
        dataField: "image_name",
        text: "Image name",
        sort: true,
        style: {
          minWidth: "15rem",
        },
      },
      {
        dataField: "download_count",
        text: "Download count",
        sort: true,
        style: {
          minWidth: "5rem",
        },
      },
      {
        dataField: "archived_date",
        text: "Archive date",
        sort: true,
        style: {
          minWidth: "10rem",
        },
      },
    ],
  };
  const documentPrefixDomain = {
    domainName: "Document Prefixes",
    tableColumns: [
      {
        dataField: "display_name",
        text: "Display name",
        sort: true,
        style: {
          minWidth: "10rem",
        },
      },
      {
        dataField: "prefix",
        text: "Prefix",
        sort: true,
        style: {
          minWidth: "4rem",
        },
      },
      {
        dataField: "archived_date",
        text: "Archive date",
        sort: true,
        style: {
          minWidth: "10rem",
        },
      },
    ],
  };
  const locationDomain = {
    domainName: "Locations",
    tableColumns: [
      {
        dataField: "name",
        text: "Display name",
        sort: true,
        style: {
          minWidth: "10rem",
        },
      },
      {
        dataField: "container_type",
        text: "Type",
        sort: true,
      },
      {
        dataField: "archived_date",
        text: "Archive date",
        sort: true,
        style: {
          minWidth: "10rem",
        },
      },
    ],
  };
  const locationTypeDomain = {
    domainName: "Location types",
    tableColumns: [
      {
        dataField: "display_name",
        text: "Display name",
        sort: true,
        style: {
          minWidth: "10rem",
        },
      },
      {
        dataField: "description",
        text: "Description",
        formatter: (cell, row) => {
          if (row?.description !== null && row?.description !== undefined) {
            if (row?.description?.length > 100) {
              return row.description.slice(0, 100);
            }
            return row.description;
          }
          return "No Description";
        },
      },
      {
        dataField: "archived_date",
        text: "Archive date",
        sort: true,
        style: {
          minWidth: "10rem",
        },
      },
    ],
  };
  imageFilesDomain !== null && retArr.push(imageFilesDomain);
  locationDomain !== null && retArr.push(locationDomain);
  locationTypeDomain !== null && retArr.push(locationTypeDomain);
  documentsDomain !== null && retArr.push(documentsDomain);
  projectsDomain !== null && retArr.push(projectsDomain);
  documentPrefixDomain !== null && retArr.push(documentPrefixDomain);
  return retArr;
};
