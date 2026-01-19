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
        setIsEditing(false);
      }
    }

    // Bind the event listener
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      // Unbind the event listener on clean up
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [editorRef]);

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
    setIsEditing(false);
    // Only send request if there's a change in quantity
    if (quantity === originalQuantity) {
      return;
    }

    if (quantity <= 0) {
      toast.error("Quantity must be greater than 0");
      return;
    }

    const data = { quantity: quantity };
    editBomItem(row.id, data)
      .then((response) => {
        toast.success("Quantity updated");
        setOriginalQuantity(quantity); // Update originalQuantity after successful update
        setRefreshBom(true);
      })
      .catch((error) => {
        toast.error("Error updating quantity:", error);
      });
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
        <>
          <input
            ref={inputRef}
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            onBlur={handleBlur}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                handleBlur();
              }
            }}
            style={{ width: "3rem" }} // CSS style for input width
          />
          <span> {unit}</span>
        </>
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
