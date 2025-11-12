import React, { useState, useEffect } from "react";

import DokulyTable from "../../../dokuly_components/dokulyTable/dokulyTable";

import { editReleaseState, getParts } from "../../../parts/functions/queries";
import { fetchPcbas } from "../../../pcbas/functions/queries";
import GenericDropdownSelector from "../../../dokuly_components/dokulyTable/components/genericDropdownSelector";
import { getUnArchivedAssemblies } from "../../../assemblies/functions/queries";
import { getAllDocuments } from "../../../documents/functions/queries";

const ReleaseStates = ({ setRefresh }) => {
  const [parts, setParts] = useState([]);
  const [pcbas, setPcbas] = useState([]);
  const [assemblies, setAssemblies] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [items, setItems] = useState([]);

  const states = [
    { value: "Draft", label: "Draft" },
    { value: "Review", label: "Review" },
    { value: "Released", label: "Released" },
  ];

  useEffect(() => {
    // Fetch initial data
    getParts().then((response) => {
      if (response.status === 200) {
        setParts(response.data);
      }
    });
    fetchPcbas().then((response) => {
      if (response.status === 200) {
        setPcbas(response.data);
      }
    });
    getUnArchivedAssemblies().then((response) => {
      if (response.status === 200) {
        setAssemblies(response.data);
      }
    });
    getAllDocuments().then((response) => {
      if (response.status === 200) {
        setDocuments(response.data);
      }
    });
  }, []);

  useEffect(() => {
    // Construct items array
    const combinedItems = [
      ...parts.map((part) => ({ ...part, app: "parts" })),
      ...pcbas.map((pcba) => ({ ...pcba, app: "pcbas" })),
      ...assemblies.map((assembly) => ({ ...assembly, app: "assemblies" })),
      ...documents.map((document) => ({ ...document, app: "documents" })),
    ];
    setItems(combinedItems);
  }, [pcbas, parts, assemblies, documents]);

  const handleStateChange = (id, app, newState) => {
    editReleaseState(id, app, newState).then((data) => {
      if (data) {
        setRefresh(true);
      }
    });
  };

  const columns = [
    {
      key: "full_part_number",
      header: "Part number",
      formatter: (row) => {
        if (row.app === "documents") {
          return row.full_doc_number || "N/A";
        }
        
        // Handle parts, pcbas, and assemblies
        const useNumberRevisions = row?.organization?.use_number_revisions || false;
        if (useNumberRevisions) {
          // For number revisions, full_part_number already includes the revision with underscore
          return row.full_part_number;
        }
        // For letter revisions, append the revision to the base part number
        return `${row.full_part_number}${row.revision}`;
      },
    },
    {
      key: "release_state",
      header: "State",
      formatter: (row) => (
        <GenericDropdownSelector
          state={row.release_state}
          setState={(newState) => handleStateChange(row.id, row.app, newState)}
          dropdownValues={states}
          placeholder="Select State"
          borderIfPlaceholder={true}
          textSize="16px"
        />
      ),
    },
    { key: "display_name", header: "Display name", maxWidth: "360px" },
  ];

  return (
    <div className="card-body bg-white m-3 card rounded">
      <h5>
        <b>Release Management</b>
      </h5>
      <p className="text-muted">
        <small>
          This table allows override of release state. <b>Click on a state</b>{" "}
          to change it.
        </small>
      </p>
      <DokulyTable
        data={items}
        columns={columns}
        itemsPerPage={50}
        showSearch={true}
        showPagination={true}
      />
    </div>
  );
};

export default ReleaseStates;
