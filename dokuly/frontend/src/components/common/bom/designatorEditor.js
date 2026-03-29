import React, { useState, useEffect, useRef } from "react";
import { editBomItem } from "./functions/queries";
import { toast } from "react-toastify";
import { referenceDesignatorFormatter } from "./functions/referenceDesignatorFormatter";

const DesignatorEditor = ({ row, is_locked_bom, setRefreshBom }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [designator, setDesignator] = useState(row.designator || "");
  const [originalDesignator, setOriginalDesignator] = useState(
    row.designator || "",
  );

  const editorRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    setDesignator(row.designator || "");
    setOriginalDesignator(row.designator || "");
  }, [row.designator]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (editorRef.current && !editorRef.current.contains(event.target)) {
        // Reset to original value and exit edit mode
        setDesignator(originalDesignator);
        setIsEditing(false);
      }
    }

    // Bind the event listener
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      // Unbind the event listener on clean up
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [editorRef, originalDesignator]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleBlur = () => {
    // Reset to original value instead of saving
    setDesignator(originalDesignator);
    setIsEditing(false);
  };

  const handleSave = () => {
    // Only send request if there's a change in designator
    if (designator === "") {
      toast.error("Set valid designator.");
      setDesignator(originalDesignator);
      setIsEditing(false);
      return;
    }

    // Don't bother sending request when no real change.
    if (designator === originalDesignator) {
      setIsEditing(false);
      return;
    }

    const data = { designator: designator || "" };
    editBomItem(row.id, data)
      .then((response) => {
        toast.success("Designator updated");
        setOriginalDesignator(designator); // Update originalDesignator after successful update
        setIsEditing(false);
      })
      .catch((error) => {
        toast.error("Error updating designator:", error);
        setDesignator(originalDesignator);
        setIsEditing(false);
      });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      setDesignator(originalDesignator);
      setIsEditing(false);
      if (inputRef.current) {
        inputRef.current.blur();
      }
    }
  };

  // Display "-" when designator is empty and not editing
  const displayDesignator = designator || (isEditing ? "" : "-");

  // When the BOM is locked, show designator as text or placeholder.
  // When the BOM is unlocked, allow editing of designator on click.
  return (
    <div ref={editorRef} className="d-flex w-100" style={{ minWidth: "4rem" }}>
      {is_locked_bom ? (
        <span>{referenceDesignatorFormatter(displayDesignator)}</span>
      ) : isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={designator}
          onChange={(e) => setDesignator(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          style={{ width: "6rem" }} // CSS style for input width
        />
      ) : (
        <span className="w-100" onClick={() => setIsEditing(true)}>
          {referenceDesignatorFormatter(displayDesignator)}
        </span>
      )}
    </div>
  );
};

export default DesignatorEditor;
