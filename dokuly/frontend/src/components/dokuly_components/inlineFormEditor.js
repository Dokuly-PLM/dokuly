import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";

const InlineFormEditor = ({
  value: initialValue,
  isLocked,
  onSubmit,
  formatter = (value) => value || "-",
  inputWidth = "6rem",
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialValue || "");
  const [originalValue, setOriginalValue] = useState(initialValue || "");

  const editorRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    setValue(initialValue || "");
    setOriginalValue(initialValue || "");
  }, [initialValue]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (editorRef.current && !editorRef.current.contains(event.target)) {
        handleBlur(); // Changed to directly invoke handleBlur
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [editorRef]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    if (value === "") {
      toast.error("Set valid value.");
      setValue(originalValue);
      return;
    }

    if (value !== originalValue) {
      onSubmit(value);
    }
  };

  const displayValue = formatter(value || (isEditing ? "" : "-"));

  return (
    <div ref={editorRef} className="d-flex w-100" style={{ minWidth: "4rem" }}>
      {isLocked ? (
        <span>{displayValue}</span>
      ) : isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleBlur} // Ensures that blur events trigger handleBlur
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              handleBlur();
            }
          }}
          style={{ width: inputWidth }}
        />
      ) : (
        <span
          style={{ cursor: "pointer" }}
          className="w-100"
          onClick={() => setIsEditing(true)}
        >
          {displayValue}
        </span>
      )}
    </div>
  );
};

export default InlineFormEditor;
