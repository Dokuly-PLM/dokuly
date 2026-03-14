import React, { useState, useEffect, useRef } from "react";
import GlobalPartSelection from "../../globalPartSelector/globalPartSelection";
import DokulyImage from "../../dokulyImage";
import { formatCloudImageUri } from "../../../pcbas/functions/productionHelpers";
import ThumbnailHoverZoom from "../../formatters/thumbnailHoverZoom";

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
  ) : null;
}

const InlineItemSelector = ({ 
  row, 
  readOnly, 
  onSelectItem, 
  searchTerm,
  includeTables = ["parts", "pcbas", "assemblies"],
  latestOnly = false,
  showDetailedView = false,
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

  const hasItem = !!(row.part || row.assembly || row.pcba || row.document);

  const renderSimpleDisplay = () => {
    if (!hasItem) return "-";
    return (
      <React.Fragment>
        {row?.full_part_number || row?.full_doc_number || "Unknown"}{" "}
        {not_latest_rev_warning(row)}
      </React.Fragment>
    );
  };

  const renderDetailedDisplay = () => {
    if (!hasItem) {
      return <span style={{ color: "#999" }}>-</span>;
    }

    const imageSrc = row.thumbnail
      ? formatCloudImageUri(row.thumbnail)
      : row.image_url || null;

    return (
      <div className="d-flex align-items-center" style={{ gap: "8px" }}>
        {imageSrc && (
          <ThumbnailHoverZoom>
            <DokulyImage
              src={imageSrc}
              alt="Thumbnail"
              style={{
                width: "50px",
                height: "50px",
                objectFit: "contain",
                flexShrink: 0,
              }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = "none";
              }}
            />
          </ThumbnailHoverZoom>
        )}
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: "13px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {row.full_part_number || row.full_doc_number || "Unknown"}
          </div>
          {row.display_name && (
            <div style={{ fontSize: "11px", color: "#666", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {row.display_name}
            </div>
          )}
        </div>
        {not_latest_rev_warning(row)}
      </div>
    );
  };

  const renderDisplay = showDetailedView ? renderDetailedDisplay : renderSimpleDisplay;

  return (
    <div ref={editorRef} className="d-flex w-100" style={{ minWidth: "200px" }}>
      {readOnly ? (
        renderDisplay()
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
        <div className="w-100" style={{ cursor: "pointer" }} onClick={() => setIsEditing(true)}>
          {renderDisplay()}
        </div>
      )}
    </div>
  );
};

export default InlineItemSelector;
