// Legacy document funcitons

export function makeFullDocumentNumber(customers, projects, document) {
  let customerNumber = "";
  let projectNumber = "";

  projects.map((project) => {
    if (project.id === parseInt(document.project)) {
      projectNumber = project.project_number;
      customers.map((customer) =>
        project.customer === customer.id
          ? (customerNumber = customer.customer_id)
          : "",
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

export function getCustomerID(customers, projects, document) {
  let customerID = 0;
  projects.map((project) => {
    if (project.id === parseInt(document.project)) {
      customers.map((customer) =>
        project.customer === customer.id ? (customerID = customer.id) : "",
      );
    }
  });
  return customerID;
}

export function getCustomerName(customers, projects, document) {
  let customerName = "";
  projects.map((project) => {
    if (project.id === parseInt(document.project)) {
      customers.map((customer) =>
        project.customer === customer.id ? (customerName = customer.name) : "",
      );
    }
  });
  return customerName;
}

export function getProjectName(projects, document) {
  let projectName = "";
  projects.map((project) => {
    if (project.id === parseInt(document.project)) {
      projectName = project.title;
    }
  });
  return projectName;
}

export const documentSearch = (searchString, documents) => {
  let splitSearchString = searchString.replace(/\s/g, "").toLowerCase();
  splitSearchString = splitSearchString.split(",");
  let foundDocuments = [];
  const documentsWithSearchString = [];
  documents.map((document) => {
    document.searchString = document.title;
    if (document?.full_doc_number) {
      document.searchString = document.searchString.concat(
        document.full_doc_number,
      );
    }
    document.searchString = document.searchString.concat(
      document.customer_name,
    );
    document.searchString = document.searchString.concat(document.project_name);
    document.searchString = document.searchString
      .toLowerCase()
      .replace(/\s/g, "");
    documentsWithSearchString.push(document);
  });

  // check if the string has all the terms
  if (searchString !== "") {
    documentsWithSearchString.map((document) => {
      const result = splitSearchString.every((searchTerm) =>
        document.searchString.includes(searchTerm),
      );
      result === true ? foundDocuments.push(document) : "";
    });
  } else {
    foundDocuments = documentsWithSearchString;
  }

  return foundDocuments;
};
