import React, { useState, useEffect } from "react";
import DokulyTable from "../../dokuly_components/dokulyTable/dokulyTable";
import { getDocumentsByIds } from "../functions/queries";
import { releaseStateFormatter } from "../../dokuly_components/formatters/releaseStateFormatter";
import { Card } from "react-bootstrap";

const ReferencedDocumentsTable = (props) => {
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    if (
      props?.document.referenced_documents &&
      props?.document.referenced_documents.length
    ) {
      getDocumentsByIds(props.document.referenced_documents).then((res) => {
        if (res.status === 200) {
          setDocuments(res.data);
        }
      });
    } else {
      setDocuments([]);
    }
  }, [props.document.referenced_documents]);

  const columns = [
    {
      key: "full_doc_number",
      header: "Document Number",
    },
    {
      key: "title",
      header: "Title",
    },
    {
      key: "release_state",
      header: "State",
      formatter: (row, cell) => releaseStateFormatter(cell, row),
    },
  ];

  // Handle row click
  const handleRowClick = (index) => {
    const selectedDocument = documents[index];
    window.open(`/#/documents/${selectedDocument.id}`);
  };

  return (
    <Card className="rounded-3 border-0 shadow-none">
      <Card.Body>
        <Card.Title>References</Card.Title>
        <DokulyTable
          data={documents}
          columns={columns}
          itemsPerPage={50}
          onRowClick={handleRowClick}
          showPagination={true}
          showSearch={false}
        />
      </Card.Body>
    </Card>
  );
};

export default ReferencedDocumentsTable;
