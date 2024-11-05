import React, { useState, useEffect, useRef, useCallback } from "react";
import { FormControl, Container, Row, Col, Button } from "react-bootstrap";

import SubmitButton from "../submitButton";
import DokulyMarkdown from "./dokulyMarkdown";
import EditButton from "../editButton";
import CancelButton from "../cancelButton";
import SymbolsDropdown from "./components/symbolsDropdown";
import { handlePaste } from "./functions/handlePaste";
import BlockquoteDropdown from "./components/blockQuoteDropdown";
import EmojiPicker, { Emoji, EmojiStyle } from "emoji-picker-react";

const MAX_HISTORY = 100;

const EditableMarkdown = ({
  initialMarkdown,
  onSubmit,
  projectId = -1, // This id is used to upload images to the correct project
  showEmptyBorder = true,
  readOnly = false,
  showDownload = true,
  wrapperStyle = {},
  initialOpen = false,
  setMarkdownText = () => {},
}) => {
  const [editMode, setEditMode] = useState(false);
  const [markdown, setMarkdown] = useState(initialMarkdown || "");
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [formattingMode, setFormattingMode] = useState(null); // Tracks the current formatting mode: null, 'bullet', or 'checkbox'
  const [isSplitView, setIsSplitView] = useState(false);
  const [
    hasSetTextAreaHeightOnInitialOpen,
    setHasSetTextAreaHeightOnInitialOpen,
  ] = useState(false);
  const textAreaRef = useRef(null); // Ref for accessing the textarea DOM element
  const markdownRef = useRef(null);

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  useEffect(() => {
    setMarkdown(initialMarkdown || "");
  }, [initialMarkdown]);

  useEffect(() => {
    setMarkdownText(markdown);
  }, [markdown]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape" && editMode) {
        if (!confirm("Are you sure you want to discard your changes?")) {
          return;
        }
        setEditMode(false);
        setMarkdown(initialMarkdown || "");
        setFormattingMode(null);
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [editMode, initialMarkdown]);

  useEffect(() => {
    const handleKeyDownEvent = (event) => handleKeyDown(event);

    window.addEventListener("keydown", handleKeyDownEvent);

    return () => {
      window.removeEventListener("keydown", handleKeyDownEvent);
    };
  }, [editMode, markdown, formattingMode]);

  useEffect(() => {
    if (editMode && textAreaRef.current) {
      adjustTextareaHeight();
      textAreaRef.current.focus(); // Automatically focus the textarea when edit mode is enabled
    }
  }, [editMode]); // This effect runs whenever editMode changes

  const adjustTextareaHeight = () => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = "auto";
      textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
    }
  };

  const handleChange = (event) => {
    pushUndoStack();
    setMarkdown(event.target.value);
  };

  const handleKeyDown = (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault(); // Prevent the default Enter behavior
      handleSave(); // Call handleSave when Ctrl+Enter or Cmd+Enter is pressed
    } else if ((event.ctrlKey || event.metaKey) && event.key === "z") {
      event.preventDefault(); // Prevent the default undo behavior
      handleUndo(); // Call handleUndo when Ctrl+Z or Cmd+Z is pressed
    } else if (
      (event.ctrlKey || event.metaKey) &&
      event.shiftKey &&
      event.key === "z"
    ) {
      event.preventDefault(); // Prevent the default redo behavior
      handleRedo(); // Call handleRedo when Ctrl+Shift+Z or Cmd+Shift+Z is pressed
    }

    if (formattingMode === "bullet" && event.key === "Enter") {
      event.preventDefault();
      insertMarkdownSyntax("bullet");
    }

    if (formattingMode === "checkbox" && event.key === "Enter") {
      event.preventDefault();
      insertMarkdownSyntax("checkbox");
    }
  };

  const insertCheckbox = (before, selected, after) => {
    const prefix = before.trim().length > 0 ? "\n" : "";
    return `${before}${prefix}- [ ] ${selected || ""}${after}`.replace(
      /\n{2,}/g,
      "\n"
    );
  };

  const insertMarkdownSyntax = (syntax) => {
    pushUndoStack();
    const { value, selectionStart, selectionEnd } = textAreaRef.current;
    const before = value.substring(0, selectionStart);
    const selected = value.substring(selectionStart, selectionEnd);
    const after = value.substring(selectionEnd);

    let newValue;
    switch (syntax) {
      case "header1":
        newValue = `${before}# ${selected || ""}${after}`;
        break;
      case "header2":
        newValue = `${before}## ${selected || ""}${after}`;
        break;
      case "header3":
        newValue = `${before}### ${selected || ""}${after}`;
        break;
      case "bold":
        newValue = `${before}**${selected || "bold text"}**${after}`;
        break;
      case "italic":
        newValue = `${before}*${selected || "italic text"}*${after}`;
        break;
      case "strikethrough":
        newValue = `${before}~~${selected || "strikethrough text"}~~${after}`;
        break;
      case "underline":
        newValue = `${before}<u>${selected || "underlined text"}</u>${after}`;
        break;
      case "link":
        newValue = `${before}[link text](${selected || "url"})${after}`;
        break;
      case "image":
        newValue = `${before}![alt text](${selected || "url"})${after}`;
        break;
      case "bullet":
        newValue = `${before}\n- ${selected}${after}`.replace(/\n{2,}/g, "\n");
        break;
      case "checkbox":
        newValue = insertCheckbox(before, selected, after);
        break;
      default:
        return;
    }

    setMarkdown(newValue);
    textAreaRef.current.focus(); // Refocus text input after inserting syntax
    const newCursorPosition =
      before.length + (selected ? selected.length : 10) + 4; // Adjust cursor position relevantly
    textAreaRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
  };

  const handleSave = () => {
    onSubmit(markdown);
    setEditMode(false);
  };

  const insertBlockquote = (prefix) => {
    pushUndoStack(); // Save current state to undo stack
    const { value, selectionStart, selectionEnd } = textAreaRef.current;
    const before = value.substring(0, selectionStart); // Text before the selection
    const selected = value.substring(selectionStart, selectionEnd); // Text that is selected
    const after = value.substring(selectionEnd); // Text after the selection

    // Split selected text into lines
    const lines = selected.split("\n");

    // Modify lines: prepend blockquote syntax to the first line and add > \n to subsequent lines
    const modifiedLines = lines.map((line, index) => {
      if (index === 0) {
        return `${prefix}${line}`; // Add prefix to the first line
      } else if (line.length > 0) {
        return `> \n> ${line}`; // Add > on an empty line before each line that contains text
      } else {
        return "> "; // Just add > for completely empty lines
      }
    });

    // Join the modified lines with newlines
    const modifiedSelected = modifiedLines.join("\n");

    // Construct the new value with a final blockquote symbol if the last line had text
    const newValue = `${before}${modifiedSelected}${
      after.length > 0 ? "\n> " + after : after
    }`;
    setMarkdown(newValue);

    // Update cursor position to the end of the inserted text
    const newCursorPosition =
      before.length + modifiedSelected.length + (after.length > 0 ? 3 : 0);
    setTimeout(() => {
      textAreaRef.current.focus();
      textAreaRef.current.setSelectionRange(
        newCursorPosition,
        newCursorPosition
      );
    }, 0);
  };

  const handlePasteEvent = useCallback(
    async (event) => {
      await handlePaste(
        event,
        projectId,
        markdown,
        textAreaRef.current.selectionStart,
        textAreaRef.current.selectionEnd,
        setMarkdown,
        (start, end) => {
          textAreaRef.current.setSelectionRange(start, end);
          textAreaRef.current.focus();
        }
      );
    },
    [projectId, markdown]
  );

  const pushUndoStack = () => {
    setUndoStack((prevUndoStack) => {
      const newUndoStack = [...prevUndoStack, markdown];
      if (newUndoStack.length > MAX_HISTORY) {
        newUndoStack.shift();
      }
      return newUndoStack;
    });
    setRedoStack([]); // Clear redo stack when new change is made
  };

  const handleUndo = () => {
    if (undoStack.length > 0) {
      const previousState = undoStack.pop();
      setRedoStack((prevRedoStack) => [markdown, ...prevRedoStack]);
      setMarkdown(previousState);
    }
  };

  const handleRedo = () => {
    if (redoStack.length > 0) {
      const nextState = redoStack.shift();
      setUndoStack((prevUndoStack) => [...prevUndoStack, markdown]);
      setMarkdown(nextState);
    }
  };

  const contentStyle = {
    border: showEmptyBorder ? "1px solid #ced4da" : "none",
    borderRadius: "16px",
    minHeight: "100px",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    alignItems: markdown ? "stretch" : "center",
    overflow: "auto",
  };

  const markdownStyle = {
    maxWidth: "100%",
    overflow: "hidden",
  };

  const handleDoubleClick = () => {
    if (!readOnly) {
      setEditMode(true);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open("", "PRINT", "height=600,width=800");
    const content = markdownRef.current?.innerHTML;

    if (printWindow) {
      const headContent = document.head.innerHTML;

      printWindow.document.write(`
        <html>
          <head>
            <title>Print Markdown</title>
            ${headContent}
          </head>
          <body>
            ${content}
          </body>
        </html>`);

      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
  };

  const splitViewStyles = {
    display: "flex",
    flexDirection: "row",
  };

  const editorStyle = {
    flex: "1",
    marginRight: isSplitView ? "10px" : "0",
  };

  const previewStyle = {
    flex: "1",
    border: "1px solid #ced4da",
    borderRadius: "16px",
    padding: "16px",
    overflow: "auto",
    display: isSplitView ? "block" : "none",
  };

  const insertMarkdownSymbol = (symbol) => {
    pushUndoStack();
    const { value, selectionStart, selectionEnd } = textAreaRef.current;
    const before = value.substring(0, selectionStart);
    const after = value.substring(selectionEnd);

    const newValue = `${before}${symbol}${after}`;

    setMarkdown(newValue);
    textAreaRef.current.focus(); // Refocus text input after inserting symbol
    const newCursorPosition = before.length + symbol.length;
    textAreaRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
  };

  const handleSymbolSelect = (symbol) => {
    insertMarkdownSymbol(symbol);
  };

  const toggleEmojiPicker = (event) => {
    // Toggle visibility
    const isVisible = !showEmojiPicker;
    setShowEmojiPicker(isVisible);
  };

  const handleEmojiClick = (emojiObject, event) => {
    setMarkdown((prev) => `${prev}${emojiObject?.emoji}`);
    setShowEmojiPicker(false);
  };

  // Effect to handle initialOpen prop
  useEffect(() => {
    if (initialOpen) {
      // Delay setting edit mode by 50ms if initialOpen is true
      const timer = setTimeout(() => {
        setEditMode(true);
      }, 50);
      // Cleanup timer if the component unmounts
      return () => clearTimeout(timer);
    }
  }, [initialOpen]);

  return (
    <Container fluid style={wrapperStyle}>
      <div style={isSplitView ? splitViewStyles : {}}>
        {editMode ? (
          <>
            <div style={editorStyle}>
              <Row>
                <Col>
                  <button
                    className="btn btn-sm btn-background-transparent"
                    onClick={handleUndo}
                    disabled={undoStack.length === 0}
                  >
                    <img
                      src="../../static/icons/corner-up-left.svg"
                      alt="undo"
                      style={{
                        width: "20px",
                        height: "20px",
                      }}
                    />
                  </button>
                  <button
                    className="btn btn-sm btn-background-transparent"
                    onClick={handleRedo}
                    disabled={redoStack.length === 0}
                  >
                    <img
                      src="../../static/icons/corner-up-right.svg"
                      alt="undo"
                      style={{
                        width: "20px",
                        height: "20px",
                      }}
                    />
                  </button>
                  <img
                    src="../../static/icons/type-h1.svg"
                    alt="Header"
                    onClick={() => {
                      insertMarkdownSyntax("header1");
                      textAreaRef.current.focus();
                    }}
                    style={{
                      width: "20px",
                      height: "20px",
                      margin: "5px",
                      cursor: "pointer",
                    }}
                    title="Click to insert a header."
                  />
                  <img
                    src="../../static/icons/type-h2.svg"
                    alt="Header"
                    onClick={() => {
                      insertMarkdownSyntax("header2");
                      textAreaRef.current.focus();
                    }}
                    style={{
                      width: "20px",
                      height: "20px",
                      margin: "5px",
                      cursor: "pointer",
                    }}
                    title="Click to insert a header 2."
                  />
                  <img
                    src="../../static/icons/type-h3.svg"
                    alt="Header"
                    onClick={() => {
                      insertMarkdownSyntax("header3");
                      textAreaRef.current.focus();
                    }}
                    style={{
                      width: "20px",
                      height: "20px",
                      margin: "5px",
                      cursor: "pointer",
                    }}
                    title="Click to insert a header 3."
                  />
                  {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
                  <img
                    src="../../static/icons/type-bold.svg"
                    alt="bold"
                    onClick={() => {
                      insertMarkdownSyntax("bold");
                      textAreaRef.current.focus();
                    }}
                    style={{
                      width: "20px",
                      height: "20px",
                      margin: "5px",
                      cursor: "pointer",
                    }}
                    title="Click to insert bold text."
                  />

                  {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
                  <img
                    src="../../static/icons/type-italic.svg"
                    alt="italic"
                    onClick={() => {
                      insertMarkdownSyntax("italic");
                      textAreaRef.current.focus();
                    }}
                    style={{
                      width: "20px",
                      height: "20px",
                      margin: "5px",
                      cursor: "pointer",
                    }}
                    title="Click to insert italic text."
                  />

                  <img
                    src="../../static/icons/type-underline.svg"
                    alt="underline"
                    onClick={() => {
                      insertMarkdownSyntax("underline");
                      textAreaRef.current.focus();
                    }}
                    style={{
                      width: "20px",
                      height: "20px",
                      margin: "5px",
                      cursor: "pointer",
                    }}
                    title="Click to insert underlined text."
                  />
                  <img
                    src="../../static/icons/type-strikethrough.svg"
                    alt="strikethrough"
                    onClick={() => {
                      insertMarkdownSyntax("strikethrough");
                      textAreaRef.current.focus();
                    }}
                    style={{
                      width: "20px",
                      height: "20px",
                      margin: "5px",
                      cursor: "pointer",
                    }}
                    title="Click to insert strikethrough text."
                  />

                  {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
                  <img
                    src="../../static/icons/link.svg"
                    alt="link"
                    onClick={() => {
                      insertMarkdownSyntax("link");
                      textAreaRef.current.focus();
                    }}
                    style={{
                      width: "20px",
                      height: "20px",
                      margin: "5px",
                      cursor: "pointer",
                    }}
                    title="Click to insert a link. Example: [link text](url)"
                  />
                  {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
                  <img
                    src="../../static/icons/photo.svg"
                    alt="link"
                    onClick={() => {
                      insertMarkdownSyntax("image");
                      textAreaRef.current.focus();
                    }}
                    style={{
                      width: "20px",
                      height: "20px",
                      margin: "5px",
                      cursor: "pointer",
                    }}
                    title={`Click to insert an image.
                    Styles can be applied to images using CSS.
                    Example: ![alt text](url "style")
                    Below are commonly used CSS properties that you can apply to images:
            
                    - Width and Height
                      - width: Specifies the width of the image.
                      - height: Specifies the height of the image.
                      - Example: 'width:200px;height:100px;'
            
                    - Borders
                      - border: Sets the border around the image.
                      - Example: "border:1px solid #ccc;"
            
                    - Padding
                      - padding: Sets the padding area inside the borders of the image.
                      - Example: "padding:5px;"
            
                    - Margins
                      - margin: Sets the space around elements, outside of borders.
                      - Example: "margin:10px;"
            
                    - Alignment
                      - display: Set to block to allow use of margin: auto; for centering.
                      - margin-left: Specifically aligns an image to the left or right.
                      - margin-right: See above.
                      - Example: "display:block;margin:auto;" (for centering)`}
                  />
                  {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
                  <img
                    src="../../static/icons/clipboard-list.svg"
                    alt="bullet"
                    onClick={() => {
                      if (formattingMode !== "bullet") {
                        setFormattingMode("bullet");
                        insertMarkdownSyntax("bullet");
                        textAreaRef.current.focus();
                      } else {
                        setFormattingMode(null);
                        textAreaRef.current.focus();
                      }
                    }}
                    style={{
                      width: "20px",
                      height: "20px",
                      margin: "5px",
                      cursor: "pointer",
                      border:
                        formattingMode === "bullet"
                          ? "2px solid green"
                          : "none",
                      borderRadius: "4px",
                      boxShadow:
                        formattingMode === "bullet" ? "0 0 5px green" : "none",
                    }}
                    title="Click to enter bullet list mode."
                  />
                  {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
                  <img
                    src="../../static/icons/clipboard-check.svg"
                    alt="checkbox"
                    onClick={() => {
                      if (formattingMode !== "checkbox") {
                        setFormattingMode("checkbox");
                        insertMarkdownSyntax("checkbox");
                        textAreaRef.current.focus();
                      } else {
                        setFormattingMode(null);
                        textAreaRef.current.focus();
                      }
                    }}
                    style={{
                      width: "20px",
                      height: "20px",
                      margin: "5px",
                      cursor: "pointer",
                      border:
                        formattingMode === "checkbox"
                          ? "2px solid green"
                          : "none",
                      borderRadius: "4px",
                      boxShadow:
                        formattingMode === "checkbox"
                          ? "0 0 5px green"
                          : "none",
                    }}
                    title="Click to enter checkbox list mode."
                  />
                  <SymbolsDropdown
                    rows={5}
                    cols={40}
                    onSelect={handleSymbolSelect}
                  />
                  <BlockquoteDropdown onSelect={insertBlockquote} />
                  <button
                    type="button"
                    className="mx-2 btn btn-sm btn-background-transparent"
                    onClick={toggleEmojiPicker}
                  >
                    <Emoji
                      unified="1f60a"
                      size="20"
                      emojiStyle={EmojiStyle.NATIVE}
                    />
                  </button>
                  {showEmojiPicker && (
                    <EmojiPicker
                      onEmojiClick={handleEmojiClick}
                      autoFocusSearch={false}
                      reactionsDefaultOpen={false}
                      allowExpandReactions={true}
                      skinTonesDisabled={false}
                      emojiStyle={EmojiStyle.NATIVE}
                      categories={[
                        {
                          category: "suggested",
                          name: "Recently Used",
                        },
                        {
                          category: "smileys_people",
                          name: "Faces & People",
                        },
                      ]}
                      open={showEmojiPicker}
                      style={{
                        position: "absolute",
                        top: "35px",
                        left: "0",
                        right: "0",
                        margin: "auto", // Automatically centers horizontally
                        zIndex: 1000, // Ensure it's above other content
                      }}
                    />
                  )}
                  <button
                    type="button"
                    className="btn btn-sm btn-background-transparent"
                    onClick={() => setIsSplitView(!isSplitView)}
                  >
                    {isSplitView ? "Hide Split View" : "Show Split View"}
                  </button>
                </Col>
              </Row>
              <FormControl
                as="textarea"
                ref={textAreaRef}
                rows={10}
                value={markdown}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onPaste={handlePasteEvent}
                style={{
                  marginBottom: "10px",
                  width: "100%",
                  border: "1px solid #165216",
                  boxShadow: "none",
                  padding: "8px",
                  borderRadius: "4px",
                }}
              />

              {!initialOpen && (
                <Row>
                  <Col>
                    <SubmitButton onClick={handleSave} type="submit">
                      Submit
                    </SubmitButton>{" "}
                    <CancelButton onClick={() => setEditMode(false)}>
                      Cancel
                    </CancelButton>
                  </Col>
                </Row>
              )}
              {!initialOpen && (
                <Row>
                  <small
                    className="form-text text-muted pl-3 mt-2"
                    style={{ marginBottom: "10px" }}
                  >
                    <kbd>ctrl</kbd> + <kbd>V</kbd> to insert an image from your
                    clipboard.
                    <b>
                      <kbd>ctrl</kbd> + <kbd>Enter</kbd>
                    </b>{" "}
                    to submit.
                  </small>
                </Row>
              )}
            </div>
            <div style={previewStyle}>
              <DokulyMarkdown markdownText={markdown} />
            </div>
          </>
        ) : (
          <>
            {markdown && !readOnly && (
              <Row style={{ marginTop: "10px" }}>
                <Col xs={12}>
                  <EditButton
                    buttonText="Edit"
                    onClick={() => setEditMode(true)}
                  />
                </Col>
              </Row>
            )}
            <div style={contentStyle} onDoubleClick={handleDoubleClick}>
              {markdown ? (
                <div
                  ref={markdownRef}
                  className="markdown-content"
                  style={markdownStyle}
                >
                  <DokulyMarkdown markdownText={markdown} />
                  {!readOnly && (
                    <Row>
                      <small
                        className="form-text text-muted pl-3 mt-2"
                        style={{ marginBottom: "10px" }}
                      >
                        Double-click the text to edit.
                      </small>
                    </Row>
                  )}
                </div>
              ) : (
                <>
                  {"Double-click to edit"}
                  <EditButton
                    buttonText="Edit"
                    onClick={() => setEditMode(true)}
                  />
                </>
              )}
            </div>
          </>
        )}
      </div>
      {showDownload && (
        <Button variant="dokuly-bg-transparent" onClick={handlePrint}>
          <img
            src="../../../static/icons/file-download.svg"
            alt="download pdf"
          />{" "}
          PDF
        </Button>
      )}
    </Container>
  );
};

export default EditableMarkdown;
