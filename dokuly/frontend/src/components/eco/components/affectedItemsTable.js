import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

import DokulyTable from "../../dokuly_components/dokulyTable/dokulyTable";
import DokulyCard from "../../dokuly_components/dokulyCard";
import CardTitle from "../../dokuly_components/cardTitle";
import { thumbnailFormatter } from "../../dokuly_components/formatters/thumbnailFormatter";
import { releaseStateFormatter } from "../../dokuly_components/formatters/releaseStateFormatter";
import TextFieldEditor from "../../dokuly_components/dokulyTable/components/textFieldEditor";
import {
  getAffectedItems,
  addAffectedItem,
  editAffectedItem,
  deleteAffectedItem,
} from "../functions/queries";
import InlineItemSelector from "../../dokuly_components/dokulyTable/components/inlineItemSelector";

const AffectedItemsTable = ({ ecoId, isReleased = false, readOnly = false, onAffectedItemsChange = null }) => {
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
              description: item.description || "",
              created_at: item.created_at,
              // Flattened fields for display
              full_part_number: linkedItem?.full_part_number || linkedItem?.full_doc_number || "",
              display_name: linkedItem?.display_name || linkedItem?.title || "",
              release_state: linkedItem?.release_state || "",
              thumbnail: linkedItem?.thumbnail,
              image_url: linkedItem?.image_url,
              is_latest_revision: linkedItem?.is_latest_revision,
              revision_notes: linkedItem?.revision_notes || "",
              quality_assurance_id: linkedItem?.quality_assurance_id || null,
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
          // Notify parent of affected items change
          if (onAffectedItemsChange) {
            onAffectedItemsChange(items);
          }
        }
      })
      .catch((err) => {
        toast.error("Failed to load affected items");
      })
      .finally(() => {
        setLoading(false);
        setRefresh(false);
      });
  }, [ecoId, onAffectedItemsChange]);

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

  // Handle description change
  const handleDescriptionChange = useCallback((rowId, newDescription) => {
    editAffectedItem(rowId, { description: newDescription })
      .then((res) => {
        if (res.status === 200) {
          setRefresh(true);
        }
      })
      .catch((err) => {
        toast.error("Failed to update description");
      });
  }, []);

  // Get URL for an affected item
  const getItemUrl = (row) => {
    if (row.part) {
      return `/parts/${row.part.id}`;
    } else if (row.pcba) {
      return `/pcbas/${row.pcba.id}`;
    } else if (row.assembly) {
      return `/assemblies/${row.assembly.id}`;
    } else if (row.document) {
      return `/documents/${row.document.id}`;
    }
    return null;
  };

  // Navigate to item (for arrow button)
  const onNavigate = (row) => {
    const url = getItemUrl(row);
    if (url) {
      navigate(url);
    }
  };

  // Handle row click - only ctrl+click navigates, normal click does nothing
  const handleRowClick = (rowId, row, event) => {
    const url = getItemUrl(row);
    if (!url) return;

    // Only navigate on ctrl+click or cmd+click
    if (event?.ctrlKey || event?.metaKey) {
      window.open(`#${url}`, "_blank");
    }
    // Normal click does nothing - allows inline editing
  };

  // Table columns
  const columns = [
    {
      key: "item",
      header: "Item",
      maxWidth: "180px",
      formatter: (row) => {
        // If no item attached yet, show the inline selector
        if (!row.part && !row.pcba && !row.assembly && !row.document) {
          return (
            <InlineItemSelector
              row={row}
              readOnly={isLocked}
              onSelectItem={handleSelectItem}
              searchTerm=""
              includeTables={["parts", "pcbas", "assemblies", "documents"]}
            />
          );
        }
        // Show compressed view: thumbnail + part number above, display name below
        return (
          <div className="d-flex align-items-center">
            <div style={{ marginRight: "10px" }}>
              {thumbnailFormatter(row)}
            </div>
            <div>
              <div style={{ fontWeight: "bold", marginBottom: "2px" }}>
                {row.full_part_number || "-"}
              </div>
              <div style={{ fontSize: "0.875rem", color: "#6c757d" }}>
                {row.display_name || "-"}
              </div>
              <div style={{ fontSize: "0.75rem", color: "#6c757d", marginTop: "2px" }}>
                {row.item_type}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: "description",
      header: "Description",
      formatter: (row, column, searchString) => (
        <TextFieldEditor
          text={row?.description}
          setText={(newText) => handleDescriptionChange(row.id, newText)}
          multiline={true}
          searchString={searchString}
          readOnly={isLocked}
        />
      ),
    },
    {
      key: "revision_notes",
      header: "Revision Notes",
      formatter: (row) => (
        <div style={{ 
          fontSize: "0.875rem", 
          color: "#6c757d",
          maxWidth: "200px",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}>
          {row.revision_notes || "-"}
        </div>
      ),
    },
    {
      key: "release_state",
      header: "State",
      formatter: (row) => releaseStateFormatter(row),
      maxWidth: "100px",
    },
    {
      key: "reviewed",
      header: "Reviewed",
      maxWidth: "80px",
      formatter: (row) => {
        // Only show checkbox if there's a linked item
        if (!row.part && !row.pcba && !row.assembly && !row.document) {
          return null;
        }
        const isReviewed = row.quality_assurance_id != null;
        return (
          <div className="d-flex justify-content-center">
            <input
              type="checkbox"
              checked={isReviewed}
              disabled
              style={{ 
                width: "18px", 
                height: "18px",
                cursor: "default",
                accentColor: isReviewed ? "#28a745" : undefined,
              }}
              title={isReviewed ? "Item has been reviewed" : "Item not yet reviewed"}
            />
          </div>
        );
      },
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
          onRowClick={handleRowClick}
          navigateColumn={true}
          onNavigate={onNavigate}
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
