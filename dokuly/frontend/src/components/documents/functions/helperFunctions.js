import { editDocumentInfo } from "../../admin/functions/queries";

export function formatServerURL(url) {
  if (url != null) {
    var n = url.search("8000");
    let str = url.substring(n + 5);

    let formatedString = "../../static/" + str;
    return formatedString;
  }
}

export function getCustomerName(props, document) {
  let customerName = "";
  props.projects.map((project) => {
    if (project.id === parseInt(document.project)) {
      props.customers.map((customer) =>
        project.customer === customer.id ? (customerName = customer.name) : ""
      );
    }
  });
  return customerName;
}

export function getProjectName(props, document) {
  let projectName = "";
  props.projects.map((project) => {
    if (project.id === parseInt(document.project)) {
      projectName = project.title;
    }
  });
  return projectName;
}

export function makeFullDocumentNumber(props, document) {
  let customerNumber = "";
  let projectNumber = "";

  props.projects.map((project) => {
    if (project.id === parseInt(document.project)) {
      projectNumber = project.project_number;
      props.customers.map((customer) =>
        project.customer === customer.id
          ? (customerNumber = customer.customer_id)
          : ""
      );
    }
  });

  let documentNumber =
    document.document_type +
    customerNumber.toString() +
    projectNumber.toString() +
    "-" +
    document.document_number +
    "-" +
    document.revision;
  return documentNumber;
}

export function documentCustomerFilter(projectID, state, props) {
  return props.projects.map((project) => {
    if (project.id == projectID) {
      return project.customer == state.filterCustomer;
    }
  });
}

/**
 * Add project_name and customer_name to documents array.
 *
 * @param {*} documents
 * @param {*} projects
 * @param {*} customers
 * @returns array of documents
 */
export function mapProjectCustomerToDocs(documents, projects, customers) {
  return documents.map((document) => {
    let projectObj = null;

    projects.map((element) => {
      if (element?.id === document?.project) {
        projectObj = element;
        document.project_name = projectObj?.title;
      }
    });

    if (projectObj != null && projectObj.customer != null) {
      customers.map((element) => {
        if (element?.id === projectObj?.customer) {
          document.customer_name = element?.name;
          document.customer_id = element?.id;
        }
      });
    }
    return document;
  });
}

// Returns only the document with the highest revision letter.
// No support for double letter revisions
export function filterOlderRevisions(documents) {
  let temp_docs = [];
  let sortedDocuments = documents.sort((a, b) =>
    a.revision < b.revision ? 1 : -1
  );

  sortedDocuments.map((document) => {
    if (
      temp_docs.some(
        (e) =>
          e.project === document.project &&
          e.document_number === document.document_number
      )
    ) {
    } else {
      temp_docs.push(document);
    }
  });
  return temp_docs;
}

export const updateDocumentField = (id, key, value, setRefresh = () => {}) => {
  if (!id || !key || value === undefined) {
    toast.error("Error updating document.");
    return;
  }

  const data = {
    [key]: value,
    no_data_return: true,
  };

  editDocumentInfo(id, data).then((res) => {
    if (res.status === 201) {
      setRefresh(true);
      toast.success("Document updated");
    } else {
      toast.error(
        "Error updating document. If the problem persists contact support."
      );
    }
  });
};
