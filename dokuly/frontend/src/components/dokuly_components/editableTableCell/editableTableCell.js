import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";

const EditableTableCell = ({
  value,
  isEditable = true,
  onSave,
  onPaste = null,
  placeholder = "",
  minWidth = "4rem",
  inputWidth = "100%",
  allowEmpty = true,
  emptyDisplayValue = "-",
  successMessage = null,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value || "");
  const [originalValue, setOriginalValue] = useState(value || "");
  const [isEnterPressed, setIsEnterPressed] = useState(false);

  const editorRef = useRef(null);
  const inputRef = useRef(null);

  // Update values when prop changes
  useEffect(() => {
    const newValue = value || "";
    setCurrentValue(newValue);
    setOriginalValue(newValue);
  }, [value]);

  // Handle click outside to revert changes
  useEffect(() => {
    function handleClickOutside(event) {
      if (editorRef.current && !editorRef.current.contains(event.target)) {
        // Reset to original value and exit edit mode
        setCurrentValue(originalValue);
        setIsEditing(false);
      }
    }

    // Bind the event listener
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      // Unbind the event listener on clean up
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [editorRef, originalValue]);

  // Focus and select input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleBlur = () => {
    // Reset to original value instead of saving
    setCurrentValue(originalValue);
    setIsEditing(false);
  };

  const handleSave = async () => {
    // Trim whitespace for validation but preserve original spaces if needed
    const trimmedValue = currentValue.trim();

    // Check if empty values are allowed
    if (!allowEmpty && trimmedValue === "") {
      toast.error(`Please enter a valid ${placeholder.toLowerCase() || "value"}.`);
      setCurrentValue(originalValue);
      setIsEditing(false);
      return;
    }

    // Don't bother sending request when no real change
    if (currentValue === originalValue) {
      setIsEditing(false);
      return;
    }

    try {
      await onSave(currentValue);
      if (successMessage) {
        toast.success(successMessage);
      }
      setOriginalValue(currentValue); // Update originalValue after successful update
      setIsEditing(false);
    } catch (error) {
      toast.error(`Error saving ${placeholder.toLowerCase() || "value"}: ${error.message || error}`);
      setCurrentValue(originalValue);
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      setIsEnterPressed(true);
      // Don't save yet - wait for keyup
    } else if (e.key === "Escape") {
      setCurrentValue(originalValue);
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

  const handlePaste = (e) => {
    if (onPaste) {
      // Custom paste handler takes precedence
      onPaste(e, setCurrentValue);
    } else {
      // Default behavior - just paste the text
      e.preventDefault();
      const pastedText = e.clipboardData.getData("text");
      setCurrentValue(pastedText);
    }
  };

  // Display value or placeholder when empty
  const displayValue = currentValue || (isEditing ? "" : emptyDisplayValue);

  if (!isEditable) {
    return <span>{displayValue}</span>;
  }

  return (
    <div ref={editorRef} className="d-flex w-100" style={{ minWidth }}>
      {isEditing ? (
        <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <input
            ref={inputRef}
            type="text"
            value={currentValue}
            onChange={(e) => setCurrentValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            onKeyUp={handleKeyUp}
            onPaste={handlePaste}
            placeholder={placeholder}
            title="Press Enter to submit, Escape to cancel"
            style={{ width: inputWidth }}
          />
          <span style={{ 
            marginLeft: '4px', 
            fontSize: '12px', 
            color: '#666', 
            userSelect: 'none',
            padding: '2px 4px',
            borderRadius: '3px',
            backgroundColor: isEnterPressed ? '#e0e0e0' : 'transparent',
            transition: 'background-color 0.15s ease'
          }}>↵</span>
        </div>
      ) : (
        <div 
          className="w-100 bom-editable-field"
          onClick={() => setIsEditing(true)}
          style={{ minHeight: '1.5em', display: 'flex', alignItems: 'center' }}
        >
          <span>{displayValue}</span>
          <img 
            src="../../static/icons/edit.svg" 
            alt="edit"
            className="icon-dark bom-edit-icon"
          />
        </div>
      )}
    </div>
  );
};

export default EditableTableCell;