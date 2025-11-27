import React, { useState, useEffect, useCallback } from "react";
// Common formatters for document tables.
import { releaseStateFormatter } from "../../dokuly_components/formatters/releaseStateFormatter";
import { ThumbnailFormatter } from "../../dokuly_components/dokulyTable/functions/formatters";

// Temporary imports before custom view is created.
import { getReferenceDocuments, removeReferences } from "../functions/queries";
import { getAssembly } from "../functions/queries";
import { getPcba } from "../functions/queries";
import { getPart } from "../functions/queries";

import { DocumentSearchSelector } from "./addReferenceDocForm";
import DokulyTable from "../../dokuly_components/dokulyTable/dokulyTable";
import { useNavigate } from "react-router";
import DokulyCard from "../../dokuly_components/dokulyCard";
import CardTitle from "../../dokuly_components/cardTitle";

/**
 * # Reference documents Table
 *
 * Insert table for reference documents
 *
 * @param {*} props must contain one of the following props 'asm_id', 'part_id' or 'pcba_id'.
 * @returns a reference document table.
 *
 * ## Example
 *
 * ```js
 * // Import the const.
 * import ReferenceDocumentsTable from "../path_to/referenceDocument";
 * // Call the const with one of the required props.
 * <div>
 *  <ReferenceDocumentsTable asm_id={asmDetailed.asm_id} />
 * </div>
 * ```
 */
