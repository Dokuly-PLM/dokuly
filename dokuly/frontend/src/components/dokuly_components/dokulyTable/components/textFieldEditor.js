import React, { useState, useEffect, useRef } from "react";
import DokulyMarkdown from "../../dokulyMarkdown/dokulyMarkdown";

const TextFieldEditor = ({
  text,
  setText,
  onBlur,
  searchString = "", // if searchString is provided, the matching text will be set to bold
  maxWidth = "400px",
  multiline = false,
  readOnly = false,
  renderAsSpan = false,
  isMarkdown = true,
}) => {
  const [value, setValue] = useState(text);
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    setValue(text);
  }, [text]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      const length = inputRef.current.value.length;
      inputRef.current.setSelectionRange(length, length);
    }
  }, [isEditing]);

  const handleChange = (event) => {
    setValue(event.target.value);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !multiline) {
      setText(value);
      onBlur && onBlur();
      setIsEditing(false);
      event.preventDefault();
    } else if (event.key === "Escape") {
      setValue(text);
      onBlur && onBlur();
      setIsEditing(false);
    }
  };

  const handleBlur = () => {
    setText(value);
    onBlur && onBlur();
    setIsEditing(false);
  };

  const displayStyle = {
    maxWidth,
    overflow: multiline ? "visible" : "hidden",
    textOverflow: multiline ? "clip" : "ellipsis",
    whiteSpace: multiline ? "normal" : "nowrap",
    cursor: readOnly ? "default" : "pointer",
  };

  // Function to add markdown bold (**) around search matches
  const getMarkdownHighlightedText = (text, highlight) => {
    const trimmedHighlight = highlight.trim(); // Remove leading and trailing whitespace
    if (!trimmedHighlight) return text;
    const regex = new RegExp(`(${trimmedHighlight})`, "gi");
    return text.replace(regex, "**$1**"); // Wrap the matched text with Markdown bold syntax
  };

  if (isEditing) {
    return multiline ? (
      <textarea
        ref={inputRef}
        className="input-edit"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        autoFocus
        style={{ maxWidth, height: "100px" }}
      />
    ) : (
      <input
        ref={inputRef}
        className="input-edit"
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        autoFocus
        style={{ maxWidth }}
      />
    );
  }

  if (!isMarkdown) {
    if (renderAsSpan) {
      return (
        <span
          onClick={() => !readOnly && setIsEditing(true)} // Prevent entering edit mode if readOnly is true
          style={displayStyle}
        >
          {value ? value : "--"}
        </span>
      );
    }
    return (
      <div
        onClick={() => !readOnly && setIsEditing(true)} // Prevent entering edit mode if readOnly is true
        style={displayStyle}
      >
        {value ? value : "--"}
      </div>
    );
  }

  if (renderAsSpan) {
    // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
    <span
      onClick={() => !readOnly && setIsEditing(true)} // Prevent entering edit mode if readOnly is true
      style={displayStyle}
    >
      {value ? (
        <DokulyMarkdown
          markdownText={getMarkdownHighlightedText(value, searchString)} // Pass the markdown text with bold syntax
        />
      ) : (
        "--"
      )}
    </span>;
  }

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
    <div
      onClick={() => !readOnly && setIsEditing(true)} // Prevent entering edit mode if readOnly is true
      style={displayStyle}
    >
      {value ? (
        <DokulyMarkdown
          markdownText={getMarkdownHighlightedText(value, searchString)} // Pass the markdown text with bold syntax
        />
      ) : (
        "--"
      )}
    </div>
  );
};

export default TextFieldEditor;
