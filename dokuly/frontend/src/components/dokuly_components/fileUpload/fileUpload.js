import React, { useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card } from 'react-bootstrap';

const FileUpload = ({ onFileSelect, file, setFile, instructionText = "Drag a file here, or click to select a file" }) => {
  const onDrop = useCallback(acceptedFiles => {
    const uploadedFile = acceptedFiles[0];
    setFile(uploadedFile); // Use the setFile from props
    if (onFileSelect) {
      onFileSelect(uploadedFile);
    }
  }, [onFileSelect, setFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const handlePaste = useCallback((event) => {
    const items = event.clipboardData.items;
    for (const item of items) {
      if (item.type.indexOf('image') === 0) {
        const file = item.getAsFile();
        setFile(file); // Use the setFile from props
        if (onFileSelect) {
          onFileSelect(file);
        }
        break;
      }
    }
  }, [onFileSelect, setFile]);

  useEffect(() => {
    // Attach the paste event listener when the component mounts
    window.addEventListener('paste', handlePaste);

    // Clean up the event listener when the component unmounts
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [handlePaste]);

  return (
    <Card className="file-upload-wrapper">
      <Card.Body {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
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
