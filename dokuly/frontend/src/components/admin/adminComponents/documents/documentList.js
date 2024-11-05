import React, { useState, useEffect } from "react";
import moment from "moment";
import { toast } from "react-toastify";
import { archiveDocument } from "../../functions/queries";
import DokulyTable from "../../../dokuly_components/dokulyTable/dokulyTable";

const DocumentList = (props) => {
  const [selectedDocument, setSelectedDocument] = useState({});
  const [documents, setDocuments] = useState(props.documents || []);

  useEffect(() => {
    setDocuments(props.documents || []);
  }, [props.documents]);

  const archiveDocumentF = (document) => {
    if (!confirm("Are you sure you want to archive this document?")) return;

    const data = {
      archived: "True",
      archived_date: moment().format("YYYY-MM-DD"),
    };
    archiveDocument(document.id, data)
      .then((res) => {
        setDocuments(res.data.documents);
        props.childToParent({
          newData: true,
          deactivated: true,
          documents: res.data.documents,
          dataSelected: null,
        });
        toast.success("Document archived successfully");
      })
      .catch(() => {
        toast.error("Error archiving document");
      });
  };

  const handleRowClick = (index) => {
    const document = documents[index];
    if (document && document.is_active !== "false") {
      setSelectedDocument(document);
      props.childToParent({ newSelected: true, data: document });
    } else {
      toast.info("Cannot select a deactivated document! Activate it first.");
    }
  };

  const columns = [
    {
      key: "document_number",
      header: "ID",
      formatter: (row) => row.full_doc_number || row.document_number,
    },
    {
      key: "title",
      header: "Title",
    },
    {
      key: "release_state",
      header: "State",
    },
    {
      key: "actions",
      header: "Actions",
      formatter: (row) => (
        <div>
          <button
            className="btn dokuly-btn-transparent btn-sm m-1"
            onClick={() => archiveDocumentF(row)}
          >
            Archive
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="card-body bg-white m-3 card rounded">
      <h5>
        <b>Documents</b>
      </h5>
      {documents && documents.length > 0 ? (
        <DokulyTable
          data={documents}
          columns={columns}
          onRowClick={handleRowClick}
          showCsvDownload={true}
          showPagination={true}
          itemsPerPage={10}
          showSearch={true}
        />
      ) : (
        <div>No documents found.</div>
      )}
    </div>
  );
};

export default DocumentList;
