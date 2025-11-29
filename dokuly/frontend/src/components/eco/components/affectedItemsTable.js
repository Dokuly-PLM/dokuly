import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

import DokulyTable from "../../dokuly_components/dokulyTable/dokulyTable";
import DokulyCard from "../../dokuly_components/dokulyCard";
import CardTitle from "../../dokuly_components/cardTitle";
import { thumbnailFormatter } from "../../dokuly_components/formatters/thumbnailFormatter";
import { releaseStateFormatter } from "../../dokuly_components/formatters/releaseStateFormatter";
import {
  getAffectedItems,
  addAffectedItem,
  editAffectedItem,
  deleteAffectedItem,
} from "../functions/queries";
import InlineItemSelector from "../../dokuly_components/dokulyTable/components/inlineItemSelector";

const AffectedItemsTable = ({ ecoId, isReleased = false, readOnly = false }) => {
  const navigate = useNavigate();

  const [affectedItems, setAffectedItems] = useState([]);
  const [refresh, setRefresh] = useState(true);
  const [loading, setLoading] = useState(false);

  const isLocked = isReleased || readOnly;

  // Fetch affected items
  const fetchAffectedItems = useCallback(() => {
    if (!ecoId) return;

    setLoading(true);
    getAffectedItems(ecoId)
      .then((res) => {
        if (res.status === 200) {
          // Transform data for table display
          const items = res.data.map((item) => {
            // Determine which item type is attached
            const linkedItem = item.part || item.pcba || item.assembly || item.document;
            return {
              id: item.id,
              eco: item.eco,
              part: item.part,
              pcba: item.pcba,
              assembly: item.assembly,
              document: item.document,
              comment: item.comment,
              created_at: item.created_at,
              // Flattened fields for display
              full_part_number: linkedItem?.full_part_number || linkedItem?.full_doc_number || "",
              display_name: linkedItem?.display_name || linkedItem?.title || "",
              release_state: linkedItem?.release_state || "",
              thumbnail: linkedItem?.thumbnail,
              image_url: linkedItem?.image_url,
              is_latest_revision: linkedItem?.is_latest_revision,
              item_type: item.part
                ? "Part"
                : item.pcba
                ? "PCBA"
                : item.assembly
                ? "Assembly"
                : item.document
                ? "Document"
                : "",
            };
          });
          setAffectedItems(items);
        }
      })
      .catch((err) => {
        toast.error("Failed to load affected items");
      })
      .finally(() => {
        setLoading(false);
        setRefresh(false);
      });
  }, [ecoId]);

  useEffect(() => {
    if (refresh) {
      fetchAffectedItems();
    }
  }, [refresh, fetchAffectedItems]);

  useEffect(() => {
    fetchAffectedItems();
  }, [ecoId, fetchAffectedItems]);

  // Add new item row
  const handleAddItem = () => {
    if (!ecoId) return;

    addAffectedItem(ecoId)
      .then((res) => {
        if (res.status === 201) {
          setRefresh(true);
          toast.success("Added new affected item row");
        }
      })
      .catch((err) => {
        toast.error("Failed to add affected item");
      });
  };

  // Handle item selection from global search
  const handleSelectItem = useCallback(
    (rowId, selectedItem) => {
      if (!selectedItem) return;

      // Determine item type from the item_type field set by GlobalSearch serializers
      let data = {};
      const itemType = selectedItem.item_type;

      if (itemType === "Part") {
        data = { part_id: selectedItem.id };
      } else if (itemType === "PCBA") {
        data = { pcba_id: selectedItem.id };
      } else if (itemType === "Assembly") {
        data = { assembly_id: selectedItem.id };
      } else if (itemType === "Document") {
        data = { document_id: selectedItem.id };
      } else {
        // Fallback detection based on other fields
        if (selectedItem.part_type !== undefined) {
          data = { part_id: selectedItem.id };
        } else if (selectedItem.full_doc_number !== undefined) {
          data = { document_id: selectedItem.id };
        } else {
          // Default to part
          data = { part_id: selectedItem.id };
        }
      }

      editAffectedItem(rowId, data)
        .then((res) => {
          if (res.status === 200) {
            setRefresh(true);
          }
        })
        .catch((err) => {
          toast.error("Failed to attach item");
        });
    },
    []
  );

  // Handle row deletion
  const handleDeleteRow = (rowId) => {
    if (!confirm("Are you sure you want to remove this affected item?")) {
      return;
    }

    deleteAffectedItem(rowId)
      .then((res) => {
        if (res.status === 204) {
          setRefresh(true);
          toast.success("Affected item removed");
        }
      })
      .catch((err) => {
        toast.error("Failed to remove affected item");
      });
  };

  // Navigate to item
  const handleRowClick = (row) => {
    if (row.part) {
      navigate(`/parts/${row.part.id}`);
    } else if (row.pcba) {
      navigate(`/pcbas/${row.pcba.id}`);
    } else if (row.assembly) {
      navigate(`/assemblies/${row.assembly.id}`);
    } else if (row.document) {
      navigate(`/documents/${row.document.id}`);
    }
  };

  // Table columns
  const columns = [
    {
      key: "thumbnail",
      header: "",
      formatter: (row) => thumbnailFormatter(row),
      maxWidth: "60px",
    },
    {
      key: "full_part_number",
      header: "Item Number",
      formatter: (row) => (
        <InlineItemSelector
          row={row}
          readOnly={isLocked}
          onSelectItem={handleSelectItem}
          searchTerm={row.temporary_mpn || ""}
          includeTables={["parts", "pcbas", "assemblies", "documents"]}
        />
      ),
    },
    {
      key: "display_name",
      header: "Display Name",
    },
    {
      key: "item_type",
      header: "Type",
      maxWidth: "100px",
    },
    {
      key: "release_state",
      header: "State",
      formatter: (row) => releaseStateFormatter(row),
      maxWidth: "120px",
    },
    {
      key: "actions",
      header: "",
      formatter: (row) =>
        !isLocked && (
          <button
            type="button"
            className="btn btn-sm btn-bg-transparent"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteRow(row.id);
            }}
            title="Remove item"
          >
            <img
              className="icon-dark"
              src="../../static/icons/trash.svg"
              alt="delete"
              width={20}
            />
          </button>
        ),
      maxWidth: "50px",
    },
  ];

  return (
    <DokulyCard>
      <CardTitle
        titleText="Affected Items"
        optionalHelpText="Items that are affected by this engineering change order. Attach the new (changed) revision of parts, PCBAs, assemblies, or documents."
      />

      {/* Add Item Button */}
      {!isLocked && (
        <button
          type="button"
          className="btn dokuly-bg-transparent ml-2 mb-2"
          onClick={handleAddItem}
          title="Add an affected item row"
        >
          <div className="row">
            <img
              className="icon-dark"
              src="../../static/icons/circle-plus.svg"
              alt="add"
            />
            <span className="btn-text">Add item</span>
          </div>
        </button>
      )}

      {affectedItems.length > 0 ? (
        <DokulyTable
          data={affectedItems}
          columns={columns}
          showCsvDownload={false}
          showPagination={false}
          showSearch={false}
          onRowClick={(row) => {
            if (row.part || row.pcba || row.assembly || row.document) {
              handleRowClick(row);
            }
          }}
          itemsPerPage={100}
        />
      ) : (
        <div className="text-muted ml-3 mb-3">
          {isLocked
            ? "No affected items"
            : "No affected items. Click 'Add item' to add items affected by this ECO."}
        </div>
      )}
    </DokulyCard>
  );
};

export default AffectedItemsTable;
