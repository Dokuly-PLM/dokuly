import React, { useState, useEffect, useRef } from "react";
import GlobalPartSelection from "../../globalPartSelector/globalPartSelection";

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

const InlineItemSelector = ({ 
  row, 
  readOnly, 
  onSelectItem, 
  searchTerm,
  includeTables = ["parts", "pcbas", "assemblies"],
  latestOnly = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [selected_item, setSelectedItem] = useState(null);

  const globalPartSelectionRef = useRef(null);
  const editorRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (selected_item) {
      onSelectItem(row.id, selected_item);
      setIsEditing(false);
    }
  }, [selected_item, row.id, onSelectItem]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsEditing(false);
      }
    };

    // Add event listener for the Escape key
    document.addEventListener("keydown", handleKeyDown);

    // Cleanup the event listener
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        editorRef.current &&
        !editorRef.current.contains(event.target) &&
        globalPartSelectionRef.current &&
        !globalPartSelectionRef.current.contains(event.target)
      ) {
        setIsEditing(false);
      }
    }

    // Bind the event listener
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      // Unbind the event listener on clean up
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [editorRef, globalPartSelectionRef]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  function get_display_string() {
    if (!(row.part || row.assembly || row.pcba || row.document)) {
      return "-";
    }

    const displayPartNumber =
      row?.full_part_number || row?.full_doc_number || row?.revision ? (
        <React.Fragment>
          {row?.full_part_number || row?.full_doc_number}{" "}
          {not_latest_rev_warning(row)}
        </React.Fragment>
      ) : isEditing ? (
        ""
      ) : (
        "Unknown"
      );

    return displayPartNumber;
  }

  const displayPartNumber = get_display_string();

  return (
    <div ref={editorRef} className="d-flex w-100" style={{ minWidth: "200px" }}>
      {readOnly ? (
        <span>{displayPartNumber}</span>
      ) : isEditing ? (
        <div ref={globalPartSelectionRef}>
          <GlobalPartSelection
            searchTerm={searchTerm}
            setSelectedItem={setSelectedItem}
            includeTables={includeTables}
            latestOnly={latestOnly}
          />
        </div>
      ) : (
        <div className="w-100" onClick={() => setIsEditing(true)}>
          {displayPartNumber}
        </div>
      )}
    </div>
  );
};

export default InlineItemSelector;
