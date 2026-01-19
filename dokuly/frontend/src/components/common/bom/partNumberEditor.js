import React, { useState, useEffect, useRef } from "react";
import { editBomItem, removeBomItem } from "./functions/queries";
import { toast } from "react-toastify";
import GlobalPartSelection from "../../dokuly_components/globalPartSelector/globalPartSelection";
import DokulyModal from "../../dokuly_components/dokulyModal";
import SubmitButton from "../../dokuly_components/submitButton";
import CancelButton from "../../dokuly_components/cancelButton";

function not_latest_rev_warning(item) {
  return item?.is_latest_revision === false ? (
    <span>
      <img
        src="../../../static/icons/alert-circle.svg"
        className="ml-2"
        style={{
          filter:
            "invert(42%) sepia(72%) saturate(6100%) hue-rotate(1deg) brightness(101%) contrast(107%)",
        }}
        alt="alert"
        data-toggle="tooltip"
        data-placement="top"
        title="A newer revision of this item exists!"
        height="40px"
        width="40px"
      />
    </span>
  ) : (
    ""
  );
}

const PartNumberEditor = ({
  row,
  is_locked_bom,
  setRefreshBom,
  setExpandCol,
  organization,
  className = "d-flex w-100",
  innerClassName = "w-100",
  style = { minWidth: "200px" },
  autoFocus = false,
  onFocusApplied = () => {},
  allBomItems = [],
  onDuplicateFound = null,
  designatorHeader = "F/N",
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [selected_item, setSelectedItem] = useState(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateItem, setDuplicateItem] = useState(null);
  const [pendingItem, setPendingItem] = useState(null);
  const [isProcessingDuplicate, setIsProcessingDuplicate] = useState(false);

  const globalPartSelectionRef = useRef(null);
  const editorRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (autoFocus && !is_locked_bom && !isEditing) {
      setIsEditing(true);
      setExpandCol(true);
      onFocusApplied();

      // Scroll into view
      if (editorRef.current) {
        editorRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }
  }, [autoFocus, is_locked_bom, isEditing, setExpandCol, onFocusApplied]);

  // Use part_number (raw number) to search for all revisions, not full_part_number
  const searchTerm = row.part_number
    ? row.part_number.toString()
    : row.temporary_mpn;

  useEffect(() => {
    // Don't process if we're already handling a duplicate or if modal is showing
    if (selected_item && !isProcessingDuplicate && !showDuplicateModal) {
      // Check if this item already exists in the BOM (excluding the current row)
      const idField =
        {
          Part: "part",
          PCBA: "pcba",
          Assembly: "assembly",
        }[selected_item.item_type] || "item_id";

      const existingItem = allBomItems.find(
        (item) =>
          item.id !== row.id && // Exclude the current row
          item[idField] === selected_item.id
      );

      if (existingItem && onDuplicateFound) {
        // Item already exists, show modal to confirm
        setDuplicateItem(existingItem);
        setPendingItem(selected_item);
        setShowDuplicateModal(true);
        setIsEditing(false);
        setExpandCol(false);
        // Highlight the existing row
        onDuplicateFound(existingItem.id);
        return;
      }

      // Item doesn't exist, proceed with normal flow
      const data = { [idField]: selected_item.id };

      editBomItem(row.id, data)
        .then((response) => {
          toast.success("Designator updated");
          setIsEditing(false);
          setExpandCol(false);
          setRefreshBom(true);
        })
        .catch((error) => {
          toast.error(`Error updating designator: ${error.message}`);
        });
    }
  }, [selected_item, row.id, setExpandCol, setRefreshBom, allBomItems, onDuplicateFound, isProcessingDuplicate, showDuplicateModal]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsEditing(false);
        setExpandCol(false);
      }
    };

    // Add event listener for the Escape key
    document.addEventListener("keydown", handleKeyDown);

    // Cleanup the event listener
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [setExpandCol]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        editorRef.current &&
        !editorRef.current.contains(event.target) &&
        globalPartSelectionRef.current &&
        !globalPartSelectionRef.current.contains(event.target)
      ) {
        setIsEditing(false);
        setExpandCol(false);
      }
    }

    // Bind the event listener
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      // Unbind the event listener on clean up
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [setExpandCol]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  function get_display_string() {
    if (!(row.part || row.assembly || row.pcba)) {
      return "-";
    }

    // Format part number with proper revision handling based on organization settings
    let formattedPartNumber = "";
    if (row?.full_part_number) {
      formattedPartNumber = row.full_part_number;
    } else if (isEditing) {
      formattedPartNumber = "";
    } else {
      formattedPartNumber = "Unknown";
    }

    const displayPartNumber = formattedPartNumber ? (
      <React.Fragment>
        {formattedPartNumber} {not_latest_rev_warning(row)}
      </React.Fragment>
    ) : (
      formattedPartNumber
    );

    return displayPartNumber;
  }

  // Display "-" when designator is empty and not editing
  const displayPartNumber = get_display_string();

  const handleConfirmDuplicate = () => {
    // User wants to add the duplicate, proceed with normal flow
    // Set flag to prevent useEffect from re-triggering
    setIsProcessingDuplicate(true);
    // Clear selected_item FIRST to prevent useEffect from re-triggering when BOM refreshes
    setSelectedItem(null);
    setShowDuplicateModal(false);
    setDuplicateItem(null);
    
    if (pendingItem) {
      const idField =
        {
          Part: "part",
          PCBA: "pcba",
          Assembly: "assembly",
        }[pendingItem.item_type] || "item_id";

      const data = { [idField]: pendingItem.id };
      const itemToAdd = pendingItem;
      // Clear pendingItem after storing it in a local variable
      setPendingItem(null);

      editBomItem(row.id, data)
        .then((response) => {
          toast.success("Item added to BOM");
          setIsEditing(false);
          setExpandCol(false);
          setRefreshBom(true);
          // Reset flag after successful addition
          setIsProcessingDuplicate(false);
        })
        .catch((error) => {
          toast.error(`Error adding item: ${error.message}`);
          // Reset flag on error too
          setIsProcessingDuplicate(false);
        });
    } else {
      setPendingItem(null);
      setIsProcessingDuplicate(false);
    }
  };

  const handleCancelDuplicate = () => {
    // User doesn't want to add duplicate or modal was closed, delete the empty row
    // Reset the selected item to prevent it from being processed again
    setSelectedItem(null);
    setShowDuplicateModal(false);
    setDuplicateItem(null);
    setPendingItem(null);
    setIsEditing(false);
    setExpandCol(false);
    setIsProcessingDuplicate(false);
    
    // Delete the temporary entry
    removeBomItem(row.id)
      .then(() => {
        toast.info("Duplicate entry cancelled");
        setRefreshBom(true);
      })
      .catch((error) => {
        toast.error(`Error removing item: ${error.message}`);
        setRefreshBom(true);
      });
  };

  return (
    <>
      <div ref={editorRef} className={className} style={{ ...style }}>
        {is_locked_bom ? (
          <span>{displayPartNumber}</span>
        ) : isEditing ? (
          <div ref={globalPartSelectionRef}>
            <GlobalPartSelection
              searchTerm={searchTerm}
              setSelectedItem={setSelectedItem}
              organization={organization}
            />
          </div>
        ) : (
          // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
          <div
            className={innerClassName}
            onClick={() => {
              setIsEditing(true);
              setExpandCol(true);
            }}
          >
            {displayPartNumber}
          </div>
        )}
      </div>
      <DokulyModal
        show={showDuplicateModal}
        onHide={handleCancelDuplicate}
        title="Duplicate Item Detected"
      >
        <div className="p-3">
          <p>
            This part already exists in the BOM {designatorHeader}:{" "}
            <strong>{duplicateItem?.designator || "N/A"}</strong>
          </p>
          <p>Would you still like to add the duplicate?</p>
          <div className="d-flex justify-content-start mt-3">
            <SubmitButton className="mr-2" onClick={handleConfirmDuplicate}>
              Yes, Add Duplicate
            </SubmitButton>
            <CancelButton onClick={handleCancelDuplicate}>
              No, Cancel
            </CancelButton>
          </div>
        </div>
      </DokulyModal>
    </>
  );
};

export default PartNumberEditor;