const ReferenceDocumentsTable = (props) => {
  // Creates empty array for the reference document table.
  const [documents, setDocuments] = useState([]);
  const [reference_list_id, setReferenceListId] = useState(-1);

  const [asm_obj, setAsmObj] = useState(null);
  const [part_obj, setPartObj] = useState(null);
  const [pcba_obj, setPcbaObj] = useState(null);

  // The document selected in the reference list table.
  const [selected_document_ids, setSelectedDocumentIds] = useState([]);
  // Const used to refresh the loaded data in the table after actions are performed.
  const [refresh, setRefresh] = useState(false);

  const [tableTextSize, setTableTextSize] = useState("16px");

  const navigate = useNavigate();

  // Function to fetch reference documents
  const fetchReferenceDocuments = useCallback(() => {
    if (
      reference_list_id !== null &&
      reference_list_id !== -1 &&
      reference_list_id !== undefined
    ) {
      getReferenceDocuments(reference_list_id).then((res) => {
        if (res?.data) {
          setDocuments(res.data);
        }
      });
    } else if (reference_list_id === -1) {
      setDocuments([]);
    }
  }, [reference_list_id]);

  // Fetch the reference documents when reference_list_id changes.
  useEffect(() => {
    fetchReferenceDocuments();
  }, [fetchReferenceDocuments]);

  // Handle refresh trigger
  useEffect(() => {
    if (refresh) {
      fetchReferenceDocuments();
      setRefresh(false);
    }
  }, [refresh, fetchReferenceDocuments]);

  function get_reference_list_id(target_obj) {
    if (target_obj !== null && target_obj !== undefined) {
      if (
        target_obj.reference_list_id !== null &&
        target_obj.reference_list_id !== undefined
      ) {
        setReferenceListId(target_obj.reference_list_id);
      }
    }
  }

  // Read out the id of the target object, then fetch their Reference List ID. Only one of the IDs shall have a value.
  const [asm_id, setAsmId] = useState(
    props.asm_id !== null && props.asm_id !== undefined ? props.asm_id : null,
  );
  useEffect(() => {
    if (props?.asm !== null && props?.asm !== undefined) {
      setAsmObj(props.asm);
    } else {
      if (asm_id !== null && asm_id !== undefined) {
        getAssembly(asm_id).then((res) => {
          setAsmObj(res.data);
        });
      }
    }
  }, [props, asm_id, refresh]);

  useEffect(() => {
    if (props?.asm !== null && props?.asm !== undefined) {
      get_reference_list_id(props.asm);
    } else {
      get_reference_list_id(asm_obj);
    }
  }, [props, asm_obj]);

  const [part_id, setPartId] = useState(
    props.part_id !== null && props.part_id !== undefined
      ? props.part_id
      : null,
  );
  useEffect(() => {
    if (part_id !== null && part_id !== undefined) {
      getPart(part_id).then((res) => {
        setPartObj(res.data);
      });
    }
  }, [part_id, refresh]);
  useEffect(() => {
    get_reference_list_id(part_obj);
  }, [part_obj]);

  const [pcba_id, setPcbaId] = useState(
    props.pcba_id !== null && props.pcba_id !== undefined
      ? props.pcba_id
      : null,
  );
  useEffect(() => {
    if (pcba_id !== null && pcba_id !== undefined) {
      getPcba(pcba_id).then((res) => {
        setPcbaObj(res.data);
      });
    }
  }, [pcba_id, refresh]);
  useEffect(() => {
    get_reference_list_id(pcba_obj);
  }, [pcba_obj, refresh]);

  /**
   * Manage a list of selected documents in table.
   *
   * @param {*} row is the object of the particular row.
   * @param {*} isSelect boolean representing the rows selection state (true = selected).
   */
  function handleOnSelect(row, isSelect) {
    if (isSelect) {
      setSelectedDocumentIds([...selected_document_ids, row.id]);
    } else {
      setSelectedDocumentIds(selected_document_ids.filter((x) => x !== row.id));
    }
  }

  /**
   * Remove references from the list.
   * @param {*} document_ids is an array of the documnts to remove.
   */
  function removeReferenceDoc(document_ids) {
    const data = {
      // Fields used by the view.
      asm_id: asm_id,
      part_id: part_id,
      pcba_id: pcba_id,
      // Reference documents to remove.
      reference_document_ids: document_ids,
    };
    if (!confirm("Are you sure you want to remove the selected documents?")) {
      return;
    }
    // Push data to the database
    removeReferences(data)
      .then((res) => {
        if (res.status === 200) {
          // Empty the list of selected documents.
          setSelectedDocumentIds([]);
          // Re-fetch documents from server to ensure sync
          fetchReferenceDocuments();
        }
      })
      .catch((err) => {
        console.error("Error removing reference documents:", err);
      });
  }

  const handleOnClick = (rowIndex, row) => {
    if (event.ctrlKey || event.metaKey) {
      // Checks for Ctrl or Cmd

      window.open(`/#/documents/${row.id}`, "_blank");
    } else {
      // Normal click logic here, if needed
    }
  };

  const onDoubleClick = (rowIndex, row) => {
    // window.open(`/#/documents/${row.id}`);
    navigate(`/documents/${row.id}`);
  };

  const selectRow = {
    mode: "checkBox",
    clickToSelect: true,
    onSelect: handleOnSelect,
    hideSelectAll: true,
    style: { background: "#def3ff" },
  };

  /**
   * Interpret boolean value as Yes/No in the table.
   */
  function formatYesNo(row, index) {
    return row.is_specification === 0 ? "No" : "Yes";
  }

  const onNavigate = (row) => {
    navigate(`/documents/${row.id}`);
  };

  // Table columns.
  const columns = [
    {
      key: "full_doc_number",
      header: "Document number",
      //formatter: numberFormatter,
    },
    {
      key: "thumbnail",
      header: "",
      formatter: (row) => {
        return <ThumbnailFormatter thumbnail={row?.thumbnail} />;
      },
      maxWidth: "100px",
      includeInCsv: false,
    },
    {
      key: "title",
      header: "Title ",
    },
    {
      key: "project_name",
      header: "Project",
    },
    {
      key: "release_state",
      header: "State",

      formatter: releaseStateFormatter,
    },
    {
      key: "is_specification",
      header: "Specification",

      formatter: formatYesNo,
    },
    {
      header: "Remove",
      formatter: (row) => {
        return (
          <button
            type="button"
            className="btn btn-dokuly-transparent"
            style={{ height: "2.4rem", maxHeight: "2.4rem" }}
            onClick={() => removeReferenceDoc([row.id])}
          >
            <img
              className="icon-dark"
              src="../../static/icons/trash.svg"
              alt="trash"
            />
          </button>
        );
      },
    },
  ];

  return (
    <DokulyCard>
      <CardTitle titleText={"Reference documents"} optionalHelpText={
        "Documents related to the item. Can be specifications, docuemntation, processes etc."} />

      <div style={{ leftMargin: "15px" }}>
        <DocumentSearchSelector
          asm_id={asm_id}
          part_id={part_id}
          pcba_id={pcba_id}
          setRefresh={setRefresh}
        />
      </div>

      <div style={{ leftMargin: "15px" }}>
        <DokulyTable
          key={`ref-docs-table-${documents.map((d) => d.id).join("-")}`}
          tableName={"ReferenceDocumentsTable"}
          data={documents}
          columns={columns}
          showCsvDownload={false}
          showPagination={false}
          showSearch={false}
          onRowClick={handleOnClick}
          onRowDoubleClick={onDoubleClick}
          textSize={tableTextSize}
          setTextSize={setTableTextSize}
          showTableSettings={true}
          navigateColumn={true}
          onNavigate={(row) => onNavigate(row)}
        />
      </div>
    </DokulyCard>
  );
};

export default ReferenceDocumentsTable;
