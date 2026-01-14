import React, { useEffect, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Card } from "react-bootstrap";

const FileUpload = ({
  onFileSelect,
  file,
  setFile,
  instructionText = "Drag files here, or click to select files",
  multiple = false,
}) => {
  const onDrop = useCallback(
    (acceptedFiles) => {
      if (multiple) {
        if (onFileSelect) {
          onFileSelect(acceptedFiles);
        }
      } else {
        const uploadedFile = acceptedFiles[0];
        setFile(uploadedFile); // Use the setFile from props
        if (onFileSelect) {
          onFileSelect(uploadedFile);
        }
      }
    },
    [onFileSelect, setFile, multiple],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple,
  });

  const handlePaste = useCallback(
    (event) => {
      const items = event.clipboardData.items;
      for (const item of items) {
        if (item.type.indexOf("image") === 0) {
          const pastedFile = item.getAsFile();
          if (multiple) {
            if (onFileSelect) {
              onFileSelect([pastedFile]);
            }
          } else {
            setFile(pastedFile); // Use the setFile from props
            if (onFileSelect) {
              onFileSelect(pastedFile);
            }
          }
          break;
        }
      }
    },
    [onFileSelect, setFile, multiple],
  );

  useEffect(() => {
    // Attach the paste event listener when the component mounts
    window.addEventListener("paste", handlePaste);

    // Clean up the event listener when the component unmounts
    return () => {
      window.removeEventListener("paste", handlePaste);
    };
  }, [handlePaste]);

  return (
    <Card className="file-upload-wrapper">
      <Card.Body
        {...getRootProps()}
        className={`dropzone ${isDragActive ? "active" : ""}`}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the file here ...</p>
        ) : (
          <p>{instructionText}</p>
        )}
      </Card.Body>
      {file && <Card.Footer className="file-info">{file.name}</Card.Footer>}
    </Card>
  );
};

export default FileUpload;
