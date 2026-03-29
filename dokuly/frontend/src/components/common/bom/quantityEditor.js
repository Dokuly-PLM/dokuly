import React, { useState, useEffect, useRef } from "react";
import { editBomItem } from "./functions/queries";
import { toast } from "react-toastify";

const QuantityEditor = ({
  row,
  is_locked_bom,
  setRefreshBom,
  displayProductionQuantity = false,
  displayOnlyProductionQuantity = false,
  productionQuantity = 0,
  autoFocus = false,
  onFocusApplied = () => {},
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [quantity, setQuantity] = useState(row.quantity || "");
  const [originalQuantity, setOriginalQuantity] = useState(row.quantity || "");
  const [isEnterPressed, setIsEnterPressed] = useState(false);

  const editorRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (row?.order_quantity) {
      setQuantity(row.order_quantity || "");
      setOriginalQuantity(row.order_quantity || "");
    } else {
      setQuantity(row.quantity || "");
      setOriginalQuantity(row.quantity || "");
    }
  }, [row]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (editorRef.current && !editorRef.current.contains(event.target)) {
        // Reset to original value and exit edit mode
        setQuantity(originalQuantity);
        setIsEditing(false);
      }
    }

    // Bind the event listener
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      // Unbind the event listener on clean up
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [editorRef, originalQuantity]);

  useEffect(() => {
    if (autoFocus && !is_locked_bom && !isEditing) {
      setIsEditing(true);
      onFocusApplied();

      // Scroll into view
      if (editorRef.current) {
        editorRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }
  }, [autoFocus, is_locked_bom, isEditing, onFocusApplied]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleBlur = () => {
    // Reset to original value instead of saving
    setQuantity(originalQuantity);
    setIsEditing(false);
  };

  const handleSave = () => {
    // Only send request if there's a change in quantity
    if (quantity === originalQuantity) {
      setIsEditing(false);
      return;
    }

    if (quantity <= 0) {
      toast.error("Quantity must be greater than 0");
      setQuantity(originalQuantity);
      setIsEditing(false);
      return;
    }

    const data = { quantity: quantity };
    editBomItem(row.id, data)
      .then((response) => {
        toast.success("Quantity updated");
        setOriginalQuantity(quantity); // Update originalQuantity after successful update
        setRefreshBom();
        setIsEditing(false);
      })
      .catch((error) => {
        toast.error("Error updating quantity:", error);
        setQuantity(originalQuantity);
        setIsEditing(false);
      });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      setIsEnterPressed(true);
      // Don't save yet - wait for keyup
    } else if (e.key === "Escape") {
      setQuantity(originalQuantity);
      setIsEditing(false);
      if (inputRef.current) {
        inputRef.current.blur();
      }
    }
  };

  const handleKeyUp = (e) => {
    if (e.key === "Enter" && isEnterPressed) {
      setIsEnterPressed(false);
      handleSave();
    }
  };

  // Determine the unit to display
  const unit = row.part && row.unit ? row.unit : "pcs";

  // Display "-" when quantity is empty and not editing
  const displayQuantity = quantity || (isEditing ? "" : "-");

  // When the BOM is locked, show quantity and unit as text.
  // When the BOM is unlocked, allow editing of quantity on click.
  return (
    <div ref={editorRef} className="d-flex w-100" style={{ minWidth: "100px" }}>
      {is_locked_bom ? (
        <>
          {!displayOnlyProductionQuantity ? (
            <span>
              {`${displayQuantity} ${unit}`}{" "}
              {displayProductionQuantity &&
                `(${displayQuantity * productionQuantity})`}
            </span>
          ) : (
            <span>{`${displayQuantity * productionQuantity} ${unit}`}</span>
          )}
        </>
      ) : isEditing ? (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <input
            ref={inputRef}
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}            onKeyUp={handleKeyUp}            title="Press Enter to submit, Escape to cancel"
            style={{ width: "3rem" }} // CSS style for input width
          />
          <span style={{ 
            marginLeft: '2px', 
            fontSize: '12px', 
            color: '#666', 
            userSelect: 'none',
            padding: '2px 4px',
            borderRadius: '3px',
            backgroundColor: isEnterPressed ? '#e0e0e0' : 'transparent',
            transition: 'background-color 0.15s ease'
          }}>↵</span>
          <span style={{ marginLeft: '2px' }}> {unit}</span>
        </div>
      ) : (
        // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
        <span className="w-100" onClick={() => setIsEditing(true)}>
          {`${displayQuantity} ${unit}`}{" "}
          {displayProductionQuantity &&
            `(${displayQuantity * productionQuantity})`}
        </span>
      )}
    </div>
  );
};

export default QuantityEditor;
