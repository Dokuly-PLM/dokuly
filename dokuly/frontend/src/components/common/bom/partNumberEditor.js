import React, { useState, useEffect, useRef } from "react";
import { editBomItem } from "./functions/queries";
import { toast } from "react-toastify";
import GlobalPartSelection from "../../dokuly_components/globalPartSelector/globalPartSelection";

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
  className = "d-flex w-100",
  innerClassName = "w-100",
  style = { minWidth: "200px" },
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [selected_item, setSelectedItem] = useState(null);

  const globalPartSelectionRef = useRef(null);
  const editorRef = useRef(null);
  const inputRef = useRef(null);

  const searchTerm = row.full_part_number
    ? row.full_part_number
    : row.temporary_mpn;

  useEffect(() => {
    if (selected_item) {
      const idField =
        {
          Part: "part",
          PCBA: "pcba",
          Assembly: "assembly",
        }[selected_item.item_type] || "item_id";

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
  }, [selected_item]);

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
        setExpandCol(false);
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
    if (!(row.part || row.assembly || row.pcba)) {
      return "-";
    }

    const displayPartNumber =
      row?.full_part_number ? (
        <React.Fragment>
          {row?.full_part_number}{" "}
          {not_latest_rev_warning(row)}
        </React.Fragment>
      ) : isEditing ? (
        ""
      ) : (
        "Unknown"
      );

    return displayPartNumber;
  }

  // Display "-" when designator is empty and not editing
  const displayPartNumber = get_display_string();

  return (
    <div ref={editorRef} className={className} style={{ ...style }}>
      {is_locked_bom ? (
        <span>{displayPartNumber}</span>
      ) : isEditing ? (
        <div ref={globalPartSelectionRef}>
          <GlobalPartSelection
            searchTerm={searchTerm}
            setSelectedItem={setSelectedItem}
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
  );
};

export default PartNumberEditor;
